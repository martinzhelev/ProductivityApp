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

function getCurrentMonthYear() {
    const now = new Date();
    return { currentYear: now.getFullYear(), currentMonth: now.getMonth() };
}

router.get("/:userId", async (req, res) => {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    try {
        const [countResult] = await db.execute(
            "SELECT COUNT(*) as total FROM social WHERE user_id = ?",
            [userId]
        );
        const totalEvents = countResult[0].total;
        const totalPages = Math.ceil(totalEvents / limit);

        const [rows] = await db.execute(
            "SELECT id, date, time, event_name FROM social WHERE user_id = ? ORDER BY ABS(DATEDIFF(date, CURDATE())) ASC, date ASC, time ASC LIMIT ? OFFSET ?",
            [userId, limit, offset]
        );

        res.render("social", {
            socializingData: rows,
            currentPage: page,
            totalPages: totalPages,
            limit: limit,
            userId: userId
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Internal Server Error");
    }
});



router.post("/update", async (req, res) => {
    const { date, time, eventName } = req.body;
    const userId = req.userId;

    try {
        const [existing] = await db.execute(
            "SELECT id FROM social WHERE user_id = ? AND date = ? AND time = ?",
            [userId, date, time]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                error: "An event with the same date and time already exists for this user"
            });
        }
        else{
            await db.execute(
                "INSERT INTO social (user_id, date, time, event_name) VALUES (?, ?, ?, ?) ",
                [userId, date, time, eventName || "Social Event"]
            );
            res.json({ success: true });
        }
        
    } catch (error) {
        console.error("Database update error:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

router.delete("/delete", async (req, res) => {
    const { id } = req.body; // Changed from date to id
    const userId = req.userId;

    try {
        const [result] = await db.execute(
            "DELETE FROM social WHERE user_id = ? AND id = ?",
            [userId, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Event not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Database delete error:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

module.exports = router;