/**
 * =========================================================
 * HOMIGO HOTEL LOCATION MAP (LEAFLET.JS)
 * =========================================================
 * 
 * WHAT IS LEAFLET?
 * Leaflet is a leading open-source JavaScript library for mobile-friendly interactive maps.
 * It is extremely lightweight and easy to use.
 * 
 * WHY OPENSTREETMAP?
 * OpenStreetMap (OSM) is a free, editable map of the whole world. We use it because:
 * 1. It is completely free and open-source.
 * 2. It requires no API keys or billing accounts (unlike Google Maps).
 * 3. It provides high-quality, up-to-date map data.
 * 
 * HOW MAP TILES WORK:
 * A digital map isn't one giant image. Instead, it is made up of dozens of small square 
 * images called "tiles" (usually 256x256 pixels). As you pan and zoom, Leaflet calculates 
 * exactly which tiles are needed and downloads them seamlessly from the OpenStreetMap server.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Ensure the window.hotelData object was injected successfully by show.ejs
    if (!window.hotelData || !window.hotelData.latitude || !window.hotelData.longitude) {
        console.error("Map Error: Latitude or longitude is missing.");
        return; // Stop execution if coordinates are invalid
    }

    const { latitude, longitude, title, location } = window.hotelData;
    
    /**
     * HOW ZOOM WORKS:
     * Zoom levels range from 0 (entire world) to 19 (street level). 
     * Level 14 is perfect for hotels because it shows the immediate neighborhood,
     * nearby roads, and local landmarks without being too zoomed in.
     */
    const zoomLevel = 14;

    /**
     * HOW LEAFLET INITIALIZES A MAP:
     * L.map('hotel-map') tells Leaflet to look for an HTML element with the ID 'hotel-map'.
     * The .setView() method centers the map exactly on our hotel's latitude and longitude 
     * at the specified zoom level.
     */
    const map = L.map('hotel-map', {
        scrollWheelZoom: true, // Allow zooming with mouse wheel
        dragging: true,        // Allow dragging on desktop/mobile
        tap: true              // Enable touch gestures
    }).setView([latitude, longitude], zoomLevel);

    /**
     * ADDING THE TILE LAYER:
     * Here we tell Leaflet where to fetch the map tiles from.
     * We use OpenStreetMap's standard tile server. The {z}, {x}, and {y} placeholders 
     * are automatically replaced by Leaflet to fetch the correct tile images as the user moves.
     */
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, // Maximum allowed zoom level
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    /**
     * HOW MARKERS WORK:
     * A marker represents a specific point on the map. 
     * L.marker([lat, lng]) creates a new marker exactly at the hotel's coordinates.
     * We then use .addTo(map) to physically place it onto our map instance.
     */
    const marker = L.marker([latitude, longitude]).addTo(map);

    /**
     * HOW POPUPS WORK:
     * Popups are small informational boxes attached to markers.
     * .bindPopup(html) attaches HTML content to the marker. 
     * When the marker is clicked, this HTML is displayed.
     */
    const popupContent = `
        <div style="text-align: center;">
            <h6 style="margin: 0; font-weight: bold; color: #ff385c;">${title}</h6>
            <p style="margin: 5px 0 0; font-size: 0.9em; color: #555;">${location}</p>
        </div>
    `;
    
    // Bind the popup to our marker
    marker.bindPopup(popupContent);

    // .openPopup() automatically opens the popup as soon as the map loads,
    // so the user doesn't have to click the marker to see the hotel name.
    marker.openPopup();

    /**
     * CLEANUP & UX IMPROVEMENT:
     * Our existing design uses a CSS overlay (::after) and a placeholder button.
     * Since Leaflet has successfully loaded and populated the #hotel-map container,
     * we will remove the placeholder elements so they don't block user interactions 
     * (like dragging and zooming the map).
     */
    
    // Remove the "Loading map..." button
    const loadingBtn = document.getElementById("map-btn-loading");
    if (loadingBtn) loadingBtn.remove();
    
    // The CSS ::after overlay normally blocks clicks. 
    // Leaflet adds the class 'leaflet-container', so we use that in our CSS 
    // to dynamically hide the ::after element.
});
