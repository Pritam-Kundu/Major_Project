const Joi = require('joi');

module.exports.listingSchema = Joi.object({
    listing : Joi.object({
        title : Joi.string().required(),
        description : Joi.string().required(),
        price : Joi.number().required().min(0),
        country : Joi.string().required(),
        location : Joi.string().required(),
        image : Joi.string().allow("", null),
        category: Joi.string().required(),
        latitude: Joi.number().allow(null),
        longitude: Joi.number().allow(null),
        source: Joi.string().allow("", null),
        osmId: Joi.string().allow("", null),
        lastUpdated: Joi.date().allow(null),
        website: Joi.string().allow("", null),
        phone: Joi.string().allow("", null)
    }).required()
})


module.exports.reviewSchema = Joi.object({
    review : Joi.object({
        rating : Joi.number().required().min(1).max(5),
        comment : Joi.string().required()
    }).required()
})