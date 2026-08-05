const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const importController = require("../controllers/import.js");

// GET /import - Render Dashboard
router.get("/", isLoggedIn, wrapAsync(importController.renderImportDashboard));

// POST /import/search - Search OSM
router.post("/search", isLoggedIn, wrapAsync(importController.searchHotels));

// POST /import/save - Save Hotels
router.post("/save", isLoggedIn, wrapAsync(importController.saveHotels));

module.exports = router;
