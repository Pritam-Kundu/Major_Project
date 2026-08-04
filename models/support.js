const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    name: String,

    email: String,

    subject: {
        type: String,
        required: true
    },

    category: {
        type: String,
        enum: [
            "Booking",
            "Payment",
            "Property",
            "Account",
            "Other"
        ],
        default: "Other"
    },

    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        default: null
    },

    message: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: [
            "Open",
            "In Progress",
            "Resolved"
        ],
        default: "Open"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Support", supportSchema);