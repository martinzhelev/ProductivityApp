const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const db = require("../server");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

router.use(bodyParser.json());



router.get('/', (req, res) => {
    res.render('login');
});

router.post('/', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query to find the user by username
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length > 0) {
            const user = rows[0];
            
            // Compare the provided password with the hashed password
            const passwordMatch = await bcrypt.compare(password, user.password);
            
            if (passwordMatch) {
                // Create JWT token
                const token = jwt.sign(
                    { 
                        userId: user.user_id,
                        username: user.username
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                // Set the token in an HTTP-only cookie
                res.cookie('token', token, { 
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });

                // Also set userId cookie for compatibility
                res.cookie('userId', user.user_id, {
                    maxAge: 24 * 60 * 60 * 1000,
                    httpOnly: false
                });

                res.status(200).json({ 
                    message: 'Login successful', 
                    redirectUrl: `/home/${user.user_id}`
                });
            } else {
                res.status(401).json({ message: 'Invalid password' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;


