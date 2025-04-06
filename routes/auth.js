const express = require('express');
const router = express.Router();

router.get('/logout', (req, res) => {
    // Clear the JWT token cookie
    res.cookie('token', '', { 
        maxAge: -1,  // Negative value to delete the cookie
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/'
    });
    
    // Clear the userId cookie
    res.cookie('userId', '', { 
        maxAge: -1,
        httpOnly: false,
        path: '/'
    });
    
    // Render the logout page
    res.render('logout', (err, html) => {
        if (err) {
            console.error('Error rendering logout page:', err);
            return res.redirect('/login');
        }
        
        // Send the rendered page
        res.send(html);
        
        // Destroy the session after sending the response
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            }
        });
    });
});

module.exports = router;