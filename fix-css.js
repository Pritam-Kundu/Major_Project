const fs = require('fs');
let css = fs.readFileSync('public/css/listings.css', 'utf8');

const targetStr = `.airbnb-amenity-card i {
    font-size: 1.5rem;
    }
  }
  .booking-card {`;

const fixStr = `.airbnb-amenity-card i {
    font-size: 1.5rem;
    color: #222;
    width: 32px;
    text-align: center;
  }

  /* Map Placeholder */
  .map-container {
    width: 100%;
    height: 250px;
    background-image: url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop');
    background-size: cover;
    background-position: center;
    border-radius: 12px;
    position: relative;
    margin-bottom: 2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .map-container::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.1);
    border-radius: 12px;
    pointer-events: none;
  }
  
  /* When Leaflet is loaded, it adds .leaflet-container. Hide the placeholder overlay. */
  .map-container.leaflet-container::after {
    display: none;
  }

  .map-btn {
    position: relative;
    z-index: 2;
    background: white;
    color: #0071c2;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  /* Sticky Booking Card */
  .booking-sidebar {
    position: sticky;
    top: 100px;
    margin-bottom: 2rem;
  }
  @media(max-width: 991px) {
    .booking-sidebar {
      position: static;
      margin-top: 2rem;
    }
  }
  .booking-card {`;

// We might need to use regex because whitespace could vary.
// Let's just find the index of '.airbnb-amenity-card i {' and '.booking-card {'
const startIndex = css.indexOf('.airbnb-amenity-card i {');
const endIndex = css.indexOf('.booking-card {', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const before = css.substring(0, startIndex);
    const after = css.substring(endIndex + '.booking-card {'.length);
    fs.writeFileSync('public/css/listings.css', before + fixStr + after);
    console.log("Fixed CSS successfully.");
} else {
    console.log("Could not find markers.", startIndex, endIndex);
}
