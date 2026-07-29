const User = require("../models/user.js")
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const Review = require("../models/review.js");
const { createNotification } = require("./notification");


module.exports.renderSignUpForm = (req, res) => {
  return res.render("users/signup.ejs");
}


module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, async (err) => {            //after signup automatically login functionality 
      if (err) {
        next(err)
      }
      
      // Trigger Notification
      await createNotification(
          registeredUser._id,
          'general',
          'Welcome to Wanderlust!',
          `Hi ${username}, your account has been successfully created.`,
          `/account`
      );

      req.flash("success", "Welcome to Wanderlust");
      return res.redirect("/listings");
    })
  } catch (e) {
    req.flash("error", e.message);
    return res.redirect("/signup");
  }
}


module.exports.renderLoginForm = (req, res) => {
  return res.render("users/login.ejs");
}


module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back in Wanderlust");
  let redirectUrl = res.locals.redirectUrl || "/listings"         //if there is not any redirectUrl then we will redirect to the /listings route
  return res.redirect(redirectUrl);
}




module.exports.account = async (req, res) => {
  const userId = req.user._id;

  const populatedUser = await User.findById(userId)
    .populate("wishlist")
    .populate("claimedOffers");
  const listingsCount = await Listing.countDocuments({ owner: userId });

  const allBookings = await Booking.find({ user: userId }).populate("listing").sort({ checkIn: 1 });
  
  const today = new Date();
  const upcomingBookings = [];
  const completedStays = [];
  const cancelledBookings = [];
  
  let totalSpent = 0;

  for(let booking of allBookings) {
    if (booking.status === "Cancelled") {
      cancelledBookings.push(booking);
    } else {
      totalSpent += booking.totalPrice;
      if (booking.checkOut < today) {
        completedStays.push(booking);
      } else {
        upcomingBookings.push(booking);
      }
    }
  }

  const userReviews = await Review.find({ author: userId });
  const reviewIds = userReviews.map(r => r._id);
  const reviewedListings = await Listing.find({ reviews: { $in: reviewIds } });
  
  const mappedReviews = userReviews.map(review => {
    const listing = reviewedListings.find(l => l.reviews.includes(review._id));
    return { ...review.toObject(), listing };
  });

  res.render("users/account", {
    user: populatedUser,
    wishlist: populatedUser.wishlist,
    listingsCount,
    upcomingBookings,
    completedStays,
    cancelledBookings,
    userReviews: mappedReviews,
    totalSpent
  });
};


module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "you have been logged out!");
    res.redirect("/listings");
  });
}

module.exports.toggleWishlist = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  const listing = await Listing.findById(id);
  
  let isWishlisted = false;
  if (user.wishlist.includes(id)) {
    user.wishlist.pull(id);
    
    // Trigger Notification for remove
    if (listing) {
        await createNotification(
            req.user._id,
            'wishlist',
            'Removed from Wishlist',
            `${listing.title} was removed from your wishlist.`,
            `/wishlist`
        );
    }

    if (!req.xhr && req.headers.accept.indexOf('json') === -1) {
      req.flash("success", "Removed from wishlist!");
    }
  } else {
    user.wishlist.push(id);
    isWishlisted = true;
    
    // Trigger Notification for add
    if (listing) {
        await createNotification(
            req.user._id,
            'wishlist',
            'Added to Wishlist',
            `${listing.title} was added to your wishlist.`,
            `/wishlist`
        );
    }

    if (!req.xhr && req.headers.accept.indexOf('json') === -1) {
      req.flash("success", "Added to wishlist!");
    }
  }
  
  await user.save();
  
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.json({ success: true, isWishlisted });
  }

  const referer = req.get('Referrer');
  res.redirect(referer || "/listings");
};

module.exports.renderWishlist = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("wishlist")
    .populate("recentlyViewed")
    .populate("collections.listings");
    
  res.render("users/wishlist", { 
    wishlist: user.wishlist,
    recentlyViewed: user.recentlyViewed,
    collections: user.collections
  });
};

module.exports.createCollection = async (req, res) => {
  const { name } = req.body;
  const user = await User.findById(req.user._id);
  user.collections.push({ name, listings: [] });
  await user.save();
  req.flash("success", "Collection created!");
  res.redirect("/wishlist");
};

module.exports.addToCollection = async (req, res) => {
  const { collectionId, listingId } = req.params;
  const user = await User.findById(req.user._id);
  const collection = user.collections.id(collectionId);
  
  if (collection && !collection.listings.includes(listingId)) {
    collection.listings.push(listingId);
    await user.save();
    req.flash("success", "Added to collection!");
  }
  res.redirect("/wishlist");
};

module.exports.removeFromCollection = async (req, res) => {
  const { collectionId, listingId } = req.params;
  const user = await User.findById(req.user._id);
  const collection = user.collections.id(collectionId);
  
  if (collection) {
    collection.listings.pull(listingId);
    await user.save();
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true });
    }
    req.flash("success", "Removed from collection!");
  }
  res.redirect("/wishlist");
};