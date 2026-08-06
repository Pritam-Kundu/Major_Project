const { required } = require("joi")
const mongoose = require("mongoose")
const Schema = mongoose.Schema
const passportLocalMongoose = require("passport-local-mongoose")
const { findByUsername } = require("./review")


const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    wishlist: [
        {
            type: Schema.Types.ObjectId,
            ref: "Listing"
        }
    ],
    recentlyViewed: [
        {
            listing: {
                type: Schema.Types.ObjectId,
                ref: "Listing"
            },
            viewedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    collections: [
        {
            name: String,
            listings: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Listing"
                }
            ]
        }
    ],
    claimedOffers: [
        {
            type: Schema.Types.ObjectId,
            ref: "Offer"
        }
    ],
    // Extended fields for realistic Demo Ecosystem profiles
    profileAvatar: {
        type: String,
        default: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    },
    city: String,
    country: String,
    memberSince: {
        type: Date,
        default: Date.now
    },
    bio: String,
    preferredLanguage: {
        type: String,
        default: "English"
    },
    travelPreference: {
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
            "General"
        ],
        default: "General"
    }
})


userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", userSchema)