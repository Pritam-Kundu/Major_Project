const User = require("../models/user.js")
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const Review = require("../models/review.js");


module.exports.renderSignUpForm = (req, res) => {
  return res.render("users/signup.ejs");
}


module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {            //after signup automatically login functionality 
      if (err) {
        next(err)
      }
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

  const listings = await Listing.countDocuments({
    owner: req.user._id
  });

  const bookings = await Booking.countDocuments({
    user: req.user._id
  });

  const reviews = await Review.countDocuments({
    author: req.user._id
  });

  const totalSpent = await Booking.aggregate([
    {
      $match: {
        user: req.user._id,
        status: "Booked"
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$totalPrice"
        }
      }
    }
  ]);

  res.render("users/account", {
    user: req.user,
    listings,
    bookings,
    reviews,
    totalSpent:
      totalSpent.length > 0
        ? totalSpent[0].total
        : 0
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