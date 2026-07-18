const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.createBooking = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const { checkIn, checkOut } = req.body;
    const guests = parseInt(req.body.guests);
    // Check if dates overlap with an existing booking
    const existingBooking = await Booking.findOne({
        listing: listing._id,
        status: "Booked",
        checkIn: {
            $lt: new Date(checkOut)
        },
        checkOut: {
            $gt: new Date(checkIn)
        }
    });

    if (existingBooking) {
        req.flash("error", "These dates are already booked.");
        return res.redirect(`/listings/${listing._id}`);
    }

    const oneDay = 1000 * 60 * 60 * 24;

    const days = Math.ceil(
        (new Date(checkOut) - new Date(checkIn)) / oneDay
    );

    let extraGuestCharge = 0;

    if (guests > 1) {
        extraGuestCharge = (guests - 1) * 300;
    }

    const pricePerNight = listing.price + extraGuestCharge;

    const subtotal = days * pricePerNight;

    const gst = subtotal * 0.18;

    const totalPrice = subtotal + gst;

    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        checkIn,
        checkOut,
        guests,
        subtotal,
        gst,
        totalPrice,
    });

    await booking.save();

    req.flash("success", "Booking Confirmed!");

    res.redirect(`/listings/${listing._id}`);
};

module.exports.showBookings = async (req, res) => {
    const bookings = await Booking.find({
        user: req.user._id
    })
        .populate("listing")
        .sort({ bookedAt: -1 });
    res.render("bookings/index", { bookings });
};

module.exports.cancelBooking = async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) {
        req.flash("error", "Booking not found.");
        return res.redirect("/bookings");
    }
    // Allow only the user who made the booking
    if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You are not authorized to cancel this booking.");
        return res.redirect("/bookings");
    }
    booking.status = "Cancelled";
    booking.cancelledAt = new Date();
    await booking.save();
    req.flash("success", "Booking cancelled successfully.");
    res.redirect("/bookings");
};

module.exports.hostDashboard = async (req, res) => {
    const bookings = await Booking.find()
        .populate("listing")
        .populate("user");
    const ownerBookings = bookings.filter(booking =>
        booking.listing &&
        booking.listing.owner.equals(req.user._id)
    );
    const totalRevenue = ownerBookings
        .filter(b => b.status === "Booked")
        .reduce((sum, booking) => sum + booking.totalPrice, 0);
    const totalBookings = ownerBookings.length;
    const activeBookings = ownerBookings.filter(
        b => b.status === "Booked"
    ).length;
    const cancelledBookings = ownerBookings.filter(
        b => b.status === "Cancelled"
    ).length;
    res.render("bookings/dashboard", {
        ownerBookings,
        totalRevenue,
        totalBookings,
        activeBookings,
        cancelledBookings
    });

};
