const mongoose = require("mongoose");
const Offer = require("../models/offer.js");

const MONGO_URL = "mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0";

main()
  .then(() => {
    console.log("Connected to DB for seeding offers");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const sampleOffers = [
  {
    title: "Summer Getaway Special",
    description: "Book your summer vacation now and save big on premium stays. Valid across all beach destinations.",
    discount: "20% OFF",
    promoCode: "SUMMER20",
    expiryDate: new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
    category: "Summer Vacation Offers",
    maxClaims: 100
  },
  {
    title: "Flash Sale: Luxury Villas",
    description: "Experience ultimate luxury at unbeatable prices. Book any villa for 3+ nights.",
    discount: "Flat ₹2000 OFF",
    promoCode: "LUX2000",
    expiryDate: new Date(new Date().getTime() + (24 * 60 * 60 * 1000)), // 24 hours from now
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop",
    category: "Limited Time Deals",
    maxClaims: 20
  },
  {
    title: "Extended Weekend Treat",
    description: "Make your long weekend even better. Stay 2 nights and get the 3rd night absolutely free!",
    discount: "Buy 2 Get 1",
    promoCode: "B2G1FREE",
    expiryDate: new Date(new Date().getTime() + (14 * 24 * 60 * 60 * 1000)), // 14 days
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800&auto=format&fit=crop",
    category: "Stay 2 Nights, Get 1 Free",
    maxClaims: 50
  },
  {
    title: "HDFC Bank Exclusive",
    description: "Use your HDFC Credit Card and get a flat ₹500 discount on your next booking.",
    discount: "Flat ₹500 OFF",
    promoCode: "HDFC500",
    expiryDate: new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000)), // 30 days
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop",
    category: "Bank Offers",
    maxClaims: 500
  },
  {
    title: "Welcome to Wanderlust!",
    description: "First time booking with us? Enjoy a massive discount on your first stay.",
    discount: "50% OFF",
    promoCode: "WELCOME50",
    expiryDate: new Date(new Date().getTime() + (365 * 24 * 60 * 60 * 1000)), // 1 year
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop",
    category: "New User Special",
    maxClaims: 1000
  },
  {
    title: "Trending Destinations Deal",
    description: "Explore the most loved places this season with our special trending discount.",
    discount: "15% OFF",
    promoCode: "TRENDING15",
    expiryDate: new Date(new Date().getTime() + (3 * 24 * 60 * 60 * 1000)), // 3 days
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=800&auto=format&fit=crop",
    category: "Trending",
    maxClaims: 30
  }
];

const seedDB = async () => {
  await Offer.deleteMany({});
  await Offer.insertMany(sampleOffers);
  console.log("Offers seeded successfully");
};

seedDB().then(() => {
  mongoose.connection.close();
});
