const mongoose = require("mongoose")
const Schema = mongoose.Schema
const Review = require("./review.js")


const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String,
    },
    images: [{
        url: String,
        filename: String,
    }],
    price: Number,
    location: String,
    country: String,
    reviews: [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Review"
    }],
    owner: {
        type : mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    category: {
        type: String,
        enum: ["Trending", "Unique", "Beaches", "Mountains", "Forests", "Castles", "Pools", "Campings", "Farms", "Arctic", "House Boats", "Domes"]
    },
    // New future-proof filter fields (Arrays of Strings to allow multiple selections)
    roomTypes: [String],
    bookingOptions: [String],
    mealPlans: [String],
    amenities: [String],
    locationFeatures: [String],
    offers: [String],
    propertyFeatures: [String],
    paymentOptions: [String],
    safety: [String],
    hostFeatures: [String],
    accessibility: [String],
    latitude: Number,
    longitude: Number,
    source: {
        type: String,
        default: "Manual"
    },
    osmId: {
        type: String,
        sparse: true,
        unique: true
    },
    lastUpdated: Date,
    website: String,
    phone: String
})


listingSchema.post("findOneAndDelete", async(listing) => {
    if(listing){
        await Review.deleteMany({_id: {$in: listing.reviews}})
    }
})


const Listing = mongoose.model("Listing", listingSchema)
module.exports = Listing;