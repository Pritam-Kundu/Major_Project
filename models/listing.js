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
        enum: ["Beaches", "Mountains", "Forests", "Castles", "Pools", "Campings", "Farms", "Arctic", "House Boats", "Domes"]
    }
})


listingSchema.post("findOneAndDelete", async(listing) => {
    if(listing){
        await Review.deleteMany({_id: {$in: listing.reviews}})
    }
})


const Listing = mongoose.model("Listing", listingSchema)
module.exports = Listing;