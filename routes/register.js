const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const db = require("../server");
const bcrypt = require('bcrypt');


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

    try {
        // Check if username or email already exists
        const [existingUsers] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the users table with hashed password
        await db.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(200).json({ 
            message: 'User registered successfully', 
            redirectUrl: '/login' 
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

module.exports = router;
