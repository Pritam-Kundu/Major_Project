const Offer = require("../models/offer.js");
const User = require("../models/user.js");

module.exports.renderOffers = async (req, res) => {
  const currentDate = new Date();
  
  // Find active offers that haven't expired
  let offers = await Offer.find({ 
    isActive: true, 
    expiryDate: { $gt: currentDate } 
  }).sort({ createdAt: -1 });

  // Custom sort logic: Trending first, Expiring Soon, Highest Discount could be complex without specific schema fields 
  // We will do a basic sort here and let the UI handle the rest, or just sort by expiry date
  offers = offers.sort((a, b) => {
    // Basic sorting prioritizing Trending if possible, then Expiry
    if (a.category === "Trending" && b.category !== "Trending") return -1;
    if (b.category === "Trending" && a.category !== "Trending") return 1;
    return new Date(a.expiryDate) - new Date(b.expiryDate); // Expiring soon first
  });

  res.render("offers/index.ejs", { offers });
};

module.exports.claimOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const offer = await Offer.findById(id);
    if (!offer || !offer.isActive || offer.expiryDate < new Date()) {
      return res.status(400).json({ success: false, message: "Offer is invalid or has expired." });
    }

    if (offer.maxClaims && offer.claimedUsers.length >= offer.maxClaims) {
       return res.status(400).json({ success: false, message: "This offer has reached its claim limit." });
    }

    const user = await User.findById(userId);
    
    // Check if user already claimed
    if (user.claimedOffers.includes(id)) {
      return res.status(400).json({ success: false, message: "You have already claimed this offer." });
    }

    // Add offer to user and user to offer
    user.claimedOffers.push(id);
    await user.save();

    offer.claimedUsers.push(userId);
    await offer.save();

    return res.json({ success: true, message: "Offer successfully claimed!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};
