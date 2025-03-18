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
    const limit = 3;
    const offset = (page - 1) * limit;

    try {
        const [logs] = await db.execute(
            `SELECT DATE(log_date) as log_day, 
                    GROUP_CONCAT(
                        CONCAT(food_text, '|||', calories, '|||', fat, '|||', carbs, '|||', protein, '|||', DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s'))
                        SEPARATOR '|||ROW|||'
                    ) as daily_logs
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

        const formattedLogs = logs.map(log => {
            const entries = log.daily_logs
                ? log.daily_logs.split("|||ROW|||").map(row => {
                      const [food_text, calories, fat, carbs, protein, created_at] = row.split("|||");
                      return { 
                          food_text, 
                          calories: parseInt(calories), 
                          fat: parseFloat(fat), 
                          carbs: parseFloat(carbs), 
                          protein: parseFloat(protein), 
                          created_at 
                      };
                  })
                : [];
            return { day: log.log_day, entries };
        });

        // Calculate today's nutrient totals and suggestion
        const today = new Date().toISOString().split("T")[0];
        const [todayLogs] = await db.execute(
            "SELECT SUM(calories) as total_calories, SUM(fat) as total_fat, SUM(carbs) as total_carbs, SUM(protein) as total_protein " +
            "FROM calorie_logs WHERE user_id = ? AND DATE(log_date) = ?",
            [userId, today]
        );
        const { total_calories, total_fat, total_carbs, total_protein } = todayLogs[0] || {};
        const suggestion = getHealthSuggestion(total_calories || 0, total_fat || 0, total_carbs || 0, total_protein || 0);

        res.render("calorieTracker", {
            userId,
            logs: formattedLogs,
            page,
            totalPages,
            suggestion
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Internal Server Error");
    }
});

function getHealthSuggestion(calories, fat, carbs, protein) {
    if (!calories) return "Log some food to get a health suggestion!";
    const fatCals = fat * 9;
    const carbCals = carbs * 4;
    const proteinCals = protein * 4;
    const totalNutrientCals = fatCals + carbCals + proteinCals;
    if (!totalNutrientCals) return "No nutrient data available.";

    const fatPct = (fatCals / calories) * 100;
    const carbPct = (carbCals / calories) * 100;
    const proteinPct = (proteinCals / calories) * 100;

    const targetCarbs = 50; // 50%
    const targetFat = 30; // 30%
    const targetProtein = 20; // 20%

    let suggestion = "Your meal balance looks good!";
    if (carbPct < targetCarbs - 5) suggestion = "Add more carbs (e.g., rice, bread, or fruit) to reach ~50%.";
    else if (carbPct > targetCarbs + 5) suggestion = "Reduce carbs slightly for better balance.";
    if (fatPct < targetFat - 5) suggestion += " Add healthy fats (e.g., avocado, nuts, olive oil) to reach ~30%.";
    else if (fatPct > targetFat + 5) suggestion += " Reduce fats slightly.";
    if (proteinPct < targetProtein - 5) suggestion += " Add more protein (e.g., chicken, eggs, beans) to reach ~20%.";
    else if (proteinPct > targetProtein + 5) suggestion += " Reduce protein slightly.";

    return `${suggestion} (Current: ${carbPct.toFixed(1)}% carbs, ${fatPct.toFixed(1)}% fat, ${proteinPct.toFixed(1)}% protein)`;
}

router.post("/log", async (req, res) => {
    const { foodText, ingredients = [] } = req.body;
    const userId = req.userId;
    const today = new Date().toISOString().split("T")[0];

    if (!foodText && !ingredients.length) {
        return res.status(400).json({ success: false, error: "Food text or ingredients required" });
    }

    try {
        let calories = 0, fat = 0, carbs = 0, protein = 0;
        let finalFoodText = foodText;

        const [cached] = await db.execute(
            "SELECT ingredients, calories, fat, carbs, protein FROM recipes WHERE dish_name = ?",
            [foodText]
        );
        if (cached.length) {
            calories = cached[0].calories;
            fat = cached[0].fat;
            carbs = cached[0].carbs;
            protein = cached[0].protein;
            finalFoodText = `${foodText} (${cached[0].ingredients})`;
        } else {
            const response = await axios.get("https://api.edamam.com/api/nutrition-data", {
                params: { app_id: EDAMAM_APP_ID, app_key: EDAMAM_APP_KEY, ingr: foodText }
            });
            console.log("Edamam Direct Response:", JSON.stringify(response.data, null, 2));

            const parsed = response.data.ingredients?.[0]?.parsed?.[0];
            if (parsed?.nutrients) {
                calories = parsed.nutrients.ENERC_KCAL?.quantity ? Math.round(parsed.nutrients.ENERC_KCAL.quantity) : 0;
                fat = parsed.nutrients.FAT?.quantity || 0;
                carbs = parsed.nutrients.CHOCDF?.quantity || 0;
                protein = parsed.nutrients.PROCNT?.quantity || 0;
            }

            if (!calories && !ingredients.length) {
                return res.status(400).json({
                    success: false,
                    error: "Dish not recognized. Please enter ingredients separately.",
                    needsIngredients: true
                });
            }

            if (ingredients.length) {
                const validIngredients = ingredients.filter(i => i.trim());
                for (const ingr of validIngredients) {
                    const ingrResponse = await axios.get("https://api.edamam.com/api/nutrition-data", {
                        params: { app_id: EDAMAM_APP_ID, app_key: EDAMAM_APP_KEY, ingr }
                    });
                    console.log(`Edamam Response for ${ingr}:`, JSON.stringify(ingrResponse.data, null, 2));
                    const ingrParsed = ingrResponse.data.ingredients?.[0]?.parsed?.[0];
                    if (ingrParsed?.nutrients) {
                        calories += ingrParsed.nutrients.ENERC_KCAL?.quantity ? Math.round(ingrParsed.nutrients.ENERC_KCAL.quantity) : 0;
                        fat += ingrParsed.nutrients.FAT?.quantity || 0;
                        carbs += ingrParsed.nutrients.CHOCDF?.quantity || 0;
                        protein += ingrParsed.nutrients.PROCNT?.quantity || 0;
                    }
                }
                if (calories) {
                    finalFoodText = `${foodText} (${validIngredients.join(", ")})`;
                    await db.execute(
                        "INSERT INTO recipes (dish_name, ingredients, calories, fat, carbs, protein) VALUES (?, ?, ?, ?, ?, ?)",
                        [foodText, validIngredients.join(", "), calories, fat, carbs, protein]
                    );
                }
            }
        }

        if (!calories) {
            return res.status(400).json({
                success: false,
                error: "Couldn’t calculate calories. Ensure all ingredients are valid."
            });
        }

        await db.execute(
            "INSERT INTO calorie_logs (user_id, food_text, calories, fat, carbs, protein, log_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [userId, finalFoodText, calories, fat, carbs, protein, today]
        );

        res.json({ success: true, calories });
    } catch (error) {
        console.error("Error logging calories:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: "Failed to log calories" });
    }
});

module.exports = router;