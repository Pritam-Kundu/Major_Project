if (process.env.NODE_ENV != "production") {
  require("dotenv").config()
}

const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const { isLoggedIn } = require("../middleware.js");

const multer = require("multer")
const { storage } = require("../cloudconfig.js")
const upload = multer({ storage })

const listingController = require("../controllers/listing.js");

const validateListing = (req, res, next) => {
  //validate the listing schema done by joi
  let { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    return next(new ExpressError(400, msg));
    // throw new ExpressError(400, msg)
  } else {
    next();
  }
};


router                                              //Index Route and Create Route is combined here
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.array("listing[images]", 10),
    validateListing,                      //After going to mentioned route it will validate the listing after that it will do the further work
    wrapAsync(listingController.createListing)
  )


//New Route
router.get("/new", isLoggedIn, wrapAsync(listingController.renderNewForm));
router.get(
  "/my-properties",
  isLoggedIn,
  wrapAsync(listingController.myProperties)
);


router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    upload.array("listing[images]", 10),
    validateListing,
    wrapAsync(listingController.updatedListing)
  )
  .delete(isLoggedIn, wrapAsync(listingController.destroyListing))



//Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  wrapAsync(listingController.renderEditForm)
);




module.exports = router;
