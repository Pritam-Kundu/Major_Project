const express = require("express");

const router = express.Router();

const helpController = require("../controllers/help");

const { isLoggedIn, isAdmin } = require("../middleware");

router.get("/", helpController.index);

router.get("/contact", isLoggedIn, helpController.contactForm);

router.post("/contact", isLoggedIn, helpController.createTicket);

router.get("/my-tickets", isLoggedIn, helpController.myTickets);

router.get(
    "/admin",
    isLoggedIn,
    isAdmin,
    helpController.adminTickets
);

router.put(
    "/:id",
    isLoggedIn,
    isAdmin,
    helpController.updateTicket
);

module.exports = router;