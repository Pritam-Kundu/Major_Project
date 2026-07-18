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
        enum: ["Booked", "Cancelled"],
        default: "Booked",
    },

    bookedAt: {
        type: Date,
        default: Date.now,
    },

    cancelledAt: {
        type: Date,
        default: null,
    },
});

module.exports = mongoose.model("Booking", bookingSchema);