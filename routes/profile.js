const express = require("express");
const router = express.Router();
const db = require("../server");

router.use((req, res, next) => {
    req.userId = req.cookies.userId;
    if (!req.userId) return res.status(401).json({ error: "Unauthorized: User ID not found" });
    next();
});

router.get("/:userId", async (req, res) => {
    const userId = req.userId;
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    try {
        // Nutrient Breakdown (Today)
        const [nutrientData] = await db.execute(
            "SELECT SUM(COALESCE(fat, 0)) as total_fat, " +
            "SUM(COALESCE(carbs, 0)) as total_carbs, " +
            "SUM(COALESCE(protein, 0)) as total_protein " +
            "FROM calorie_logs WHERE user_id = ? AND DATE(log_date) = ?",
            [userId, today]
        );
        const { total_fat, total_carbs, total_protein } = nutrientData[0] || {};

        // Weekly Calories (Intake Only)
        const [weeklyCalories] = await db.execute(
            "SELECT DATE(log_date) as day, SUM(calories) as intake " +
            "FROM calorie_logs WHERE user_id = ? AND log_date >= ? " +
            "GROUP BY day ORDER BY day",
            [userId, weekAgo]
        );

        // Task Completion Rate (This Week)
        const [tasks] = await db.execute(
            "SELECT COUNT(*) as total, SUM(completed) as completed " +
            "FROM tasks WHERE user_id = ?",
            [userId]
        );
        const taskCompletion = tasks[0].total ? (tasks[0].completed / tasks[0].total) * 100 : 0;

        // Habit Streaks (Last 30 Days)
        const [habits] = await db.execute(
            "SELECT habit, completed " +
            "FROM habits WHERE user_id = ? " ,
            [userId]
        );

        // Reading Progress (This Week)
        const [reading] = await db.execute(
            "SELECT DATE(date) as day, SUM(pages_read) as pages " +
            "FROM reading_progress WHERE user_id = ? AND date >= ? " +
            "GROUP BY day ORDER BY day",
            [userId, weekAgo]
        );

        res.render("profile", {
            userId,
            nutrients: { fat: total_fat || 0, carbs: total_carbs || 0, protein: total_protein || 0 },
            weeklyCalories: weeklyCalories.map(row => ({ day: row.day, intake: row.intake || 0 })),
            taskCompletion: taskCompletion || 0,
            habits: habits || [],
            reading: reading.map(row => ({ day: row.day, pages: row.pages || 0 }))
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;