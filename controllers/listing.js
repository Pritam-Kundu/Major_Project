const Listing = require("../models/listing.js");

module.exports.index = async (req, res) => {
  const { category,search } = req.query;
  let filter = {};

  if (category) filter.category = category;
  
  if (search) {
    filter.$or = [
      { location: { $regex: search, $options: "i" } },
      { title: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } }
    ];
  }

  const listings = await Listing.find(filter);
  
  return res.render("listings/index.ejs", { listings, selectedCategory: category });
  // const allListings = await Listing.find({});
  // return res.render("listings/index.ejs", { allListings });
};


module.exports.renderNewForm = async (req, res) => {
  res.render("listings/new.ejs");
};


module.exports.createListing = async (req, res, next) => {
  let url = req.file.path
  let filename = req.file.filename
  
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id; //it will store the current username as owner of the new listing
  newListing.image = { url,filename }
  await newListing.save();
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
  return res.render("listings/show.ejs", { listing });
};


module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url
  originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250")      //w_250 will set the image width to 250 pixels in the edit form..its a internal feature of cloudinary

  return res.render("listings/edit.ejs", { listing, originalImageUrl });
};


module.exports.updatedListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }); //unpacking(...req.body.listing) all data from object and getting them one by one

  if(typeof req.file !== "undefined"){                         //we are checking whether the req.file is empty or not because if its empty means no image exists then no need to update
    let url = req.file.path
    let filename = req.file.filename
    listing.image = { url,filename }
    await listing.save()
  }

  req.flash("success", "Listing updated!");
  return res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing has been deleted successfully!");
  return res.redirect("/listings");
};
