const express = require("express");
const router = express.Router();
const db = require("../server");
const axios = require("axios");

router.use((req, res, next) => {
    req.userId = req.cookies.userId;
    if (!req.userId) return res.status(401).json({ error: "Unauthorized: User ID not found" });
    next();
});

const EDAMAM_APP_ID = "79827d70";
const EDAMAM_APP_KEY = "0aa43e2aebfb8bb3d50dcb969d9ec0f4";

router.get("/:userId", async (req, res) => {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Days per page
    const offset = (page - 1) * limit;

    try {
        const [logs] = await db.execute(
            `SELECT DATE(log_date) as log_day, GROUP_CONCAT(CONCAT(food_text, ' - ', calories, ' kcal') SEPARATOR '<br>') as daily_logs
             FROM calorie_logs 
             WHERE user_id = ? 
             GROUP BY log_day 
             ORDER BY log_day DESC 
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [totalResult] = await db.execute(
            "SELECT COUNT(DISTINCT DATE(log_date)) as total_days FROM calorie_logs WHERE user_id = ?",
            [userId]
        );
        const totalDays = totalResult[0].total_days;
        const totalPages = Math.ceil(totalDays / limit);

        res.render("calorieTracker", {
            userId,
            logs: logs.map(log => ({ day: log.log_day, entries: log.daily_logs })),
            page,
            totalPages
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/log", async (req, res) => {
    const { foodText, ingredients = [] } = req.body; // Ingredients optional
    const userId = req.userId;
    const today = new Date().toISOString().split("T")[0];

    if (!foodText && !ingredients.length) {
        return res.status(400).json({ success: false, error: "Food text or ingredients required" });
    }

    try {
        let calories = 0;
        let finalFoodText = foodText;

        // Check cache first
        const [cached] = await db.execute(
            "SELECT ingredients, calories FROM recipes WHERE dish_name = ?",
            [foodText]
        );
        if (cached.length) {
            calories = cached[0].calories;
            finalFoodText = `${foodText} (${cached[0].ingredients})`;
        } else {
            // Try Edamam directly
            const response = await axios.get("https://api.edamam.com/api/nutrition-data", {
                params: { app_id: EDAMAM_APP_ID, app_key: EDAMAM_APP_KEY, ingr: foodText }
            });
            console.log("Edamam Direct Response:", JSON.stringify(response.data, null, 2));

            const parsed = response.data.ingredients?.[0]?.parsed?.[0];
            calories = parsed?.nutrients?.ENERC_KCAL ? Math.round(parsed.nutrients.ENERC_KCAL.quantity) : 0;

            if (!calories && !ingredients.length) {
                // Prompt for ingredients if dish not recognized
                return res.status(400).json({
                    success: false,
                    error: "Dish not recognized. Please list ingredients (e.g., 200g spaghetti, 50g pancetta).",
                    needsIngredients: true
                });
            }

            if (ingredients.length) {
                // Calculate from ingredients
                calories = 0;
                for (const ingr of ingredients) {
                    const ingrResponse = await axios.get("https://api.edamam.com/api/nutrition-data", {
                        params: { app_id: EDAMAM_APP_ID, app_key: EDAMAM_APP_KEY, ingr }
                    });
                    const ingrParsed = ingrResponse.data.ingredients?.[0]?.parsed?.[0];
                    calories += ingrParsed?.nutrients?.ENERC_KCAL ? Math.round(ingrParsed.nutrients.ENERC_KCAL.quantity) : 0;
                }
                if (calories) {
                    finalFoodText = `${foodText} (${ingredients.join(", ")})`;
                    await db.execute(
                        "INSERT INTO recipes (dish_name, ingredients, calories) VALUES (?, ?, ?)",
                        [foodText, ingredients.join(", "), calories]
                    );
                }
            }
        }

        if (!calories) {
            return res.status(400).json({
                success: false,
                error: "Couldn’t calculate calories from ingredients. Try again with specific items."
            });
        }

        await db.execute(
            "INSERT INTO calorie_logs (user_id, food_text, calories, log_date) VALUES (?, ?, ?, ?)",
            [userId, finalFoodText, calories, today]
        );

        res.json({ success: true, calories });
    } catch (error) {
        console.error("Error logging calories:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: "Failed to log calories" });
    }
});

module.exports = router;