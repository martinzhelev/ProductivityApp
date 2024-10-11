const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require('../models/user');

// Middleware to parse JSON bodies
router.use(bodyParser.json());

// Connect to MongoDB using Mongoose
const url = "mongodb://localhost:27017/ProductivityApp"; // Make sure to include the database name

mongoose.connect(url)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("MongoDB connection error:", err));

// Define a User schema


// Render the registration form
router.get("/", (req, res) => {
    
    res.render("register");  // Ensure that 'register' is a valid template
});

// Handle user registration POST request
router.post('/', async (req, res) => {
    const { username, email, password } = req.body;

    console.log("Attempting registration...");

    // Validate the fields
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const userObject = { username, email, password };
    console.log(userObject);

    try {
        // Create a new user document
        const newUser = new User(userObject);
        await newUser.save(); // Save the user to the database
        console.log("User registered successfully");
        //return res.redirect('/login');
        res.status(200).json({ message: 'User registered successfully', redirectUrl: '/login' });
    } catch (err) {
        console.error("Error inserting user:", err);
        res.status(500).json({ message: 'Error inserting user' });
    }
});

module.exports = router;
