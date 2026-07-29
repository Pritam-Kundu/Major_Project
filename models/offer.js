const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const offerSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  discount: {
    type: String, // e.g., "20% OFF", "Flat ₹500 OFF"
    required: true,
  },
  promoCode: {
    type: String,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: [
      "Limited Time Deals",
      "Flat ₹500 OFF",
      "Stay 2 Nights, Get 1 Free",
      "New User Special",
      "Bank Offers",
      "Premium Member Exclusive",
      "Weekend Getaway Deals",
      "Summer Vacation Offers",
      "Trending"
    ],
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  claimedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    }
  ],
  maxClaims: {
    type: Number, // Optional, max total claims allowed
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("Offer", offerSchema);
