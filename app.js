const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js")
const sessions = require("express-session")
const flash = require("connect-flash")
const passport = require("passport")
const LocalStrategy = require("passport-local")


const listingRouter = require("./routes/listing.js")
const reviewRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")


const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const User = require("./models/user.js")


const MONGO_URL =
  "mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0";

main()
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Connection error:", err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


const sessionOptions = {
  secret : "mysupersecretcode",           //Ensures that the cookie can’t be modified by the client (it’s signed).
  resave : false,                         //This tells Express not to save the session back to the session store if nothing was modified.
  saveUninitialized : true,                //Forces session to be stored even if no data is set yet.
  cookie : {
    expires : Date.now() + 7 * 24 * 60 * 60 * 1000,       //After 7 days cookie will be deleted 
    maxAge : 7 * 24 * 60 * 60 * 1000,
    httpOnly : true,
  }
}



// app.get("/", (req, res) => {
//   res.send("I am root");
// });




app.use(sessions(sessionOptions))
app.use(flash())


app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())



app.use((req, res, next) => {
  res.locals.success = req.flash("success")
  res.locals.error = req.flash("error")
  res.locals.currUser = req.user
  next()
})


app.use("/listings", listingRouter)         //Rest code is in routes->listing.js
app.use("/listings/:id/reviews", reviewRouter)
app.use("/", userRouter)


app.get('/privacy', (req,res) => {
  res.render("privacy")
})
app.get('/terms', (req, res) => {
  res.render("terms");
});


app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  let { statusCode = 500 } = err;
  let message = err.message || "Something went wrong...";
  return res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
  console.log("Server is listening to port 8080");
});
