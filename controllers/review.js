const Review = require("../models/review.js")
const Listing = require("../models/listing.js")


module.exports.createReview = async(req, res) => {
  let { id } = req.params
  let listing = await Listing.findById(req.params.id)
  let newReview = new Review(req.body.review)
  
  // Set author only if user is logged in
  if (req.user) {
    newReview.author = req.user._id;
  } else {
    newReview.author = null; // Explicitly set to null for clarity
  }

  listing.reviews.push(newReview)

  await newReview.save()
  await listing.save()

  req.flash("success","Your review has been added!")
  res.redirect(`/listings/${listing._id}`)
}


module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params

  // Find the review and listing
  const review = await Review.findById(reviewId);
  const listing = await Listing.findById(id);

  // If review doesn't exist, or listing doesn't exist, deny
  if (!review || !listing) {
    req.flash("error", "Review or listing not found!");
    return res.redirect(`/listings/${id}`);
  }

  // If review is anonymous, only listing owner can delete
  if (!review.author) {
    if (!req.user || !listing.owner.equals(req.user._id)) {
      req.flash("error", "Only the listing owner can delete anonymous reviews!");
      return res.redirect(`/listings/${id}`);
    }
  } else {
    // If review has an author, only author can delete
    if (!req.user || !review.author.equals(req.user._id)) {
      req.flash("error", "You do not have permission to delete this review!");
      return res.redirect(`/listings/${id}`);
    }
  }

  // Remove review reference from listing and delete review
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  req.flash("success","Your review has been deleted!")
  res.redirect(`/listings/${id}`)
}