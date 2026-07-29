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

router.get("/:id/payment", isLoggedIn, bookingController.renderPaymentPage);
router.post("/:id/payment", isLoggedIn, bookingController.processPayment);
router.get("/:id/success/:bookingId", isLoggedIn, bookingController.renderSuccessPage);

router.post("/:id", isLoggedIn, bookingController.createBooking);

router.put("/:id/cancel", isLoggedIn, bookingController.cancelBooking);


module.exports = router;