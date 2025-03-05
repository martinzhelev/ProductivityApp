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
    const userId = req.userId;

    try {
        const [rows] = await db.execute(
            "SELECT id, type, start_date, end_date, description FROM time_off WHERE user_id = ? ORDER BY start_date ASC",
            [userId]
        );

        // Organize data by type
        const timeOffData = {
            day: rows.filter(row => row.type === 'day'),
            week: rows.filter(row => row.type === 'week'),
            month: rows.filter(row => row.type === 'month'),
            year: rows.filter(row => row.type === 'year')
        };

        res.render("timeoff", {
            timeOffData,
            userId
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/add", async (req, res) => {
    const { type, start_date, end_date, description } = req.body;
    const userId = req.userId;

    try {
        if (!type || !start_date || !end_date) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        // For daily, set end_date = start_date
        const finalEndDate = type === 'day' ? start_date : end_date;

        await db.execute(
            "INSERT INTO time_off (user_id, type, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)",
            [userId, type, start_date, finalEndDate, description || null]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Database add time off error:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

router.delete("/delete", async (req, res) => {
    const { id } = req.body;
    const userId = req.userId;

    try {
        const [result] = await db.execute(
            "DELETE FROM time_off WHERE user_id = ? AND id = ?",
            [userId, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Time off entry not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Database delete time off error:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

module.exports = router;