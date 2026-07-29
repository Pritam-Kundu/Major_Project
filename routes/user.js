const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const {
  saveRedirectUrl,
  isLoggedIn
} = require("../middleware.js");

const userController = require("../controllers/user.js")


router
  .route("/signup")
  .get(userController.renderSignUpForm)
  .post(wrapAsync(userController.signup));


router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  );


router.get(
  "/account",
  isLoggedIn,
  userController.account
);
router.get("/logout", userController.logout);

router.post(
  "/wishlist/collections",
  isLoggedIn,
  wrapAsync(userController.createCollection)
);

router.post(
  "/wishlist/collections/:collectionId/add/:listingId",
  isLoggedIn,
  wrapAsync(userController.addToCollection)
);

router.post(
  "/wishlist/collections/:collectionId/remove/:listingId",
  isLoggedIn,
  wrapAsync(userController.removeFromCollection)
);

router.post(
  "/wishlist/:id",
  isLoggedIn,
  wrapAsync(userController.toggleWishlist)
);

router.get(
  "/wishlist",
  isLoggedIn,
  wrapAsync(userController.renderWishlist)
);

module.exports = router;
