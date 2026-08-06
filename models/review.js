const { string } = require("joi")
const mongoose = require("mongoose")
const Schema = mongoose.Schema

const reviewSchema = new Schema({
    comment : {
        type : String,
        required : true
    },
    rating : {
        type : Number,
        min : 1,
        max : 5
    },
    createdAt : {
        type : Date,
        default : Date.now()
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    // Extended fields for demo and advanced review functionalities
    title: {
        type: String
    },
    travelerType: {
        type: String,
        enum: [
            "Solo Traveller", 
            "Business Traveller", 
            "Couple Traveller", 
            "Family Traveller", 
            "Luxury Traveller", 
            "Budget Traveller", 
            "Backpacker", 
            "Weekend Traveller", 
            "Adventure Traveller",
            "Friends Group",
            "General",
            "Couple",
            "Family"
        ],
        default: "General"
    },
    helpfulCount: {
        type: Number,
        default: 0
    },
    ownerReply: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model("Review", reviewSchema)