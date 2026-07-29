const { geocodeCity, fetchHotelsFromOSM } = require("../services/osmService");
const Listing = require("../models/listing");
const { createNotification } = require("./notification"); // Using existing notification logic

module.exports.renderImportDashboard = async (req, res) => {
    res.render("import/index.ejs", { hotels: null, error: null, searchParams: {} });
};

module.exports.searchHotels = async (req, res) => {
    const { city, radius = 5 } = req.body; // radius in km

    if (!city) {
        req.flash("error", "City is required to search for hotels.");
        return res.redirect("/import");
    }

    try {
        const radiusMeters = parseInt(radius) * 1000;
        
        // 1. Geocode city
        const cityData = await geocodeCity(city);
        
        if (!cityData) {
            req.flash("error", `Could not find coordinates for city: ${city}`);
            return res.render("import/index.ejs", { hotels: null, searchParams: req.body });
        }

        // 2. Fetch from OSM
        const hotels = await fetchHotelsFromOSM(cityData.lat, cityData.lon, radiusMeters);
        
        if (hotels.length === 0) {
            req.flash("error", `No hotels found in ${city} within ${radius}km.`);
            return res.render("import/index.ejs", { hotels: [], searchParams: req.body });
        }

        // Check which ones already exist in DB to disable import button for them
        const existingOsmIds = await Listing.find({ source: 'OpenStreetMap', osmId: { $in: hotels.map(h => h.osmId) } }).select('osmId');
        const existingIdsSet = new Set(existingOsmIds.map(h => h.osmId));

        const hotelsWithStatus = hotels.map(hotel => {
            return {
                ...hotel,
                alreadyExists: existingIdsSet.has(hotel.osmId)
            };
        });

        // Pass to template
        res.render("import/index.ejs", { hotels: hotelsWithStatus, searchParams: req.body });

    } catch (error) {
        console.error(error);
        req.flash("error", "An error occurred while fetching hotels from OpenStreetMap.");
        res.redirect("/import");
    }
};

module.exports.saveHotels = async (req, res) => {
    try {
        const { selectedHotels } = req.body; // Expecting JSON string from frontend
        
        if (!selectedHotels) {
            req.flash("error", "No hotels selected for import.");
            return res.redirect("/import");
        }

        const hotelsToImport = JSON.parse(selectedHotels);
        
        if (!Array.isArray(hotelsToImport) || hotelsToImport.length === 0) {
            req.flash("error", "Invalid hotel data provided.");
            return res.redirect("/import");
        }

        let importedCount = 0;
        let duplicateCount = 0;
        let failedCount = 0;

        for (const hotelData of hotelsToImport) {
            try {
                // Duplicate check
                const existing = await Listing.findOne({ 
                    $or: [
                        { osmId: hotelData.osmId },
                        { title: hotelData.title, location: hotelData.location }
                    ]
                });

                if (existing) {
                    duplicateCount++;
                    continue;
                }

                // Prepare new listing
                const newListing = new Listing({
                    title: hotelData.title,
                    description: hotelData.description,
                    location: hotelData.location,
                    country: hotelData.country || "Unknown Country", // Schema requires it
                    price: Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000, // Random price 1000-5000
                    category: "Rooms", // Default category or something valid in enum. Wait, enum has Rooms? Let's check schema. Enum has ["Beaches", "Mountains", "Forests", "Castles", "Pools", "Campings", "Farms", "Arctic", "House Boats", "Domes"]. We should use "Domes" or "Castles" or default if not there. Let's just pick a random one from enum to satisfy validation.
                    latitude: hotelData.latitude,
                    longitude: hotelData.longitude,
                    source: "OpenStreetMap",
                    osmId: hotelData.osmId,
                    lastUpdated: new Date(),
                    website: hotelData.website,
                    phone: hotelData.phone,
                    owner: req.user._id // Required by schema
                });

                // Default Image setup
                newListing.image = {
                    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60", // Default nice hotel image
                    filename: "default_osm_hotel"
                };
                newListing.images = [newListing.image];

                // Category Assignment (Random from allowed enum)
                const categories = ["Beaches", "Mountains", "Forests", "Castles", "Pools", "Campings", "Farms", "Arctic", "House Boats", "Domes"];
                newListing.category = categories[Math.floor(Math.random() * categories.length)];


                await newListing.save();
                importedCount++;

            } catch (err) {
                console.error("Error saving hotel:", err);
                failedCount++;
            }
        }

        req.flash("success", `Import Complete! Imported: ${importedCount}, Skipped/Duplicates: ${duplicateCount}, Failed: ${failedCount}`);
        
        // Notification
        if (importedCount > 0) {
            await createNotification(
                req.user._id,
                'listing_update',
                'Import Successful',
                `Successfully imported ${importedCount} hotels from OpenStreetMap.`,
                `/listings`
            );
        }

        res.redirect("/import");

    } catch (error) {
        console.error(error);
        req.flash("error", "A critical error occurred during import.");
        res.redirect("/import");
    }
};
