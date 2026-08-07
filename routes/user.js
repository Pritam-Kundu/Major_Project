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
  .route("/verify-otp")
  .get(userController.renderOTPPage)
  .post(wrapAsync(userController.verifyOTP));

router.get(
  "/resend-otp",
  wrapAsync(userController.resendOTP)
);

router
  .route("/forgot-password")
  .get(userController.renderForgotPassword)
  .post(wrapAsync(userController.sendResetOTP));

router
  .route("/verify-reset-otp")
  .get(userController.renderVerifyResetOTP)
  .post(wrapAsync(userController.verifyResetOTP));

router
  .route("/reset-password")
  .get(userController.renderResetPassword)
  .post(wrapAsync(userController.resetPassword));


router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    saveRedirectUrl,
    userController.loginWithEmail,
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

router.route("/account/set-password")
  .get(isLoggedIn, userController.renderSetPassword)
  .post(isLoggedIn, wrapAsync(userController.setPassword));

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

router.post("/auth/firebase", userController.firebaseLogin);

router.get(
  "/wishlist",
  isLoggedIn,
  wrapAsync(userController.renderWishlist)
);

router.get(
  "/history",
  isLoggedIn,
  wrapAsync(userController.viewHistory)
);

router.delete(
  "/history",
  isLoggedIn,
  wrapAsync(userController.clearHistory)
);

router.delete(
  "/history/:listingId",
  isLoggedIn,
  wrapAsync(userController.removeHistoryItem)
);

module.exports = router;
