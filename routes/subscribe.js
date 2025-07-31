const express = require("express");
const router = express.Router();
const db = require("../server");

router.use((req, res, next) => {
    req.userId = req.cookies.userId;
    if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized: User ID not found in cookies" });
    }
    next();
});

router.get("/:userId", async (req, res) => {
    // Fetch user details
        const userId = req.userId;

    const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (userRows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.render("subscribe",{
                username: userRows[0].username,
                userId: userId

    });
})

module.exports = router;