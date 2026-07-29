const axios = require('axios');

/**
 * OpenStreetMap Service for fetching hotels and geocoding.
 */

// Headers recommended by Nominatim/Overpass API to identify the application
const headers = {
    'User-Agent': 'Wanderlust-MajorProject-Bot/1.0 (contact: abhik.paul.dev@gmail.com)',
    'Accept-Language': 'en-US,en;q=0.9'
};

/**
 * Geocode a city name to get its latitude and longitude.
 * Uses Nominatim API.
 */
module.exports.geocodeCity = async (cityName) => {
    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: cityName,
                format: 'json',
                limit: 1
            },
            headers
        });

        if (response.data && response.data.length > 0) {
            return {
                lat: parseFloat(response.data[0].lat),
                lon: parseFloat(response.data[0].lon),
                displayName: response.data[0].display_name
            };
        }
        return null;
    } catch (error) {
        console.error("Nominatim API Error:", error.message);
        throw new Error("Failed to geocode city");
    }
};

/**
 * Fetch hotels from Overpass API within a certain radius.
 * @param {Number} lat - Latitude
 * @param {Number} lon - Longitude
 * @param {Number} radius - Radius in meters
 */
module.exports.fetchHotelsFromOSM = async (lat, lon, radius = 5000) => {
    // Overpass QL to find hotels within radius of lat, lon
    const query = `
        [out:json][timeout:25];
        (
            node["tourism"="hotel"](around:${radius},${lat},${lon});
        );
        out body;
        >;
        out skel qt;
    `;

    try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`, {
            headers: {
                ...headers,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const nodes = response.data.elements.filter(el => el.type === 'node');
        
        const hotels = nodes.map(node => {
            const tags = node.tags || {};
            // Extract best available name
            const name = tags.name || tags['name:en'] || tags.brand || 'Unknown Hotel';
            
            // Extract address
            let addressParts = [];
            if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
            if (tags['addr:street']) addressParts.push(tags['addr:street']);
            if (tags['addr:city']) addressParts.push(tags['addr:city']);
            if (tags['addr:postcode']) addressParts.push(tags['addr:postcode']);
            let location = addressParts.join(', ');
            if (!location) location = "Location not provided";
            
            return {
                osmId: node.id.toString(),
                title: name,
                latitude: node.lat,
                longitude: node.lon,
                location: location,
                country: tags['addr:country'] || '', // Optional, will be filled with default if missing
                website: tags.website || tags['contact:website'] || '',
                phone: tags.phone || tags['contact:phone'] || '',
                description: tags.description || 'A hotel imported from OpenStreetMap.',
                source: 'OpenStreetMap'
            };
        });

        return hotels;

    } catch (error) {
        console.error("Overpass API Error:", error.message);
        throw new Error("Failed to fetch hotels from Overpass API");
    }
};
