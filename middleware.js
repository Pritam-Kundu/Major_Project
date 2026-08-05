module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {     //checking whether the user is logged in or not
    req.session.redirectUrl = req.originalUrl           //req.originalUrl contains the whole path we wanted to access before login and we are storing this path in req.session so that everyone can has access to it and the variable name given is redirectUrl...So basically after login user will be redirected to the exact path from where he was redirected to login page
    req.flash("error", "You must be logged in to do this operation!");
    return res.redirect("/login");
  }
  next();
};

//Usually passport refresh its content when a new thing happen so basically when we save redirectUrl in req.session then it will be stored there but after login this information will be removed so we can't access it so we are going to save this in res.locals and passport can't delete this
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl
  }
  next()
}

module.exports.isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "Please login first.");
    return res.redirect("/login");
  }
  if (!req.user.isAdmin) {
    req.flash("error", "You are not authorized to access this page.");
    return res.redirect("/listings");
  }
  next();
};

