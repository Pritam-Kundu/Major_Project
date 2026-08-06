const transporter = require("./mailer");

async function sendCancellationEmail(booking, listing, userEmail) {
    const formattedRefund = booking.refundAmount > 0 
        ? `₹${booking.refundAmount.toLocaleString("en-IN")}` 
        : "No Refund Applicable";

    await transporter.sendMail({
        from: `"Homigo" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Booking Cancelled - ${listing.title}`,
        html: `
<div style="font-family:Arial;padding:40px;background:#f5f5f5;">
    <div style="max-width:600px;margin:auto;background:white;padding:40px;border-radius:15px; border-top: 5px solid #dc3545;">
        <h1 style="color:#2f80ed;text-align:center;margin-top:0;">Homigo</h1>
        <h2 style="text-align:center;color:#333;">Booking Cancellation Confirmed</h2>
        
        <p style="color:#555;font-size:16px;">We have processed the cancellation for your upcoming stay at <strong>${listing.title}</strong>.</p>
        
        <div style="background:#f8f9fa;padding:20px;border-radius:10px;margin:25px 0;">
            <h3 style="margin-top:0;font-size:16px;color:#333;">Cancellation Details</h3>
            <p style="margin:8px 0;color:#555;"><strong>Booking ID:</strong> ${booking._id}</p>
            <p style="margin:8px 0;color:#555;"><strong>Check-in:</strong> ${booking.checkIn.toLocaleDateString()}</p>
            <p style="margin:8px 0;color:#555;"><strong>Check-out:</strong> ${booking.checkOut.toLocaleDateString()}</p>
            <p style="margin:8px 0;color:#555;"><strong>Reason:</strong> ${booking.cancellationReason}</p>
        </div>

        <div style="background:#fff3cd;padding:20px;border-radius:10px;border-left:5px solid #ffc107;margin:25px 0;">
            <h3 style="margin-top:0;font-size:16px;color:#856404;">Refund Information</h3>
            <p style="margin:8px 0;color:#856404;"><strong>Refund Amount:</strong> ${formattedRefund}</p>
            <p style="margin:8px 0;color:#856404;"><strong>Status:</strong> ${booking.refundStatus}</p>
            <p style="margin:8px 0;color:#856404;font-size:14px;margin-top:15px;"><em>Policy applied: ${booking.cancellationMessage}</em></p>
        </div>
        
        <p style="color:#555;">If a refund is applicable, it will be processed to your original payment method within 5-7 business days.</p>
        
        <hr style="border:0;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#888;font-size:14px;text-align:center;">The Homigo Team</p>
    </div>
</div>
`
    });
}

module.exports = sendCancellationEmail;
