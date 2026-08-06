const mongoose = require('mongoose');
const Listing = require('../models/listing.js');
const imageAssignmentService = require('../services/imageAssignmentService.js');

const MONGO_URL = "mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0";

async function refreshImages() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to MongoDB Atlas!");

        // Find all OSM imported hotels
        // Or remove the filter if you want to update ALL hotels, but the user said "Refresh Hotel Images -> Every imported hotel receives"
        const hotels = await Listing.find({ source: "OpenStreetMap" });
        console.log(`Found ${hotels.length} imported hotels to update.`);

        if (hotels.length === 0) {
            console.log("No hotels found to update.");
            process.exit(0);
        }

        let updatedCount = 0;
        let failedCount = 0;

        for (const hotel of hotels) {
            try {
                // 1. Determine Category
                const category = imageAssignmentService.determineCategory({
                    title: hotel.title,
                    description: hotel.description,
                    // If you have raw osm data stored, you could pass osmTags here, 
                    // but title and description are robust enough for our fallback.
                });

                // 2. Assign new Cover and Gallery images offline
                const { coverImage, galleryImages } = imageAssignmentService.assignImagesToHotel(category);

                // 3. Update only the images in the database using $set to prevent overwriting reviews/bookings
                await Listing.updateOne(
                    { _id: hotel._id },
                    { 
                        $set: { 
                            image: coverImage, 
                            images: galleryImages 
                        } 
                    }
                );

                updatedCount++;
                if (updatedCount % 10 === 0) {
                    console.log(`Progress: Updated ${updatedCount}/${hotels.length} hotels...`);
                }

            } catch (err) {
                console.error(`Failed to update hotel ${hotel._id}:`, err.message);
                failedCount++;
            }
        }

        console.log("\n=============================================");
        console.log("             REFRESH COMPLETE                ");
        console.log("=============================================");
        console.log(`Successfully updated: ${updatedCount} hotels`);
        console.log(`Failed to update: ${failedCount} hotels`);
        console.log("=============================================\n");

    } catch (error) {
        console.error("Critical error during refresh:", error);
    } finally {
        mongoose.connection.close();
        console.log("Database connection closed.");
        process.exit(0);
    }
}

// Run the script
refreshImages();
