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
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const lastMonthStart = lastMonth.toISOString().split("T")[0];
    const lastMonthEnd = new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    try {
        // Get user data
        const [userData] = await db.execute(
            "SELECT username FROM users WHERE user_id = ?",
            [userId]
        );
        const user = userData[0];

        // Core Stats
        const [statsRows] = await db.execute(
            "SELECT stat_name, stat_value FROM user_stats WHERE user_id = ?",
            [userId]
        );
        
        // Transform stats array into object
        const userStats = {
            strength: 0,
            speed: 0,
            mental: 0,
            social: 0,
            work: 0,
            agility: 0,
            financial: 0
        };
        
        // Debug log to check the data
        console.log('Raw stats rows:', statsRows);
        
        statsRows.forEach(row => {
            // Convert stat_name to lowercase for case-insensitive matching
            const statName = row.stat_name.toLowerCase();
            if (userStats.hasOwnProperty(statName)) {
                // Ensure we're getting a number value
                userStats[statName] = Number(row.stat_value) || 0;
            }
        });
        
        // Debug log to check transformed stats
        console.log('Transformed userStats:', userStats);

        // Nutrient Breakdown (Today)
        const [nutrientData] = await db.execute(
            "SELECT SUM(COALESCE(fat, 0)) as total_fat, " +
            "SUM(COALESCE(carbs, 0)) as total_carbs, " +
            "SUM(COALESCE(protein, 0)) as total_protein " +
            "FROM calorie_logs WHERE user_id = ? AND DATE(log_date) = ?",
            [userId, today]
        );
        const { total_fat, total_carbs, total_protein } = nutrientData[0] || {};

        // Weekly Calories
        const [weeklyCalories] = await db.execute(
            "SELECT DATE(log_date) as day, SUM(calories) as intake " +
            "FROM calorie_logs WHERE user_id = ? AND log_date >= ? " +
            "GROUP BY day ORDER BY day",
            [userId, weekAgo]
        );

        // Monthly Calories and Trend
        const [monthlyCaloriesData] = await db.execute(
            "SELECT SUM(calories) as total_calories " +
            "FROM calorie_logs WHERE user_id = ? AND log_date >= ?",
            [userId, monthAgo]
        );
        const [lastMonthCalories] = await db.execute(
            "SELECT SUM(calories) as total_calories " +
            "FROM calorie_logs WHERE user_id = ? AND log_date BETWEEN ? AND ?",
            [userId, lastMonthStart, lastMonthEnd]
        );
        const monthlyCalories = monthlyCaloriesData[0]?.total_calories || 0;
        const lastMonthCaloriesTotal = lastMonthCalories[0]?.total_calories || 0;
        const calorieTrend = lastMonthCaloriesTotal ? 
            ((monthlyCalories - lastMonthCaloriesTotal) / lastMonthCaloriesTotal) * 100 : 0;

        // Monthly Workouts and Trend
        const [monthlyWorkoutsData] = await db.execute(
            "SELECT COUNT(*) as total_workouts " +
            "FROM workouts_calendar WHERE user_id = ? AND date >= ?",
            [userId, monthAgo]
        );
        const [lastMonthWorkouts] = await db.execute(
            "SELECT COUNT(*) as total_workouts " +
            "FROM workouts_calendar WHERE user_id = ? AND date BETWEEN ? AND ?",
            [userId, lastMonthStart, lastMonthEnd]
        );
        const monthlyWorkouts = monthlyWorkoutsData[0]?.total_workouts || 0;
        const lastMonthWorkoutsTotal = lastMonthWorkouts[0]?.total_workouts || 0;
        const workoutTrend = lastMonthWorkoutsTotal ? 
            ((monthlyWorkouts - lastMonthWorkoutsTotal) / lastMonthWorkoutsTotal) * 100 : 0;

        // Task Completion
        const [tasks] = await db.execute(
            "SELECT COUNT(*) as total, SUM(completed) as completed " +
            "FROM tasks WHERE user_id = ?",
            [userId]
        );
        const taskCompletion = tasks[0].total ? (tasks[0].completed / tasks[0].total) * 100 : 0;
        const completedTasks = tasks[0].completed || 0;
        const totalTasks = tasks[0].total || 0;

        // Habit Completion
        const [habits] = await db.execute(
            "SELECT COUNT(*) as total, SUM(completed) as completed " +
            "FROM habits WHERE user_id = ?",
            [userId]
        );
        const habitCompletion = habits[0].total ? (habits[0].completed / habits[0].total) * 100 : 0;
        const completedHabits = habits[0].completed || 0;
        const totalHabits = habits[0].total || 0;

        // Get all habits for the user
        const [habitsList] = await db.execute(
            "SELECT habit, completed " +
            "FROM habits WHERE user_id = ?",
            [userId]
        );

        // Reading Progress
        const [reading] = await db.execute(
            "SELECT DATE(date) as day, COUNT(*) as sessions, SUM(pages_read) as pages " +
            "FROM reading_progress WHERE user_id = ? AND date >= ? " +
            "GROUP BY day ORDER BY day",
            [userId, weekAgo]
        );

        // Monthly Reading Sessions and Trend
        const [monthlyReadingData] = await db.execute(
            "SELECT COUNT(*) as total_sessions, SUM(pages_read) as total_pages " +
            "FROM reading_progress WHERE user_id = ? AND date >= ?",
            [userId, monthAgo]
        );
        const [lastMonthReading] = await db.execute(
            "SELECT COUNT(*) as total_sessions " +
            "FROM reading_progress WHERE user_id = ? AND date BETWEEN ? AND ?",
            [userId, lastMonthStart, lastMonthEnd]
        );
        const monthlySessions = monthlyReadingData[0]?.total_sessions || 0;
        const pagesRead = monthlyReadingData[0]?.total_pages || 0;
        const lastMonthSessions = lastMonthReading[0]?.total_sessions || 0;
        const readingTrend = lastMonthSessions ? 
            ((monthlySessions - lastMonthSessions) / lastMonthSessions) * 100 : 0;

        // Monthly Meditation and Trend
        const [monthlyMeditationData] = await db.execute(
            "SELECT COUNT(*) as total_sessions, SUM(minutes) as total_minutes " +
            "FROM meditation WHERE user_id = ? AND date >= ?",
            [userId, monthAgo]
        );
        const [lastMonthMeditation] = await db.execute(
            "SELECT COUNT(*) as total_sessions, SUM(minutes) as total_minutes " +
            "FROM meditation WHERE user_id = ? AND date BETWEEN ? AND ?",
            [userId, lastMonthStart, lastMonthEnd]
        );
        const monthlyMeditation = monthlyMeditationData[0]?.total_minutes || 0;
        const meditationSessions = monthlyMeditationData[0]?.total_sessions || 0;
        const lastMonthMeditationTotal = lastMonthMeditation[0]?.total_minutes || 0;
        const meditationTrend = lastMonthMeditationTotal ? 
            ((monthlyMeditation - lastMonthMeditationTotal) / lastMonthMeditationTotal) * 100 : 0;

        res.render("profile", {
            user,
            userId,
            userStats: userStats,
            nutrients: { 
                fat: total_fat || 0, 
                carbs: total_carbs || 0, 
                protein: total_protein || 0 
            },
            weeklyCalories: weeklyCalories.map(row => ({ 
                day: row.day, 
                intake: row.intake || 0 
            })),
            habits: habitsList || [],
            taskCompletion,
            completedTasks,
            totalTasks,
            habitCompletion,
            completedHabits,
            totalHabits,
            reading: reading.map(row => ({ 
                day: row.day, 
                sessions: row.sessions || 0,
                pages: row.pages || 0 
            })),
            monthlyCalories,
            calorieTrend,
            monthlyWorkouts,
            workoutTrend,
            monthlySessions,
            readingTrend,
            pagesRead,
            monthlyMeditation,
            meditationTrend,
            meditationSessions
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;