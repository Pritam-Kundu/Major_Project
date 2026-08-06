const Support = require("../../models/support.js");

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];

const supportMessages = {
    "Booking": [
        "I need to change the dates for my upcoming stay.",
        "Can I add one more guest to my reservation?",
        "I haven't received my booking confirmation email."
    ],
    "Payment": [
        "My payment failed but the money was deducted from my account.",
        "I would like to request a refund for my cancelled booking.",
        "Can I get an invoice for my recent stay?"
    ],
    "Property": [
        "Does the property have wheelchair access?",
        "Is late check-in available?",
        "Do you allow pets at this location?"
    ],
    "Account": [
        "I am unable to update my profile picture.",
        "How do I change my preferred language?",
        "I want to delete my account."
    ],
    "Other": [
        "I have a general inquiry about your services.",
        "Where can I find the terms and conditions?",
        "I experienced a bug on the mobile website."
    ]
};

async function seedSupport(users, bookings) {
    console.log("--- Seeding Support Tickets ---");

    const demoUserIds = users.map(u => u._id);
    await Support.deleteMany({ user: { $in: demoUserIds } });

    let ticketsCreated = 0;

    for (let user of users) {
        // Not every user submits a support ticket (e.g., 20% chance)
        if (Math.random() > 0.20) continue;

        const category = randomEl(Object.keys(supportMessages));
        const message = randomEl(supportMessages[category]);
        
        let linkedBooking = null;
        if (category === "Booking" || category === "Payment") {
            // Find a booking belonging to this user
            const userBookings = bookings.filter(b => b.user.equals(user._id));
            if (userBookings.length > 0) {
                linkedBooking = randomEl(userBookings)._id;
            }
        }

        const ticket = new Support({
            user: user._id,
            name: user.username, // From our demo user
            email: user.email,
            subject: `${category} Inquiry`,
            category: category,
            booking: linkedBooking,
            message: message,
            status: randomEl(["Open", "In Progress", "Resolved"]),
            createdAt: new Date(Date.now() - randomInt(1, 60) * 24 * 60 * 60 * 1000) // random within last 60 days
        });

        await ticket.save();
        ticketsCreated++;
    }

    console.log(`Successfully generated ${ticketsCreated} realistic support tickets.`);
}

module.exports = seedSupport;
