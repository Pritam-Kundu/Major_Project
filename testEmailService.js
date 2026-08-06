const { sendBookingConfirmationEmail } = require("./services/bookingEmailService");

async function run() {
    const mockBooking = {
        _id: "60f7b1b3b3b3b3b3b3b3b3b3",
        bookingReference: "HMG-20260807-8F41D2",
        checkIn: new Date("2026-08-10"),
        checkOut: new Date("2026-08-15"),
        guests: 2,
        subtotal: 5000,
        gst: 900,
        totalPrice: 5900,
        paymentStatus: "Paid",
        paymentMethod: "Credit Card",
        bookedAt: new Date(),
        listing: {
            title: "Beautiful Beachhouse",
            location: "Goa, India",
            image: { url: "https://example.com/image.jpg" }
        },
        user: {
            email: "test@example.com",
            username: "pritam_k"
        }
    };
    
    // We will just patch the transporter to not actually send the email, 
    // but just print success to verify the template compiles without crash.
    const mailer = require("./utils/mailer");
    mailer.sendMail = async (opts) => {
        console.log("Email HTML generated successfully. Length:", opts.html.length);
        console.log("Email Subject:", opts.subject);
        return true;
    };

    try {
        await sendBookingConfirmationEmail(mockBooking);
        console.log("Test passed!");
    } catch(err) {
        console.error("Test failed:", err);
    }
}

run();
