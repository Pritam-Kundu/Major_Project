const mongoose = require("mongoose");

const MONGO_URL = "mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0";

// Import all child seeders
const seedUsers = require("./seeders/seedUsers");
const seedWishlists = require("./seeders/seedWishlists");
const seedBookings = require("./seeders/seedBookings");
const seedReviews = require("./seeders/seedReviews");
const seedSupport = require("./seeders/seedSupport");
const seedNotifications = require("./seeders/seedNotifications");

async function runMasterSeed() {
    try {
        console.log("=========================================");
        console.log("   STARTING HOMIGO DEMO ECOSYSTEM SEED   ");
        console.log("=========================================\n");

        console.log("Connecting to Database...");
        await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to MongoDB!\n");

        // Execute in strict relational order to ensure referential integrity

        // 1. Generate 100-150 Users first
        const users = await seedUsers();

        // 2. Generate Wishlists and Recently Viewed properties for these users
        await seedWishlists(users);

        // 3. Generate Bookings, Trips, and Payments
        const bookings = await seedBookings(users);

        // 4. Generate Reviews (only for users with completed bookings)
        await seedReviews(users, bookings);

        // 5. Generate Support Tickets
        await seedSupport(users, bookings);

        // 6. Generate Notifications (Welcome, Price Drop, Flash Sale, Booking Confirmed)
        await seedNotifications(users);

        console.log("\n=========================================");
        console.log("  ECOSYSTEM SEED COMPLETED SUCCESSFULLY  ");
        console.log("=========================================");

    } catch (error) {
        console.error("\n[CRITICAL ERROR] Ecosystem seeding failed:", error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

// Check if running directly
if (require.main === module) {
    runMasterSeed();
}

module.exports = runMasterSeed;
