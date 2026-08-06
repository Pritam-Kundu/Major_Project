const transporter = require("../utils/mailer");

async function sendBookingConfirmationEmail(booking) {
    // Note: It's expected that booking.listing and booking.user are already populated when this is called.
    const listing = booking.listing;
    const user = booking.user;

    const oneDay = 1000 * 60 * 60 * 24;
    const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / oneDay);

    const checkInStr = new Date(booking.checkIn).toLocaleDateString("en-IN", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const checkOutStr = new Date(booking.checkOut).toLocaleDateString("en-IN", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const bookingDateStr = new Date(booking.bookedAt || Date.now()).toLocaleDateString("en-IN", {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const formatCurrency = (amount) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

    let hostName = "Property Owner";
    if (listing.owner) {
        if (listing.owner.firstName && listing.owner.lastName) {
            hostName = `${listing.owner.firstName} ${listing.owner.lastName}`;
        } else if (listing.owner.username) {
            hostName = listing.owner.username;
        } else if (listing.owner.email) {
            hostName = listing.owner.email.split('@')[0];
        }
    }
    const propertyImage = listing.image && listing.image.url ? listing.image.url : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267";

    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Booking Confirmed | Homigo</title>
        <style>
            body { font-family: 'Inter', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
            .container { max-width: 650px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #2f80ed 0%, #1e5ab3 100%); padding: 40px 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
            .header p { margin: 10px 0 0; font-size: 18px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 20px; color: #333; margin-bottom: 20px; }
            .greeting-text { color: #555; line-height: 1.6; margin-bottom: 30px; }
            .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 20px; font-weight: 600; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .details-table td { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
            .details-table td:first-child { color: #666; font-weight: 500; width: 45%; }
            .details-table td:last-child { color: #222; font-weight: 600; text-align: right; }
            .property-img-container { margin: 30px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .property-img { width: 100%; height: auto; display: block; }
            .policy-box { background-color: #f9fbfd; border-left: 4px solid #2f80ed; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 35px; }
            .policy-box h4 { margin: 0 0 10px; color: #2f80ed; font-size: 16px; }
            .policy-box p { margin: 0; color: #555; font-size: 14px; line-height: 1.5; }
            .actions { text-align: center; margin-top: 40px; }
            .btn { display: inline-block; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: 600; margin: 5px; transition: all 0.3s ease; }
            .btn-primary { background-color: #2f80ed; color: #ffffff !important; box-shadow: 0 4px 15px rgba(47, 128, 237, 0.3); }
            .btn-secondary { background-color: #f0f4f8; color: #2f80ed !important; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #888; font-size: 13px; line-height: 1.6; }
            .footer a { color: #2f80ed; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Homigo</h1>
                <p>Booking Confirmed ✅</p>
            </div>
            
            <div class="content">
                <div class="greeting">Hello ${user.username || user.email.split('@')[0]},</div>
                <div class="greeting-text">
                    Thank you for choosing Homigo. We are thrilled to host you! Your booking has been successfully confirmed. Please review your trip details below.
                </div>

                <div class="property-img-container">
                    <img src="${propertyImage}" alt="${listing.title}" class="property-img">
                </div>

                <div class="section-title">Booking Details</div>
                <table class="details-table">
                    <tr><td>Booking Reference</td><td>${booking.bookingReference || booking._id}</td></tr>
                    <tr><td>Property Name</td><td>${listing.title}</td></tr>
                    <tr><td>Location</td><td>${listing.location || 'See map on website'}</td></tr>
                    <tr><td>Host Name</td><td>${hostName}</td></tr>
                    <tr><td>Check-in Date</td><td>${checkInStr} (From 2:00 PM)</td></tr>
                    <tr><td>Check-out Date</td><td>${checkOutStr} (Until 11:00 AM)</td></tr>
                    <tr><td>Number of Nights</td><td>${nights}</td></tr>
                    <tr><td>Guests</td><td>${booking.guests} Guest(s)</td></tr>
                    <tr><td>Booking Date</td><td>${bookingDateStr}</td></tr>
                </table>

                <div class="section-title">Payment Details</div>
                <table class="details-table">
                    <tr><td>Subtotal</td><td>${formatCurrency(booking.subtotal)}</td></tr>
                    <tr><td>Taxes (GST)</td><td>${formatCurrency(booking.gst)}</td></tr>
                    <tr><td>Grand Total</td><td style="font-size: 18px; color: #2f80ed;">${formatCurrency(booking.totalPrice)}</td></tr>
                    <tr><td>Payment Status</td><td><span style="color: #27ae60;">✔ ${booking.paymentStatus || 'Confirmed'}</span></td></tr>
                    ${booking.paymentMethod ? '<tr><td>Payment Method</td><td>' + booking.paymentMethod + '</td></tr>' : ''}
                </table>

                <div class="policy-box">
                    <h4>Cancellation Policy</h4>
                    <p>Free cancellation is available until 48 hours before the check-in date. A 50% charge will apply if cancelled within 7 days of check-in, and 10% if cancelled more than 7 days before check-in (after 24 hours of booking).</p>
                </div>

                <div class="actions">
                    <a href="https://homigo-app.onrender.com/bookings" class="btn btn-primary">View Booking</a>
                    <a href="https://homigo-app.onrender.com/bookings" class="btn btn-secondary">Manage</a>
                    <a href="https://homigo-app.onrender.com/listings" class="btn btn-secondary">More Hotels</a>
                </div>
            </div>

            <div class="footer">
                <p><strong>The Homigo Team</strong><br>
                Need help? Contact our Customer Support at <a href="mailto:support@homigo.com">support@homigo.com</a></p>
                <p><a href="https://homigo-app.onrender.com">www.homigo.com</a></p>
                <p>&copy; ${new Date().getFullYear()} Homigo. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        await transporter.sendMail({
            from: '"Homigo" <' + process.env.EMAIL_USER + '>',
            to: user.email,
            subject: "🏨 Booking Confirmed | Homigo",
            html: emailHTML
        });
    } catch (err) {
        throw err;
    }
}

module.exports = {
    sendBookingConfirmationEmail
};
