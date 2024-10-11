const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require('../models/user');


router.use(bodyParser.json());

const url = "mongodb://localhost:27017/ProductivityApp"; 

mongoose.connect(url)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("MongoDB connection error:", err));  




router.get('/', (req, res)=>{
    res.render('login');
})


router.post('/', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log("post trying")
        // Find the user by their name
        const user = await User.findOne({ username });
        console.log(user)
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Compare the provided password with the stored password
        if (user.password !== password) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        // If passwords match, send a success response
        res.status(200).json({ message: 'Login successful', redirectUrl: '/home' });
        

    } catch (error) {
        return res.status(500).json({ message: 'An error occurred during login', error: error.message });
    }
});


module.exports = router;
