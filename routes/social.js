const express = require("express");
const router = express.Router();
const db = require("../server");

router.use((req, res, next) => {
    req.userId = req.user.userId;
    if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized: User ID not found in cookies" });
    }
    next();
});

router.get("/:userId", async (req, res) => {
    const userId = req.userId;
    const eventPage = parseInt(req.query.eventPage) || 1;
    const eventLimit = parseInt(req.query.eventLimit) || 5;
    const eventOffset = (eventPage - 1) * eventLimit;
    const peoplePage = parseInt(req.query.peoplePage) || 1;
    const peopleLimit = parseInt(req.query.peopleLimit) || 5;
    const peopleOffset = (peoplePage - 1) * peopleLimit;

    try {
        // Fetch user details
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const [eventCountResult] = await db.execute(
            "SELECT COUNT(*) as total FROM social WHERE user_id = ?",
            [userId]
        );
        const totalEvents = eventCountResult[0].total;
        const totalEventPages = Math.ceil(totalEvents / eventLimit);

        const [socialRows] = await db.execute(
            "SELECT id, date, time, event_name FROM social WHERE user_id = ? ORDER BY ABS(DATEDIFF(date, CURDATE())) ASC, date ASC, time ASC LIMIT ? OFFSET ?",
            [userId, eventLimit, eventOffset]
        );

        const [peopleCountResult] = await db.execute(
            "SELECT COUNT(*) as total FROM people WHERE user_id = ?",
            [userId]
        );
        const totalPeople = peopleCountResult[0].total;
        const totalPeoplePages = Math.ceil(totalPeople / peopleLimit);

        const [peopleRows] = await db.execute(
            "SELECT id, name, birthday FROM people WHERE user_id = ? ORDER BY name ASC LIMIT ? OFFSET ?",
            [userId, peopleLimit, peopleOffset]
        );

        for (let person of peopleRows) {
            const [giftRows] = await db.execute(
                "SELECT id, gift_name, added_date FROM gifts WHERE person_id = ? ORDER BY added_date DESC",
                [person.id]
            );
            person.gifts = giftRows;
        }

        res.render("social", {
            username: userRows[0].username,
            socializingData: socialRows,
            peopleData: peopleRows,
            eventPage: eventPage,
            totalEventPages: totalEventPages,
            eventLimit: eventLimit,
            peoplePage: peoplePage,
            totalPeoplePages: totalPeoplePages,
            peopleLimit: peopleLimit,
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
            return res.status(409).json({ success: false, error: "An event with the same date and time already exists" });
        }

        await db.execute(
            "INSERT INTO social (user_id, date, time, event_name) VALUES (?, ?, ?, ?)",
            [userId, date, time, eventName || "Social Event"]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Database update error:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

router.delete("/delete", async (req, res) => {
    const { id } = req.body;
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

router.patch("/:userId/completeEvent", async (req, res) => {
    const { eventId } = req.body; // Changed from type to eventId for clarity
    const userId = req.user.userId;

    try {
        // Check if the event exists and belongs to the user
        const [eventRows] = await db.execute(
            "SELECT id FROM social WHERE user_id = ? AND id = ?",
            [userId, eventId]
        );
        if (eventRows.length === 0) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Check if the "social" stat exists for the user
        const [statRows] = await db.execute(
            "SELECT * FROM user_stats WHERE user_id = ? AND stat_name = 'social'",
            [userId]
        );

        let statId;
        const incrementValue = 1; // Fixed increment for social events; adjust as needed

        if (statRows.length > 0) {
            // Stat exists, update it
            statId = statRows[0].stat_id;
            await db.execute(
                "UPDATE user_stats SET stat_value = GREATEST(stat_value + ?, 0) WHERE stat_id = ?",
                [incrementValue, statId]
            );
            console.log(`Social stat found, incremented by ${incrementValue}`);
        } else {
            // Stat doesn't exist, insert it
            await db.execute(
                "INSERT INTO user_stats (user_id, stat_name, stat_value) VALUES (?, 'social', ?)",
                [userId, incrementValue]
            );
            console.log(`Social stat not found, created with value ${incrementValue}`);
        }

        // Optionally delete the event after marking it completed
        await db.execute(
            "DELETE FROM social WHERE user_id = ? AND id = ?",
            [userId, eventId]
        );

        return res.json({ success: true, message: "Social event completed and stat updated" });
    } catch (error) {
        console.error("Error updating social stat:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// ... (rest of the routes: /people/add, /people/update, /people/delete, /gifts/add, /gifts/delete remain unchanged)
router.post("/people/add", async (req, res) => {
    const { name, birthday, gift } = req.body;
    const userId = req.userId;

    try {
        const [personResult] = await db.execute(
            "INSERT INTO people (user_id, name, birthday) VALUES (?, ?, ?)",
            [userId, name, birthday || null]
        );
        const personId = personResult.insertId;

        if (gift) {
            await db.execute(
                "INSERT INTO gifts (person_id, gift_name) VALUES (?, ?)",
                [personId, gift]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Database add person error:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

router.post("/people/update", async (req, res) => {
    const { id, name, birthday } = req.body;
    const userId = req.userId;

    try {
        const [result] = await db.execute(
            "UPDATE people SET name = ?, birthday = ? WHERE user_id = ? AND id = ?",
            [name, birthday || null, userId, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Person not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Database update person error:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

router.delete("/people/delete", async (req, res) => {
    const { id } = req.body;
    const userId = req.userId;

    try {
        const [result] = await db.execute(
            "DELETE FROM people WHERE user_id = ? AND id = ?",
            [userId, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Person not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Database delete person error:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

router.post("/gifts/add", async (req, res) => {
    const { person_id, gift_name } = req.body;
    const userId = req.userId;

    try {
        const [personCheck] = await db.execute(
            "SELECT id FROM people WHERE user_id = ? AND id = ?",
            [userId, person_id]
        );
        if (personCheck.length === 0) {
            return res.status(404).json({ success: false, error: "Person not found" });
        }

        await db.execute(
            "INSERT INTO gifts (person_id, gift_name) VALUES (?, ?)",
            [person_id, gift_name]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Database add gift error:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

router.delete("/gifts/delete", async (req, res) => {
    const { gift_id } = req.body;
    const userId = req.userId;

    try {
        const [result] = await db.execute(
            "DELETE g FROM gifts g JOIN people p ON g.person_id = p.id WHERE p.user_id = ? AND g.id = ?",
            [userId, gift_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: "Gift not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Database delete gift error:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

module.exports = router;