const Listing = require("../../models/listing.js");

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

async function seedWishlists(users) {
    console.log("--- Seeding Wishlists & Recently Viewed ---");
    
    // Fetch all available listings to pull from
    const listings = await Listing.find().select('_id');
    if (listings.length === 0) {
        console.log("No listings found to add to wishlists.");
        return;
    }

    let wishlistsAdded = 0;
    let recentlyViewedAdded = 0;

    for (let user of users) {
        // Generate Wishlist (3 - 12 hotels)
        const wishlistCount = randomInt(3, 12);
        const userWishlist = [];
        
        // Randomly pick unique listings
        while (userWishlist.length < wishlistCount && userWishlist.length < listings.length) {
            const randomListing = listings[Math.floor(Math.random() * listings.length)]._id;
            if (!userWishlist.includes(randomListing)) {
                userWishlist.push(randomListing);
            }
        }
        
        // Generate Recently Viewed (5 - 10 hotels)
        const viewedCount = randomInt(5, 10);
        const userViewed = [];
        const usedViewedIds = new Set();
        
        while (userViewed.length < viewedCount && userViewed.length < listings.length) {
            const randomListing = listings[Math.floor(Math.random() * listings.length)]._id;
            if (!usedViewedIds.has(randomListing.toString())) {
                usedViewedIds.add(randomListing.toString());
                
                // Assign a random timestamp from the last 7 days
                const viewedAt = new Date();
                viewedAt.setDate(viewedAt.getDate() - randomInt(0, 7));
                viewedAt.setHours(viewedAt.getHours() - randomInt(0, 24));
                
                userViewed.push({
                    listing: randomListing,
                    viewedAt: viewedAt
                });
            }
        }

        // Save to user
        user.wishlist = userWishlist;
        user.recentlyViewed = userViewed;
        
        // Disable validation if password hash causes issues or just use updateOne
        // But since we just retrieved them, save() should work.
        await user.save();
        
        wishlistsAdded += userWishlist.length;
        recentlyViewedAdded += userViewed.length;
    }

    console.log(`Successfully populated ${wishlistsAdded} wishlist items and ${recentlyViewedAdded} recently viewed items.`);
}

module.exports = seedWishlists;
