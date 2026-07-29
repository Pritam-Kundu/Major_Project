const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const { createNotification } = require("./notification");

module.exports.index = async (req, res) => {
  const {
    category,
    search,
    checkIn,
    checkOut,
    guests,
    priceMin,
    priceMax,
    propertyType,
    sort
  } = req.query;
  
  let filter = {};

  if (category) filter.category = category;
  if (propertyType && propertyType !== "Any") filter.category = propertyType;

  /*
   * ADVANCED SEARCH LOGIC (MongoDB):
   * We check if the user provided a 'search' query in the URL (e.g., ?search=Goa).
   * If 'search' exists, we use MongoDB's '$or' operator to look for matches in multiple fields.
   * This means: "Find listings where the search term matches title OR location OR country OR category."
   * 
   * How it works:
   * - '$regex: search' matches partial words instead of requiring an exact match.
   * - '$options: "i"' makes the search case-insensitive (so "goa", "Goa", and "GOA" are treated the same).
   * - Since our database schema doesn't have an 'address' field, 'location' acts as the address search.
   */
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { country: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } }
    ];
  }

  if (priceMin || priceMax) {
    filter.price = {};
    if (priceMin) filter.price.$gte = Number(priceMin);
    if (priceMax) filter.price.$lte = Number(priceMax);
  }

  /*
   * PROFESSIONAL SORTING SYSTEM (MongoDB Aggregation):
   * Instead of a basic `Listing.find()`, we use a powerful aggregation pipeline.
   * This allows us to join the "reviews" collection to calculate the average rating
   * and total review count dynamically, so we can sort by "Highest Rated" or "Most Reviewed".
   */
  
  // 1. Define the dynamic sort stage based on user input
  // We use tie-breakers (_id) to ensure stable sorting for items with identical values.
  const safeSort = typeof sort === 'string' ? sort.trim() : "";
  let sortStage = { _id: -1 }; // Default: "newest"
  if (safeSort === "priceLow") sortStage = { price: 1, _id: 1 };
  else if (safeSort === "priceHigh") sortStage = { price: -1, _id: 1 };
  else if (safeSort === "alphabetical") sortStage = { lowerTitle: 1, _id: 1 };
  else if (safeSort === "highestRated") sortStage = { sortRating: -1, _id: -1 };
  else if (safeSort === "mostReviewed") sortStage = { reviewCount: -1, _id: -1 };
  else if (safeSort === "newest") sortStage = { _id: -1 };

  const listings = await Listing.aggregate([
    // Step 1: Filter listings using the same match logic as before
    { $match: filter },
    
    // Step 2: Lookup actual reviews to calculate ratings dynamically
    {
      $lookup: {
        from: "reviews", 
        localField: "reviews", 
        foreignField: "_id", 
        as: "populatedReviews"
      }
    },
    
    // Step 3: Add new fields for average rating, review count, and safe numeric/string fields for sorting
    {
      $addFields: {
        reviewCount: { $size: { $ifNull: ["$populatedReviews", []] } },
        avgRating: { $avg: "$populatedReviews.rating" },
        sortRating: { $ifNull: [{ $avg: "$populatedReviews.rating" }, 0] },
        lowerTitle: { $toLower: { $ifNull: ["$title", ""] } }
      }
    },
    
    // Step 4: Apply the dynamic sort with tie-breakers
    { $sort: sortStage },

    // Step 5: Remove temporary sorting fields to save memory
    { $project: { populatedReviews: 0, sortRating: 0, lowerTitle: 0 } }
  ]);

  return res.render("listings/index.ejs", { 
    listings, 
    selectedCategory: category || propertyType,
    searchParams: req.query
  });
};


module.exports.renderNewForm = async (req, res) => {
  res.render("listings/new.ejs");
};


module.exports.createListing = async (req, res, next) => {
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id; //it will store the current username as owner of the new listing
  
  if (req.files) {
    newListing.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    if (newListing.images.length > 0) {
      newListing.image = newListing.images[0]; // fallback
    }
  }

  await newListing.save();
  
  // Trigger Notification
  await createNotification(
      req.user._id,
      'listing_update',
      'Listing Created',
      `Your new property "${newListing.title}" has been published.`,
      `/listings/${newListing._id}`
  );

  req.flash("success", "New Listing has been created successfully!");
  return res.redirect("/listings");
};


module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" }
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  const Booking = require("../models/booking.js");
  const activeBookings = await Booking.find({
    listing: listing._id,
    status: "Booked"
  });

  const bookedDates = activeBookings.map(booking => ({
    from: booking.checkIn,
    to: booking.checkOut
  }));

  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user) {
      // Track recently viewed
      user.recentlyViewed.pull(listing._id); // Remove if already exists
      user.recentlyViewed.push(listing._id); // Add to end (most recent)
      if (user.recentlyViewed.length > 10) {
        user.recentlyViewed.shift(); // Keep only last 10
      }
      await user.save();
    }
  }

  /*
   * CALCULATE RATING BREAKDOWN:
   * We need to find out how many 5-star, 4-star, 3-star, etc., reviews exist.
   * Then, we calculate the percentage of each rating based on the total number of reviews.
   */
  let ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalReviews = listing.reviews.length;
  let avgRating = 0;

  if (totalReviews > 0) {
    let sum = 0;
    // Loop through each review and count the ratings
    listing.reviews.forEach(review => {
      // Increment the count for the specific star rating
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating]++;
      }
      sum += review.rating;
    });
    // Calculate the overall average rating rounded to 1 decimal place
    avgRating = (sum / totalReviews).toFixed(1);
  }

  // Calculate the percentage for each star rating (1 to 5)
  let ratingPercentages = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (totalReviews > 0) {
    for (let i = 1; i <= 5; i++) {
      // Math.round ensures we get clean whole numbers like 82% instead of 82.53%
      ratingPercentages[i] = Math.round((ratingCounts[i] / totalReviews) * 100);
    }
  }

  /*
   * ==========================================
   * HOTEL RECOMMENDATION SYSTEM LOGIC
   * ==========================================
   * Priority: Same Category -> Same Location -> Similar Price (±20%) -> Similar Rating
   * We use MongoDB aggregation to find matches and calculate their ratings dynamically.
   * We progressively relax the filter conditions to ensure we always show at least 4-6 recommendations.
   */
  const baseFilter = { _id: { $ne: listing._id } };
  const minPrice = listing.price * 0.8;
  const maxPrice = listing.price * 1.2;
  
  let recommendations = [];

  // Step 1: Strict match (Category + Location + Price ±20%)
  let strictMatches = await Listing.aggregate([
    { $match: { ...baseFilter, category: listing.category, location: listing.location, price: { $gte: minPrice, $lte: maxPrice } } },
    { $lookup: { from: "reviews", localField: "reviews", foreignField: "_id", as: "populatedReviews" } },
    { $addFields: { avgRating: { $avg: "$populatedReviews.rating" } } },
    { $sort: { avgRating: -1 } }, // Prefer higher rated hotels
    { $project: { populatedReviews: 0 } },
    { $limit: 6 }
  ]);
  recommendations.push(...strictMatches);

  // Step 2: Relax Price (Match Category + Location)
  if (recommendations.length < 4) {
    const existingIds = recommendations.map(r => r._id);
    let relaxedPriceMatches = await Listing.aggregate([
      { $match: { ...baseFilter, _id: { $nin: existingIds }, category: listing.category, location: listing.location } },
      { $lookup: { from: "reviews", localField: "reviews", foreignField: "_id", as: "populatedReviews" } },
      { $addFields: { avgRating: { $avg: "$populatedReviews.rating" } } },
      { $sort: { avgRating: -1 } },
      { $project: { populatedReviews: 0 } },
      { $limit: 6 - recommendations.length }
    ]);
    recommendations.push(...relaxedPriceMatches);
  }

  // Step 3: Relax Location (Match Category only)
  if (recommendations.length < 4) {
    const existingIds = recommendations.map(r => r._id);
    let relaxedLocationMatches = await Listing.aggregate([
      { $match: { ...baseFilter, _id: { $nin: existingIds }, category: listing.category } },
      { $lookup: { from: "reviews", localField: "reviews", foreignField: "_id", as: "populatedReviews" } },
      { $addFields: { avgRating: { $avg: "$populatedReviews.rating" } } },
      { $sort: { avgRating: -1 } },
      { $project: { populatedReviews: 0 } },
      { $limit: 6 - recommendations.length }
    ]);
    recommendations.push(...relaxedLocationMatches);
  }

  // Step 4: Relax Category (Any hotel, if needed as a last resort)
  if (recommendations.length < 4) {
    const existingIds = recommendations.map(r => r._id);
    let anyMatches = await Listing.aggregate([
      { $match: { ...baseFilter, _id: { $nin: existingIds } } },
      { $lookup: { from: "reviews", localField: "reviews", foreignField: "_id", as: "populatedReviews" } },
      { $addFields: { avgRating: { $avg: "$populatedReviews.rating" } } },
      { $sort: { avgRating: -1 } },
      { $project: { populatedReviews: 0 } },
      { $limit: 6 - recommendations.length }
    ]);
    recommendations.push(...anyMatches);
  }

  return res.render("listings/show.ejs", { 
    listing, 
    bookedDates,
    ratingCounts,
    ratingPercentages,
    totalReviews,
    avgRating,
    recommendations
  });
};


module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrls = [];
  if (listing.images && listing.images.length > 0) {
    originalImageUrls = listing.images.map(img => img.url.replace("/upload", "/upload/w_250"));
  } else if (listing.image && listing.image.url) {
    originalImageUrls = [listing.image.url.replace("/upload", "/upload/w_250")];
  }

  return res.render("listings/edit.ejs", { listing, originalImageUrls });
};


module.exports.updatedListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  
  // Apply text updates
  Object.assign(listing, req.body.listing);

  // Apply new images
  if (typeof req.files !== "undefined" && req.files.length > 0) {
    const newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));
    if (!listing.images) listing.images = [];
    listing.images.push(...newImages);
    
    if (listing.images.length > 0) {
      listing.image = listing.images[0];
    }
  }

  await listing.save();

  // Trigger Notification
  await createNotification(
      req.user._id,
      'listing_update',
      'Listing Updated',
      `Your property "${listing.title}" has been updated successfully.`,
      `/listings/${id}`
  );

  req.flash("success", "Listing updated!");
  return res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  
  // Trigger Notification
  await createNotification(
      req.user._id,
      'listing_update',
      'Listing Deleted',
      `Your property "${deletedListing.title}" has been permanently removed.`,
      `/listings/my-properties`
  );

  req.flash("success", "Listing has been deleted successfully!");
  return res.redirect("/listings");
};

module.exports.myProperties = async (req, res) => {
  const listings = await Listing.find({
    owner: req.user._id
  });
  res.render("listings/myProperties", {
    listings
  });
};