const { geocodeCity, fetchHotelsFromOSM } = require("./services/osmService");

async function test() {
    try {
        console.log("Geocoding Goa...");
        const cityData = await geocodeCity("Goa");
        console.log("City Data:", cityData);
        
        if (cityData) {
            console.log("Fetching hotels...");
            const hotels = await fetchHotelsFromOSM(cityData.lat, cityData.lon, 5000);
            console.log(`Found ${hotels.length} hotels.`);
            if (hotels.length > 0) {
                console.log("First hotel:", hotels[0]);
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

test();
