const express = require('express');
const mysql = require('mysql2/promise')
const bodyParser = require('body-parser');  
const app = express();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { startScheduler } = require('./utils/scheduler');

// Raw body parser for Stripe webhooks - MUST be before JSON parser
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

// Middleware for JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// JWT middleware
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Set EJS as the view engine
app.set('view engine', 'ejs');

const db = mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    user: 'root',
    password: null,
    database: "productivityapp",
    waitForConnections: true,
    connectionLimit: 0,
    queueLimit: 0,
});

module.exports = db;

// Route Imports
const landingRouter = require('./routes/landing');
const loginRouter = require("./routes/login");
const registerRouter = require("./routes/register");
const homeRouter = require("./routes/home");
const bodyRouter = require("./routes/body");
const mentalRouter = require('./routes/mental');
const workRouter = require('./routes/work')
const socialRouter = require('./routes/social')
const timeOffRouter = require('./routes/timeOff');
const calorieTrackerRouter = require("./routes/calorieTracker");
const profileRouter = require("./routes/profile");
const authRouter = require("./routes/auth");
const subscribeRouter = require("./routes/subscribe");
const stripeRouter = require("./routes/stripe"); // Активирано
const { requirePremium, checkSubscriptionStatus, redirectFreeUsers } = require('./middleware/subscriptionMiddleware');

// Mount Routes
app.use("/", landingRouter);
app.use("/register", registerRouter);
app.use("/login", loginRouter);  
app.use("/home", authMiddleware, homeRouter);

// Premium routes - redirect free users to payments page
app.use("/body", authMiddleware, redirectFreeUsers, bodyRouter);
app.use('/mental', authMiddleware, redirectFreeUsers, mentalRouter);
app.use("/work", authMiddleware, redirectFreeUsers, workRouter);
app.use("/social", authMiddleware, redirectFreeUsers, socialRouter);
app.use("/timeoff", authMiddleware, redirectFreeUsers, timeOffRouter);
app.use("/calorieTracker", authMiddleware, redirectFreeUsers, calorieTrackerRouter);
app.use("/profile", authMiddleware, redirectFreeUsers, profileRouter);

// Auth and subscription routes
app.use("/auth", authRouter);
app.use("/subscribe", subscribeRouter); // Removed authMiddleware to allow success/cancel pages
app.use("/stripe", stripeRouter); // Активирано

// Start the email reminder scheduler
startScheduler();

// Handle 404 errors
app.use((req, res) => {
    res.status(404).send("Page not found");
});

// Handle other errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
