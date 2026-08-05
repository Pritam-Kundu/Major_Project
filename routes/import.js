const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isAdmin } = require("../middleware.js");
const importController = require("../controllers/import.js");

// GET /import - Render Dashboard
router.get("/", isAdmin, wrapAsync(importController.renderImportDashboard));

// POST /import/search - Search OSM
router.post("/search", isAdmin, wrapAsync(importController.searchHotels));

// POST /import/save - Save Hotels
router.post("/save", isAdmin, wrapAsync(importController.saveHotels));

module.exports = router;
