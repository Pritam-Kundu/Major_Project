const User = require("../models/user.js")
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const Review = require("../models/review.js");
const { createNotification } = require("./notification");
const validator = require("validator");
const sendOTP = require("../utils/sendOTP.js");

module.exports.renderSignUpForm = (req, res) => {
  return res.render("users/signup.ejs");
}

module.exports.renderOTPPage = (req, res) => {

  if (!req.session.pendingUser) {

    req.flash("error", "Please sign up first.");

    return res.redirect("/signup");

  }

  res.render("users/verifyOTP");

};

module.exports.verifyOTP = async (req, res, next) => {

  const { otp } = req.body;

  if (!req.session.otp) {

    req.flash("error", "OTP expired.");

    return res.redirect("/signup");

  }

  if (Date.now() > req.session.otpExpiry) {

    req.flash("error", "OTP has expired.");

    return res.redirect("/signup");

  }

  if (otp !== req.session.otp) {

    req.flash("error", "Incorrect OTP.");

    return res.redirect("/verify-otp");

  }

  const {

    username,

    email,

    password

  } = req.session.pendingUser;

  const newUser = new User({

    username,

    email

  });

  const registeredUser = await User.register(

    newUser,

    password

  );

  delete req.session.pendingUser;

  delete req.session.otp;

  delete req.session.otpExpiry;

  req.login(registeredUser, async (err) => {

    if (err) {

      return next(err);

    }

    req.flash(

      "success",

      "Email verified successfully."

    );

    return res.redirect("/listings");

  });

};

module.exports.resendOTP = async (req, res) => {

  if (!req.session.pendingUser) {

    req.flash("error", "Signup again.");

    return res.redirect("/signup");

  }

  const otp = Math.floor(

    100000 + Math.random() * 900000

  ).toString();

  req.session.otp = otp;

  req.session.otpExpiry = Date.now() + 300000;

  await sendOTP(

    req.session.pendingUser.email,

    otp

  );

  req.flash("success", "OTP resent.");

  res.redirect("/verify-otp");

}



module.exports.signup = async (req, res) => {

  try {

    let { username, email, password } = req.body;

    // Clean up inputs by trimming unnecessary spaces
    username = username ? username.trim() : "";
    email = email ? email.trim() : "";

    // Email Validation
    if (!validator.isEmail(email)) {

      req.flash("error", "Please enter a valid email.");

      return res.redirect("/signup");

    }

    // Password Validation

    if (

      !validator.isStrongPassword(password, {

        minLength: 8,

        minLowercase: 1,

        minUppercase: 1,

        minNumbers: 1,

        minSymbols: 1,

      })

    ) {

      req.flash(

        "error",

        "Password must contain uppercase, lowercase, number and special character."

      );

      return res.redirect("/signup");

    }

    // Already Exists (Case-insensitive check to prevent duplicate emails with different cases)
    const existingUser = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });

    if (existingUser) {

      req.flash("error", "Email already registered.");

      return res.redirect("/signup");

    }

    // Generate OTP

    const otp = Math.floor(

      100000 + Math.random() * 900000

    ).toString();

    // Store in Session

    req.session.pendingUser = {

      username,

      email,

      password

    };

    req.session.otp = otp;

    req.session.otpExpiry = Date.now() + 5 * 60 * 1000;

    // Send OTP

    await sendOTP(email, otp);

    req.flash(

      "success",

      "OTP sent successfully."

    );

    return res.redirect("/verify-otp");

  }

  catch (err) {

    console.log(err);

    req.flash("error", "Unable to send OTP.");

    return res.redirect("/signup");

  }

};


module.exports.renderLoginForm = (req, res) => {
  return res.render("users/login.ejs");
}


module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back to Homigo");
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

  for (let booking of allBookings) {
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
    .populate("recentlyViewed.listing")
    .populate("collections.listings");

  res.render("users/wishlist", {
    wishlist: user.wishlist,
    recentlyViewed: user.recentlyViewed,
    collections: user.collections
  });
};

module.exports.viewHistory = async (req, res) => {
  const user = await User.findById(req.user._id).populate("recentlyViewed.listing");
  // Filter out null listings just in case they were deleted from the database
  let history = user.recentlyViewed ? user.recentlyViewed.filter(item => item.listing != null) : [];
  res.render("users/history", { history });
};

module.exports.removeHistoryItem = async (req, res) => {
  const { listingId } = req.params;
  const user = await User.findById(req.user._id);

  if (user && user.recentlyViewed) {
    user.recentlyViewed = user.recentlyViewed.filter(
      item => item.listing && item.listing.toString() !== listingId
    );
    await user.save();
    return res.json({ success: true, message: "Removed from history." });
  }
  return res.status(400).json({ success: false, message: "Could not remove item." });
};

module.exports.clearHistory = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.recentlyViewed = [];
    await user.save();
    return res.json({ success: true, message: "Viewing history cleared successfully." });
  }
  return res.status(400).json({ success: false, message: "Could not clear history." });
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

module.exports.renderForgotPassword = (req, res) => {

  res.render("users/forgotPassword");

};

module.exports.renderResetPassword = (req, res) => {

    if (!req.session.resetVerified) {

        req.flash("error", "Verify OTP first.");

        return res.redirect("/forgot-password");

    }

    res.render("users/resetPassword");

};

module.exports.resetPassword = async (req, res) => {

  try {

    if (!req.session.resetVerified) {

      req.flash("error", "Unauthorized request.");

      return res.redirect("/forgot-password");

    }

    const {

      password,

      confirmPassword

    } = req.body;

    if (password !== confirmPassword) {

      req.flash("error", "Passwords do not match.");

      return res.redirect("/reset-password");

    }

    const user = await User.findOne({

      email: req.session.resetEmail

    });

    if (!user) {

      req.flash("error", "User not found.");

      return res.redirect("/forgot-password");

    }

    if (

      !validator.isStrongPassword(password, {

        minLength: 8,

        minUppercase: 1,

        minLowercase: 1,

        minNumbers: 1,

        minSymbols: 1

      })

    ) {

      req.flash(

        "error",

        "Password must contain uppercase, lowercase, number and special character."

      );

      return res.redirect("/reset-password");

    }

    await user.setPassword(password);

    await user.save();

    delete req.session.resetOTP;

    delete req.session.resetOTPExpiry;

    delete req.session.resetEmail;

    delete req.session.resetVerified;

    req.flash(

      "success",

      "Password updated successfully. Please login."

    );

    res.redirect("/login");

  }

  catch (err) {

    console.log(err);

    req.flash(

      "error",

      "Unable to reset password."

    );

    res.redirect("/forgot-password");

  }

}

module.exports.sendResetOTP = async (req, res) => {

  let { email } = req.body;

  if (!email) {
    req.flash("error", "Email is required.");
    return res.redirect("/forgot-password");
  }

  email = email.trim();

  // Perform case-insensitive search to find the user
  const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });

  if (!user) {

    req.flash("error", "No account found with this email.");

    return res.redirect("/forgot-password");

  }

  const otp = Math.floor(

    100000 + Math.random() * 900000

  ).toString();

  req.session.resetOTP = otp;

  req.session.resetEmail = user.email; // Store the exact email from DB for consistency

  req.session.resetOTPExpiry = Date.now() + 300000;

  await sendOTP(email, otp);

  req.flash(

    "success",

    "OTP sent successfully."

  );

  res.redirect("/verify-reset-otp");

}

module.exports.renderVerifyResetOTP = (req, res) => {

  if (!req.session.resetEmail) {

    req.flash("error", "Please request a password reset first.");

    return res.redirect("/forgot-password");

  }

  res.render("users/verifyResetOTP");

};

module.exports.verifyResetOTP = async (req, res) => {

  const { otp } = req.body;

  if (!req.session.resetOTP) {

    req.flash("error", "OTP expired.");

    return res.redirect("/forgot-password");

  }

  if (Date.now() > req.session.resetOTPExpiry) {

    req.flash("error", "OTP has expired.");

    return res.redirect("/forgot-password");

  }

  if (otp !== req.session.resetOTP) {

    req.flash("error", "Incorrect OTP.");

    return res.redirect("/verify-reset-otp");

  }

  req.session.resetVerified = true;

  res.redirect("/reset-password");

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


module.exports.firebaseLogin = async (req, res, next) => {

  try {

    const { username, email } = req.body;

    let user = await User.findOne({ email });

    if (!user) {

      user = new User({
        username,
        email
      });

      await User.register(
        user,
        Math.random().toString(36)
      );

    }

    req.login(user, (err) => {

      if (err) {
        return next(err);
      }

      req.session.save((err) => {

        if (err) {
          return next(err);
        }

        return res.status(200).json({
          success: true
        });

      });

    });

  }

  catch (err) {

    return next(err);

  }

};

module.exports.loginWithEmail = async (req, res, next) => {

  // The login form submits the email in the 'username' field, so we extract it from there
  // We also check req.body.email just in case another form submits it differently
  let emailInput = req.body.username || req.body.email;

  if (!emailInput) {
    req.flash("error", "Email is required.");
    return res.redirect("/login");
  }

  emailInput = emailInput.trim();

  // Perform a case-insensitive search to find the correct user regardless of how they type their email
  const user = await User.findOne({ email: new RegExp('^' + emailInput + '$', 'i') });

  if (!user) {

    req.flash("error", "No account found with this email.");

    return res.redirect("/login");
  }

  // Passport expects 'username'
  req.body.username = user.username;

  next();

};