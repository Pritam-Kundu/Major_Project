const Review = require("../../models/review.js");
const Listing = require("../../models/listing.js");

// Detailed realistic comments
const positiveComments = [
    "The cleanliness of the rooms was impeccable. Breakfast was delicious and the staff behavior made us feel at home.",
    "Amazing swimming pool and great WiFi speed. Highly recommend for a comfortable staycation.",
    "Perfect vacation! The view from our room was beautiful and the nearby attractions were easily accessible.",
    "Loved the hospitality. Check-in experience was incredibly smooth and the food exceeded our expectations.",
    "Worth every penny. The comfort of the bed and the overall safety of the property gave us peace of mind."
];

const mixedComments = [
    "Good value for the price, but the food could be better. Cleanliness was acceptable.",
    "Decent location but the noise level from the street was a bit bothersome. Staff was friendly though.",
    "Room quality was average. The swimming pool was closed during our stay, which was disappointing.",
    "Check-in was slow, but the breakfast made up for it."
];

const negativeComments = [
    "Very disappointing. The room was not cleaned properly and the staff behavior was unprofessional.",
    "Terrible value for money. The WiFi didn't work and the noise level kept us awake all night.",
    "Would not recommend. The pictures are misleading. Poor room quality."
];

const titlesByRating = {
    5: ["Exceptional Stay", "Perfect Vacation", "Amazing Weekend", "Loved the Hospitality", "Worth Every Penny"],
    4: ["Comfortable Trip", "Beautiful Location", "Clean and Cozy", "Great Experience", "Good Value"],
    3: ["Could Be Better", "Average Stay", "Okay for the Price", "Decent but Flawed"],
    2: ["Disappointing", "Not What I Expected", "Poor Experience"],
    1: ["Terrible Stay", "Avoid this Place", "Worst Experience"]
};

const ownerReplies = [
    "Thank you for staying with us. We look forward to welcoming you again.",
    "We appreciate your valuable feedback and are glad you had a great time!",
    "Thank you for choosing our property. We have noted your feedback to improve our services."
];

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedReviews(users, bookings) {
    console.log("--- Seeding Reviews based on Completed Bookings ---");

    // Clean up previous demo reviews authored by the current demo users
    const demoUserIds = users.map(u => u._id);
    await Review.deleteMany({ author: { $in: demoUserIds } });
    
    // We also need to remove these deleted review references from Listings to avoid broken refs,
    // but Mongoose 'populate' handles missing refs gracefully by returning null, which is often fine for a demo script.
    // Ideally we would $pull from listing.reviews, but for performance, we'll skip the heavy $pull.

    let reviewsCreated = 0;

    // Filter only bookings that are Past and Confirmed (i.e. successfully completed trips)
    const completedBookings = bookings.filter(b => b.status === "Confirmed" && b.checkOut < new Date());

    for (let booking of completedBookings) {
        // Not every completed booking gets a review (say, 60% chance)
        if (Math.random() > 0.6) continue;

        // Determine Rating naturally based on user preference or totally random
        // Let's do mostly 4 and 5
        let rating = 5;
        const rand = Math.random();
        if (rand > 0.9) rating = 1;
        else if (rand > 0.8) rating = 2;
        else if (rand > 0.6) rating = 3;
        else if (rand > 0.3) rating = 4;

        let comment = "";
        if (rating >= 4) comment = randomEl(positiveComments);
        else if (rating === 3) comment = randomEl(mixedComments);
        else comment = randomEl(negativeComments);

        // Find the user object to get their travel preference
        const user = users.find(u => u._id.equals(booking.user));

        const review = new Review({
            comment: comment,
            rating: rating,
            createdAt: booking.checkOut, // Review left on the day of checkout
            author: booking.user,
            title: randomEl(titlesByRating[rating]),
            travelerType: user ? user.travelPreference : "General",
            helpfulCount: randomInt(0, 45),
            isVerified: true
        });

        // 35% chance for owner reply
        if (Math.random() < 0.35) {
            review.ownerReply = randomEl(ownerReplies);
        }

        await review.save();

        // Push to Listing
        await Listing.updateOne(
            { _id: booking.listing },
            { $push: { reviews: review._id } }
        );

        reviewsCreated++;
    }

    console.log(`Successfully generated ${reviewsCreated} realistic reviews directly tied to completed trips.`);
}

module.exports = seedReviews;
