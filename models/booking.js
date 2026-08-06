const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
    },

    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    checkIn: {
        type: Date,
        required: true,
    },

    checkOut: {
        type: Date,
        required: true,
    },

    guests: {
        type: Number,
        required: true,
        min: 1,
    },

    subtotal: {
        type: Number,
        required: true
    },

    gst: {
        type: Number,
        required: true
    },

    totalPrice: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: ["Booked", "Confirmed", "Cancelled"],
        default: "Booked",
    },

    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending"
    },

    paymentMethod: {
        type: String
    },

    paymentReference: {
        type: String
    },

    paymentDate: {
        type: Date
    },

    bookedAt: {
        type: Date,
        default: Date.now,
    },

    cancelledAt: {
        type: Date,
        default: null,
    },

    refundAmount: {
        type: Number,
        default: 0,
    },

    refundPercentage: {
        type: Number,
        default: 0,
    },

    deductionAmount: {
        type: Number,
        default: 0,
    },

    refundStatus: {
        type: String,
        enum: ["Pending", "Processing", "Refunded", "Not Applicable"],
        default: "Pending",
    },

    cancellationReason: {
        type: String,
    },

    cancellationMessage: {
        type: String,
    },

    cancellationDeadline: {
        type: Date,
    },

    bookingReference: {
        type: String,
        unique: true,
        sparse: true,
    },

    confirmationEmailSent: {
        type: Boolean,
        default: false,
    },

    confirmationEmailSentAt: {
        type: Date,
    },
});

bookingSchema.pre('save', function (next) {
    if (!this.bookingReference) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(16).substr(2, 6).toUpperCase();
        this.bookingReference = `HMG-${dateStr}-${randomStr}`;
    }
    next();
});

module.exports = mongoose.model("Booking", bookingSchema);