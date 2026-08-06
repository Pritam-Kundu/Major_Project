const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const User = require("../models/user.js");

const MONGO_URL = "mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0";

// --- Demo Data Pools ---
const travelerTypes = ["Solo Traveller", "Couple", "Family", "Business Traveller", "Friends Group"];

// Comments tailored to high ratings (4-5)
const positiveComments = [
    "The cleanliness of the rooms was impeccable. Breakfast was delicious and the staff behavior made us feel at home.",
    "Amazing swimming pool and great WiFi speed. Highly recommend for a comfortable staycation.",
    "Perfect family vacation! The view from our room was beautiful and the nearby attractions were easily accessible.",
    "Loved the hospitality. Check-in experience was incredibly smooth and the food exceeded our expectations.",
    "Worth every penny. The comfort of the bed and the overall safety of the property gave us peace of mind.",
    "Beautiful location, very quiet noise level, and excellent value for money. Will definitely return.",
    "Great amenities! The parking was spacious and the room quality was top-notch.",
    "Comfortable business trip. The check-out experience was fast and the WiFi never dropped."
];

// Comments tailored to mixed/mid ratings (3)
const mixedComments = [
    "Good value for the price, but the food could be better. Cleanliness was acceptable.",
    "Decent location but the noise level from the street was a bit bothersome. Staff was friendly though.",
    "Room quality was average. The swimming pool was closed during our stay, which was disappointing.",
    "Check-in was slow, but the breakfast made up for it. Okay for a short weekend trip.",
    "Amenities are a bit dated, but it's fine for the budget. Parking can be tight."
];

// Comments tailored to low ratings (1-2)
const negativeComments = [
    "Very disappointing. The room was not cleaned properly and the staff behavior was unprofessional.",
    "Terrible value for money. The WiFi didn't work and the noise level kept us awake all night.",
    "Would not recommend. The food was cold, check-in took forever, and safety felt questionable.",
    "The pictures are misleading. Poor room quality and extremely uncomfortable beds."
];

// Titles mapping to ratings
const titlesByRating = {
    5: ["Exceptional Stay", "Perfect Family Vacation", "Amazing Weekend", "Loved the Hospitality", "Worth Every Penny"],
    4: ["Comfortable Business Trip", "Beautiful Location", "Clean and Cozy", "Great Experience", "Good Value"],
    3: ["Could Be Better", "Average Stay", "Okay for the Price", "Decent but Flawed"],
    2: ["Disappointing", "Not What I Expected", "Poor Experience"],
    1: ["Terrible Stay", "Avoid this Place", "Worst Experience"]
};

const ownerReplies = [
    "Thank you for staying with us. We look forward to welcoming you again.",
    "We appreciate your valuable feedback and are glad you had a great time!",
    "Thank you for choosing our property. We have noted your feedback to improve our services.",
    "It was a pleasure hosting you. Come back soon!",
    "Thank you for your detailed review. We always strive to provide the best experience."
];

// --- Helper Functions ---

// Generate random number between min and max (inclusive)
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// Pick random element from array
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate realistic date within last 12 months
const randomDate = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 12);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate random rating based on hotel category
const generateRating = (category) => {
    const rand = Math.random();
    if (['Luxury', 'Resort', 'Villa'].includes(category)) {
        // Luxury: mostly 5s and 4s
        if (rand < 0.6) return 5;
        if (rand < 0.9) return 4;
        if (rand < 0.98) return 3;
        return 2; 
    } else if (['Budget', 'Hostel'].includes(category)) {
        // Budget: more mixed
        if (rand < 0.3) return 5;
        if (rand < 0.6) return 4;
        if (rand < 0.85) return 3;
        if (rand < 0.95) return 2;
        return 1;
    } else {
        // Standard (Camping, Hotel, etc)
        if (rand < 0.4) return 5;
        if (rand < 0.75) return 4;
        if (rand < 0.9) return 3;
        return 2;
    }
};

// --- Main Seed Logic ---
async function seedReviews() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected successfully!");

        // 1. Create a pool of 10 Demo Users if they don't exist
        const demoUsers = [];
        for (let i = 1; i <= 10; i++) {
            const username = `DemoTraveller_${i}`;
            let user = await User.findOne({ username });
            if (!user) {
                user = new User({ email: `demo${i}@homigo.com`, username });
                // We use register to properly hash password
                await User.register(user, 'demopassword123');
                console.log(`Created new demo user: ${username}`);
            }
            demoUsers.push(user);
        }

        // 2. Fetch 25 random listings to populate
        const listings = await Listing.aggregate([{ $sample: { size: 25 } }]);
        
        let totalReviewsCreated = 0;

        for (let listData of listings) {
            const listing = await Listing.findById(listData._id).populate('reviews');
            
            // Duplicate Check: See if this listing already has reviews authored by our Demo users
            const existingDemoReviews = listing.reviews.filter(r => 
                demoUsers.some(du => du._id.equals(r.author))
            );

            if (existingDemoReviews.length > 0) {
                console.log(`Listing "${listing.title}" already has demo reviews. Skipping to prevent duplicates.`);
                continue;
            }

            // Generate 5 to 6 reviews for this listing
            const numReviews = randomInt(5, 6);
            for (let i = 0; i < numReviews; i++) {
                const rating = generateRating(listing.category || 'Hotel');
                
                let comment = "";
                if (rating >= 4) comment = randomEl(positiveComments);
                else if (rating === 3) comment = randomEl(mixedComments);
                else comment = randomEl(negativeComments);

                const review = new Review({
                    comment: comment,
                    rating: rating,
                    createdAt: randomDate(),
                    author: randomEl(demoUsers)._id,
                    title: randomEl(titlesByRating[rating]),
                    travelerType: randomEl(travelerTypes),
                    helpfulCount: randomInt(0, 35),
                    isVerified: true
                });

                // 30-40% chance to have an owner reply
                if (Math.random() < 0.35) {
                    review.ownerReply = randomEl(ownerReplies);
                }

                await review.save();
                listing.reviews.push(review._id);
                totalReviewsCreated++;
            }
            
            await listing.save();
            console.log(`Added ${numReviews} reviews to "${listing.title}"`);
        }

        console.log(`\n===========================================`);
        console.log(`SUCCESS: Seeded ${totalReviewsCreated} realistic demo reviews!`);
        console.log(`These reviews are diverse, contain verified badges, owner replies, helpful counts, and match the property types.`);
        console.log(`===========================================\n`);

    } catch (error) {
        console.error("Error seeding reviews:", error);
    } finally {
        mongoose.connection.close();
    }
}

seedReviews();
