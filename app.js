// This line is used to load environment variables from a .env file 
// into your Node.js application.
require("dotenv").config();

const express = require("express"); // load the express file into app.js
const app = express();

// import Frameworks
const mongoose = require("mongoose"); // Load database
const path = require("path"); // Load each paths
const methodOverride = require("method-override"); // Load extra features of form (PUT, DELETE exc GET, POST)
const ejsMate = require("ejs-mate"); // Load ejs

// Import Files
const wrapAsync = require("./utils/wrapAsync.js"); // Load error handling file 
const ExpressError = require("./utils/ExpressError.js"); // Load custom error file
const { listingSchema, reviewSchema } = require("./schema.js") // Load only the targetted schemas
const sessions = require("express-session") // Load the user session
const flash = require("connect-flash") // Load the flas messages
const passport = require("passport") // Load the passport - Which is only the structure 
const LocalStrategy = require("passport-local") // Load the possport-local - which provides a strategy for authentication


// These lines import various Express routers. To keep app.js clean, different parts of the application (listings, reviews, users, etc.) have their routes defined in separate files inside the ./routes folder.
const listingRouter = require("./routes/listing.js")
const reviewRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")
const bookingRouter = require("./routes/booking.js");
const notificationRouter = require("./routes/notification.js");
const offerRouter = require("./routes/offer.js");
const importRouter = require("./routes/import.js");
const helpRouter = require("./routes/help.js");
const pagesRouter = require("./routes/pages.js");

// Imports the Mongoose models for Listings, Reviews, and Users. 
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const User = require("./models/user.js")

// Defines the connection string for your MongoDB Atlas cloud database. 
const MONGO_URL =
  "mongodb+srv://pritamkundu144:uIu4jMuiQCnBL6IH@cluster0.bdlozc5.mongodb.net/wanderlust?retryWrites=true&w=majority&appName=Cluster0";

// Show success or error message of the database to terminal
main()
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Connection error:", err);
  });

async function main() {
  await mongoose.connect(MONGO_URL); // connect the URL to mongoose
}


app.set("view engine", "ejs"); // Tells Express to use EJS
app.set("views", path.join(__dirname, "views")); // Sets the directory where Express should look for those EJS template files 

app.use(express.urlencoded({ extended: true })); // allows Express to read data coming from HTML forms.
app.use(express.json());
app.use(methodOverride("_method")); // Tells Express to use method-override, override POST requests with PUT/PATCH/DELETE.
app.engine("ejs", ejsMate); // Tells Express to use ejsMate - allows your project have a common layout like the same HTML structure on every page.
app.use(express.static(path.join(__dirname, "/public"))); // Make CSS, JavaScript, images, etc. inside public available to the browser


// Cookie implementation
const sessionOptions = {
  secret: "mysupersecretcode",           //Ensures that the cookie can’t be modified by the client (it’s signed).
  resave: false,                         //This tells Express not to save the session back to the session store if nothing was modified.
  saveUninitialized: true,                //Forces session to be stored even if no data is set yet.
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,       //After 7 days cookie will be deleted 
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  }
}



// app.get("/", (req, res) => {
//   res.send("I am root");
// });




app.use(sessions(sessionOptions)) // Used the sessionOptions defined above 
app.use(flash()) // used the flash implemented above


app.use(passport.initialize()) // Initializes Passport for incoming requests.
app.use(passport.session()) // Tells Passport to use express-session to manage persistent login sessions.

// It tells Passport: "For normal username/password login, use the Local Strategy, and let my User model's authenticate() method verify the credentials."
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser()) // Tells Passport how to store a user in the session
passport.deserializeUser(User.deserializeUser()) // Tells Passport how to retrieve a user from the session


// For every page in Homigo, make the success message, error message, and currently logged-in user available to the EJS templates.
app.use((req, res, next) => {
  res.locals.success = req.flash("success")
  res.locals.error = req.flash("error")
  res.locals.currUser = req.user
  next()
})

// intercepts anyone going to the root URL (/) and automatically redirects them to the /listings page.
app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/listings", listingRouter)         // Rest code is in routes->listing.js
app.use("/listings/:id/reviews", reviewRouter)
app.use("/", userRouter)
app.use("/bookings", bookingRouter);
app.use("/notifications", notificationRouter);
app.use("/offers", offerRouter);
app.use("/import", importRouter);
app.use("/help", helpRouter);
app.use("/", pagesRouter);

// **
app.get('/privacy', (req, res) => {
  res.render("privacy")
})
app.get('/terms', (req, res) => {
  res.render("terms");
});


// Error handler - this is the global error-handling middleware.
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  let { statusCode = 500 } = err;
  let message = err.message || "Something went wrong...";
  return res.status(statusCode).render("error.ejs", { message });
});


// setting port number
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});