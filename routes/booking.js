const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/booking");

const { isLoggedIn } = require("../middleware");


router.get("/", isLoggedIn, bookingController.showBookings);
router.get(
    "/dashboard",
    isLoggedIn,
    bookingController.hostDashboard
);

router.post("/:id", isLoggedIn, bookingController.createBooking);

router.put("/:id/cancel", isLoggedIn, bookingController.cancelBooking);


module.exports = router;