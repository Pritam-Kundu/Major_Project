const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offer.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");

// GET /offers - Show all active offers
router.get("/", wrapAsync(offerController.renderOffers));

// POST /offers/:id/claim - Claim an offer
router.post("/:id/claim", isLoggedIn, wrapAsync(offerController.claimOffer));

module.exports = router;
