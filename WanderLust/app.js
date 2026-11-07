if (process.env.NODE_ENV !== "production") {
    require("dotenv").config({ override: true }); // Force override system env variables
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listing = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// Database & Secret Setup
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";
const secret = process.env.SECRET || "thisshouldbeabettersecret!";

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log("Database connection error:", err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

// App Configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// Mongo Session Store Setup
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: secret,
    },
    touchAfter: 24 * 3600, // 24 hours
});

store.on("error", (err) => {
    console.log("ERROR IN MONGO SESSION STORE:", err);
});

// Session Middleware
const sessionOptions = {
    store,
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash & Local Variables
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// Routes
app.use("/listings", listing);
app.use("/listings/:id/reviews", reviews);
app.use("/", userRouter);

// Error Handling
app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

// Start Server
const PORT = process.env.PORT || 9090;

app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
    console.log("CURRENT ATLASDB_URL IS:", process.env.ATLASDB_URL);
});