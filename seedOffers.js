const mongoose = require('mongoose');
const Offer = require('./models/offer.js');

const MONGO_URL = "mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0";

const newOffers = [
  {
    title: 'Festive Season Bonanza',
    description: 'Celebrate the upcoming festivals with your loved ones. Get a massive discount on premium stays.',
    discount: '30% OFF',
    promoCode: 'FESTIVE30',
    expiryDate: new Date('2027-12-31T23:59:59Z'),
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop',
    category: 'Limited Time Deals',
    isActive: true,
    claimedUsers: [],
    maxClaims: 200,
  },
  {
    title: 'Early Bird Special',
    description: 'Plan ahead and save more! Book 3 months in advance and enjoy exclusive early bird rates.',
    discount: '25% OFF',
    promoCode: 'EARLYBIRD',
    expiryDate: new Date('2027-12-31T23:59:59Z'),
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800&auto=format&fit=crop',
    category: 'Trending',
    isActive: true,
    claimedUsers: [],
    maxClaims: 150,
  },
  {
    title: 'SBI Credit Card Offer',
    description: 'Use your SBI Credit Card to unlock flat discounts on any domestic booking.',
    discount: 'Flat ₹750 OFF',
    promoCode: 'SBI750',
    expiryDate: new Date('2027-06-30T23:59:59Z'),
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop',
    category: 'Bank Offers',
    isActive: true,
    claimedUsers: [],
    maxClaims: 500,
  },
  {
    title: 'Stay 3, Pay for 2',
    description: 'Unwind properly with our long stay offer. Book for 3 nights and pay for only 2!',
    discount: '1 Night FREE',
    promoCode: 'STAY3PAY2',
    expiryDate: new Date('2027-03-31T23:59:59Z'),
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
    category: 'Premium Member Exclusive',
    isActive: true,
    claimedUsers: [],
    maxClaims: 100,
  },
  {
    title: 'Honeymoon Special',
    description: 'Make your honeymoon unforgettable with our romantic getaway package. Free couples spa included.',
    discount: '20% OFF',
    promoCode: 'ROMANCE20',
    expiryDate: new Date('2027-12-31T23:59:59Z'),
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop',
    category: 'Weekend Getaway Deals',
    isActive: true,
    claimedUsers: [],
    maxClaims: 50,
  }
];

async function seedDB() {
  try {
    await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB Atlas");
    
    // First, let's update the existing expired offers to be active until 2027 so the user can see them!
    const updated = await Offer.updateMany(
      { expiryDate: { $lt: new Date() } },
      { $set: { expiryDate: new Date('2027-12-31T23:59:59Z') } }
    );
    console.log(`Updated ${updated.modifiedCount} expired offers to be active until 2027.`);
    
    // Now insert the new offers
    const inserted = await Offer.insertMany(newOffers);
    console.log(`Successfully added ${inserted.length} new offers!`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding offers:", error);
    mongoose.connection.close();
  }
}

seedDB();
