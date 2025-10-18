const express = require('express');
const router = express.Router();

// Privacy Policy Page
router.get('/', (req, res) => {
    res.render('privacy', {
        title: 'Privacy Policy - Amblezio'
    });
});

module.exports = router;
