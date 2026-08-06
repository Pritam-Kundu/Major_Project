const Booking = require("../../models/booking.js");
const Listing = require("../../models/listing.js");

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Dates generator
const generateBookingDates = () => {
    // Determine if booking is past, current, or future
    const isPast = Math.random() > 0.3; // 70% chance it's a past trip
    const now = new Date();
    
    let checkIn = new Date();
    let checkOut = new Date();
    
    if (isPast) {
        // Between 1 and 365 days ago
        const daysAgo = randomInt(10, 365);
        checkIn.setDate(now.getDate() - daysAgo);
        checkOut.setDate(checkIn.getDate() + randomInt(1, 14)); // 1 to 14 days stay
    } else {
        // Between 1 and 90 days in the future
        const daysFuture = randomInt(1, 90);
        checkIn.setDate(now.getDate() + daysFuture);
        checkOut.setDate(checkIn.getDate() + randomInt(1, 14));
    }
    
    // Booking was made 5 to 60 days before checkIn
    const bookedAt = new Date(checkIn);
    bookedAt.setDate(bookedAt.getDate() - randomInt(5, 60));
    
    return { checkIn, checkOut, bookedAt, isPast };
};

async function seedBookings(users) {
    console.log("--- Seeding Bookings, Trips, and Payments ---");
    
    // Clear existing demo bookings to prevent infinite bloat?
    // Let's just create new ones, the user said "Running the script again should not create duplicate demo data."
    // We can wipe bookings attached to DEMO users first to be safe.
    const demoUserIds = users.map(u => u._id);
    await Booking.deleteMany({ user: { $in: demoUserIds } });
    
    const listings = await Listing.find().select('_id price');
    if (listings.length === 0) {
        console.log("No listings found for bookings.");
        return [];
    }

    const createdBookings = [];

    for (let user of users) {
        // Each user has 0-8 bookings
        const numBookings = randomInt(0, 8);
        
        for (let i = 0; i < numBookings; i++) {
            const listing = randomEl(listings);
            const { checkIn, checkOut, bookedAt, isPast } = generateBookingDates();
            
            // Calculate pricing
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            const subtotal = (listing.price || 1500) * nights;
            const gst = Math.round(subtotal * 0.18); // Assuming 18% tax
            const totalPrice = subtotal + gst;
            
            // Randomize statuses
            let status = "Booked";
            let paymentStatus = "Pending";
            let paymentMethod = randomEl(["Credit Card", "Debit Card", "UPI", "Net Banking"]);
            let paymentDate = null;
            let cancelledAt = null;
            let refundStatus = "Not Applicable";
            let cancellationReason = "";
            
            const randStat = Math.random();
            
            if (isPast) {
                if (randStat < 0.15) {
                    // 15% chance it was cancelled in the past
                    status = "Cancelled";
                    cancelledAt = new Date(bookedAt);
                    cancelledAt.setDate(cancelledAt.getDate() + randomInt(1, 4)); // cancelled few days after booking
                    paymentStatus = "Paid";
                    paymentDate = new Date(bookedAt);
                    refundStatus = "Refunded";
                    cancellationReason = "Change of plans";
                } else {
                    // 85% chance it was a successful completed past trip
                    status = "Confirmed";
                    paymentStatus = "Paid";
                    paymentDate = new Date(bookedAt);
                }
            } else {
                // Upcoming
                if (randStat < 0.1) {
                    status = "Cancelled";
                    cancelledAt = new Date();
                    paymentStatus = "Paid";
                    paymentDate = new Date(bookedAt);
                    refundStatus = "Processing";
                    cancellationReason = "Flight delayed";
                } else if (randStat < 0.8) {
                    status = "Confirmed";
                    paymentStatus = "Paid";
                    paymentDate = new Date(bookedAt);
                } else {
                    status = "Booked"; // Just booked, pending payment
                    paymentStatus = "Pending";
                    paymentMethod = null;
                }
            }

            const booking = new Booking({
                listing: listing._id,
                user: user._id,
                checkIn: checkIn,
                checkOut: checkOut,
                guests: randomInt(1, 4),
                subtotal: subtotal,
                gst: gst,
                totalPrice: totalPrice,
                status: status,
                paymentStatus: paymentStatus,
                paymentMethod: paymentMethod,
                paymentReference: paymentStatus === 'Paid' ? `DEMOTXN${randomInt(100000, 999999)}` : undefined,
                paymentDate: paymentDate,
                bookedAt: bookedAt,
                cancelledAt: cancelledAt,
                refundStatus: refundStatus,
                cancellationReason: cancellationReason
            });

            await booking.save();
            createdBookings.push(booking);
        }
    }

    console.log(`Successfully generated ${createdBookings.length} realistic bookings (including payments, cancellations, and trips).`);
    return createdBookings;
}

module.exports = seedBookings;
