const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const db = require("../server");


// Middleware to parse JSON bodies
router.use(bodyParser.json());



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
        // Insert the new user into the users table
        await db.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, password]
        );
        res.status(200).json({ message: 'User registered successfully', redirectUrl: '/login' });
        //console.log('User registered successfully with ID:', result.insertId);
    } catch (error) {
        //console.error('Error registering user:', error);
    }
});

module.exports = router;
