const express = require("express")
const router = express.Router({mergeParams: true})              //If there is something in parent route which we want to pass to child we have to use {mergeparams:true}....
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js")
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const {isLoggedIn} = require("../middleware.js")

const reviewController = require("../controllers/review.js")


const validateReview = (req, res, next) => {           //validate the review schema done by joi
  let {error} = reviewSchema.validate(req.body)
    if(error){
      const msg = error.details.map((el) => el.message).join(", ");
      return next(new ExpressError(400, msg));
      // throw new ExpressError(400, msg)
    } else{
      next()
    }
}



// Reviews
// Post Review Route
router.post("/", validateReview ,wrapAsync(reviewController.createReview))

//Delete Review Route
router.delete("/:reviewId" ,wrapAsync(reviewController.destroyReview))


module.exports = router