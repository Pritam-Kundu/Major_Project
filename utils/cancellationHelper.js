function calculateCancellationRefund(booking, now = new Date()) {
    const checkInDate = new Date(booking.checkIn);
    const bookedAtDate = new Date(booking.bookedAt);
    
    const hoursSinceBooking = (now.getTime() - bookedAtDate.getTime()) / (1000 * 60 * 60);
    const daysBeforeCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    let refundPercentage = 0;
    let cancellationMessage = "";
    let policyText = "";

    if (now >= checkInDate) {
        refundPercentage = 0;
        policyText = "Non-refundable";
        cancellationMessage = "This stay has already started and can no longer be cancelled.";
    } else if (hoursSinceBooking <= 24 && daysBeforeCheckIn >= 7) {
        refundPercentage = 100;
        policyText = "100% Refund";
        cancellationMessage = "Cancelled within 24 hours of booking (and more than 7 days before check-in).";
    } else if (daysBeforeCheckIn > 7) {
        refundPercentage = 90;
        policyText = "90% Refund";
        cancellationMessage = "10% service fee deducted. Cancelled more than 7 days before check-in.";
    } else if (daysBeforeCheckIn >= 2 && daysBeforeCheckIn <= 7) {
        refundPercentage = 50;
        policyText = "50% Refund";
        cancellationMessage = "Cancelled within 7 days of check-in.";
    } else {
        refundPercentage = 0;
        policyText = "Non-refundable";
        cancellationMessage = "Cancelled within 48 hours of check-in.";
    }

    // Default to 0 to prevent NaN or undefined if missing
    const bookingAmount = booking.totalPrice || 0;
    const refundAmount = Math.round(bookingAmount * (refundPercentage / 100));
    const deductionAmount = bookingAmount - refundAmount;

    return {
        refundAmount,
        refundPercentage,
        deductionAmount,
        policyText,
        cancellationMessage,
        canCancel: now < checkInDate
    };
}

module.exports = { calculateCancellationRefund };
