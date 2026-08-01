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
    ]
})


userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", userSchema)