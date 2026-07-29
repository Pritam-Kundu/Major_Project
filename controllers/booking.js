const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { createNotification } = require("./notification");

module.exports.createBooking = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const { checkIn, checkOut } = req.body;
    const guests = parseInt(req.body.guests);
    /* 
     * BOOKING OVERLAP LOGIC:
     * To prevent double-booking, we must ensure the requested dates do not overlap with any existing active booking.
     * Two date ranges (A and B) overlap if and only if: (A.start < B.end) AND (A.end > B.start).
     * 
     * In this query:
     * - newCheckOut is B.end, so we check: existing.checkIn < newCheckOut
     * - newCheckIn is B.start, so we check: existing.checkOut > newCheckIn
     * 
     * If both conditions are true, the dates overlap, and we prevent the booking.
     */
    const existingBooking = await Booking.findOne({
        listing: listing._id,
        status: { $in: ["Booked", "Confirmed"] },
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

    // Standard policy: 100% refund deadline is 48 hours before check-in
    const cancellationDeadline = new Date(new Date(checkIn).getTime() - (48 * 60 * 60 * 1000));

    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        checkIn,
        checkOut,
        guests,
        subtotal,
        gst,
        totalPrice,
        cancellationDeadline,
    });

    await booking.save();

    // Trigger Notification
    await createNotification(
        req.user._id,
        'booking',
        'Booking Confirmed!',
        `Your stay at ${listing.title} is confirmed for ${new Date(checkIn).toLocaleDateString()}.`,
        `/bookings`
    );

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
    const booking = await Booking.findById(id).populate("listing");
    if (!booking) {
        req.flash("error", "Booking not found.");
        return res.redirect("/bookings");
    }
    // Allow only the user who made the booking
    if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You are not authorized to cancel this booking.");
        return res.redirect("/bookings");
    }
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const timeDiff = checkInDate.getTime() - now.getTime();
    const hoursBeforeCheckIn = timeDiff / (1000 * 60 * 60);
    
    let refundPercentage = 0;
    if (hoursBeforeCheckIn >= 48) {
        refundPercentage = 1; // 100%
    } else if (hoursBeforeCheckIn >= 24) {
        refundPercentage = 0.5; // 50%
    } else {
        refundPercentage = 0; // 0%
    }
    
    const refundAmount = Math.round(booking.totalPrice * refundPercentage);
    
    booking.status = "Cancelled";
    booking.cancelledAt = now;
    booking.refundAmount = refundAmount;
    
    await booking.save();
    
    let flashMsg = `Booking cancelled successfully. `;
    if (refundAmount > 0) {
        flashMsg += `A refund of ₹${refundAmount.toLocaleString("en-IN")} will be processed shortly.`;
    } else {
        flashMsg += `As per the policy, no refund is applicable for this cancellation.`;
    }
    
    // Trigger Notification
    await createNotification(
        req.user._id,
        'booking',
        'Booking Cancelled',
        `Your booking for ${booking.listing.title} has been cancelled.`,
        `/bookings`
    );
    
    req.flash("success", flashMsg);
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
        .filter(b => b.status === "Booked" || b.status === "Confirmed")
        .reduce((sum, booking) => sum + booking.totalPrice, 0);
    const totalBookings = ownerBookings.length;
    const activeBookings = ownerBookings.filter(
        b => b.status === "Booked" || b.status === "Confirmed"
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

module.exports.renderPaymentPage = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const { checkIn, checkOut, guests, rooms } = req.query;
    
    if (!checkIn || !checkOut) {
        req.flash("error", "Please select check-in and check-out dates.");
        return res.redirect(`/listings/${listing._id}`);
    }

    const parsedGuests = parseInt(guests) || 1;
    const parsedRooms = parseInt(rooms) || 1;

    // Recalculate price here to prevent tampering
    const oneDay = 1000 * 60 * 60 * 24;
    const days = Math.ceil((new Date(checkOut) - new Date(checkIn)) / oneDay);

    let extraGuestCharge = 0;
    if (parsedGuests > 1) {
        extraGuestCharge = (parsedGuests - 1) * 300;
    }

    const pricePerNight = listing.price * parsedRooms;
    const subtotal = (days * pricePerNight) + extraGuestCharge;
    const gst = subtotal * 0.18;
    const totalPrice = subtotal + gst;

    res.render("bookings/payment", {
        listing,
        checkIn,
        checkOut,
        guests: parsedGuests,
        rooms: parsedRooms,
        days,
        subtotal,
        gst,
        totalPrice,
        extraGuestCharge,
        pricePerNight
    });
};

module.exports.processPayment = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const { checkIn, checkOut, guests, paymentMethod } = req.body;
    
    const parsedGuests = parseInt(guests) || 1;

    // Check for overlap again just in case
    const existingBooking = await Booking.findOne({
        listing: listing._id,
        status: { $in: ["Booked", "Confirmed"] },
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) }
    });

    if (existingBooking) {
        req.flash("error", "These dates are already booked.");
        return res.redirect(`/listings/${listing._id}`);
    }

    const oneDay = 1000 * 60 * 60 * 24;
    const days = Math.ceil((new Date(checkOut) - new Date(checkIn)) / oneDay);

    let extraGuestCharge = 0;
    if (parsedGuests > 1) {
        extraGuestCharge = (parsedGuests - 1) * 300;
    }

    const pricePerNight = listing.price + extraGuestCharge; // Note: rooms aren't saved in schema, so we stick to listing price logic or adjust if needed.
    const subtotal = days * pricePerNight;
    const gst = subtotal * 0.18;
    const totalPrice = subtotal + gst;
    const cancellationDeadline = new Date(new Date(checkIn).getTime() - (48 * 60 * 60 * 1000));

    // Simulate Payment Success
    const paymentReference = 'PAY-' + new Date().getFullYear() + String(new Date().getMonth()+1).padStart(2, '0') + String(new Date().getDate()).padStart(2, '0') + Math.floor(1000 + Math.random() * 9000);

    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        checkIn,
        checkOut,
        guests: parsedGuests,
        subtotal,
        gst,
        totalPrice,
        cancellationDeadline,
        status: "Confirmed",
        paymentStatus: "Paid",
        paymentMethod: paymentMethod || "Credit Card",
        paymentReference: paymentReference,
        paymentDate: new Date()
    });

    await booking.save();

    await createNotification(
        req.user._id,
        'booking',
        'Payment Successful!',
        `Your booking for ${listing.title} is confirmed. Payment Ref: ${paymentReference}.`,
        `/bookings`
    );

    res.redirect(`/bookings/${listing._id}/success/${booking._id}`);
};

module.exports.renderSuccessPage = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId).populate("listing");
    if (!booking) {
        req.flash("error", "Booking not found.");
        return res.redirect("/");
    }

    if (!booking.user.equals(req.user._id)) {
        req.flash("error", "Unauthorized access.");
        return res.redirect("/");
    }

    res.render("bookings/success", { booking });
};
