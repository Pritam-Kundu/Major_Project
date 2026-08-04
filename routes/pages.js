const express = require("express");

const router = express.Router();

const pagesController = require("../controllers/pages.js");

router.get("/:page", pagesController.renderPage);

module.exports = router;