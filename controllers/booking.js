const Booking = require("../models/booking");
const Listing = require("../models/listing");
const User = require("../models/user");
const Offer = require("../models/offer");
const { createNotification } = require("./notification");
const sendCancellationEmail = require("../utils/sendCancellationEmail");
const { sendBookingConfirmationEmail } = require("../services/bookingEmailService");
const { calculateCancellationRefund } = require("../utils/cancellationHelper");

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

    const now = new Date();
    for (let booking of bookings) {
        if (booking.status === "Booked" || booking.status === "Confirmed") {
            booking.computedCancellation = calculateCancellationRefund(booking, now);
        }
    }

    res.render("bookings/index", { bookings });
};

module.exports.cancelBooking = async (req, res) => {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    
    const booking = await Booking.findById(id).populate("listing");
    if (!booking) {
        req.flash("error", "Booking not found.");
        return res.redirect("/bookings");
    }

    if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You are not authorized to cancel this booking.");
        return res.redirect("/bookings");
    }

    if (booking.status === "Cancelled") {
        req.flash("error", "This booking is already cancelled.");
        return res.redirect("/bookings");
    }

    if (!cancellationReason) {
        req.flash("error", "Cancellation reason is required.");
        return res.redirect("/bookings");
    }

    const now = new Date();
    
    const {
        refundAmount,
        refundPercentage,
        deductionAmount,
        cancellationMessage,
        canCancel
    } = calculateCancellationRefund(booking, now);

    if (!canCancel) {
        req.flash("error", "This stay has already started and can no longer be cancelled.");
        return res.redirect("/bookings");
    }

    const refundStatus = refundAmount > 0 ? "Pending" : "Not Applicable";

    booking.status = "Cancelled";
    booking.cancelledAt = now;
    booking.refundAmount = refundAmount;
    booking.refundPercentage = refundPercentage;
    booking.deductionAmount = deductionAmount;
    booking.refundStatus = refundStatus;
    booking.cancellationReason = cancellationReason;
    booking.cancellationMessage = cancellationMessage;

    await booking.save();

    try {
        await sendCancellationEmail(booking, booking.listing, req.user.email);
    } catch(err) {
        console.error("Failed to send cancellation email:", err);
    }

    await createNotification(
        req.user._id,
        'booking',
        'Booking Cancelled',
        `Your booking for ${booking.listing.title} has been cancelled.`,
        `/bookings`
    );

    let flashMsg = `Booking Cancelled Successfully. `;
    if (refundAmount > 0) {
        flashMsg += `Refund Amount: ₹${refundAmount.toLocaleString("en-IN")}. Refund Status: Pending. Refund will be processed within 5-7 business days.`;
    } else {
        flashMsg += cancellationMessage;
    }

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
    
    const user = await User.findById(req.user._id).populate({
        path: 'claimedOffers',
        match: { isActive: true, expiryDate: { $gt: new Date() } }
    });
    const claimedOffers = user.claimedOffers;
    
    const availableOffers = await Offer.find({
        isActive: true,
        expiryDate: { $gt: new Date() },
        _id: { $nin: user.claimedOffers.map(o => o._id) }
    });
    
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
        pricePerNight,
        claimedOffers,
        availableOffers
    });
};

module.exports.processPayment = async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate("owner");
    const { checkIn, checkOut, guests, paymentMethod, appliedOffer } = req.body;
    
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
    
    let discountAmount = 0;
    if (appliedOffer) {
        const offer = await Offer.findById(appliedOffer);
        if (offer && offer.isActive && offer.expiryDate > new Date()) {
            // Calculate discount
            if (offer.discount.includes('%')) {
                const percent = parseInt(offer.discount);
                if (!isNaN(percent)) discountAmount = (subtotal * percent) / 100;
            } else if (offer.discount.includes('₹') || offer.discount.includes('OFF')) {
                const flat = parseInt(offer.discount.replace(/\D/g, ''));
                if (!isNaN(flat)) discountAmount = flat;
            }
        }
    }
    
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const gst = discountedSubtotal * 0.18;
    const totalPrice = discountedSubtotal + gst;
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

    try {
        // Attach populated fields for the email service
        booking.listing = listing;
        booking.user = req.user;
        await sendBookingConfirmationEmail(booking);
        
        // Update tracking fields in DB
        await Booking.updateOne({ _id: booking._id }, {
            confirmationEmailSent: true,
            confirmationEmailSentAt: new Date()
        });
    } catch (err) {
        console.error("Failed to send booking confirmation email:", err);
    }

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

module.exports.getCancellationData = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id).populate("listing");
        if (!booking || !booking.user.equals(req.user._id)) {
            return res.status(404).json({ error: "Booking not found" });
        }
        
        const now = new Date();
        const refundDetails = calculateCancellationRefund(booking, now);
        
        res.json({
            bookingId: booking._id,
            propertyImage: booking.listing.image && booking.listing.image.url ? booking.listing.image.url : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
            propertyName: booking.listing.title,
            location: booking.listing.location,
            bookingAmount: booking.totalPrice,
            refundAmount: refundDetails.refundAmount,
            refundPercentage: refundDetails.refundPercentage,
            deductionAmount: refundDetails.deductionAmount,
            policyText: refundDetails.policyText,
            cancellationMessage: refundDetails.cancellationMessage,
            canCancel: refundDetails.canCancel,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            guests: booking.guests
        });
    } catch (err) {
        console.error("Error fetching cancellation data:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
