const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const db = require("../server");


router.use((req, res, next) => {
    req.userId = req.cookies.userId;
    if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized: User ID not found in cookies" });
    }
    next();
});
// Example routes for adding, fetching, updating, and deleting tasks and deadlines

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.userId;

        // Fetch user details
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch deadlines
        const [deadlines] = await db.execute(
            "SELECT deadline_id, date, deadline, completed FROM work_deadlines WHERE user_id = ?",
            [userId]
        );

        // Fetch tasks
        const [tasks] = await db.execute(
            "SELECT task_id, task, completed FROM tasks WHERE user_id = ? AND task_category = 'work'",
            [userId]
        );

        res.render("work", { 
            deadlines, 
            tasks,
            userId,
            username: userRows[0].username
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Server error");
    }
});

router.post("/:userId/add-deadline", (req, res) => {
    const { name, deadlineDateTime } = req.body;
    const userId = req.userId
    if (!name || !deadlineDateTime) {
        return res.status(400).json({ error: "All fields are required." });
    }

    db.query(
        "INSERT INTO work_deadlines (deadline, date, user_id) VALUES (?, ?, ?)",
        [name, deadlineDateTime, userId], // Store combined DateTime in the `date` column
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database error." });
            }
            res.json({ success: true });
        }
    );
});

router.delete("/:userId/deadlines/:id", (req, res) => {
    const deadlineId = req.params.id;
    const userId = req.userId;

    console.log(deadlineId)
    const sql = "DELETE FROM work_deadlines WHERE deadline_id = ? AND user_id = ?";
    db.query(sql, [deadlineId, userId], (err, result) => {
        if (err) {
            console.error("Error deleting deadline:", err);
            return res.json({ success: false });
        }
        return res.json({ success: true });
    });
});


router.post("/:userId/addTask", (req, res) => {
    const { task, category } = req.body;
    const userId = req.userId
    const sql = "INSERT INTO tasks (task, task_category, user_id) VALUES (?, ?, ?)";
    db.query(sql, [task, category, userId], (err, result) => {
        if (err) {
            console.error("Error adding task:", err);
            return res.json({ success: false });
        }
        return res.json({ success: true, task_id: result.insertId });
    });
});

router.delete("/:userId/deleteTask/:id", (req, res) => {
    const taskId = req.params.id;
    const userId = req.userId

    const sql = "DELETE FROM tasks WHERE task_id = ? AND user_id = ?";
    db.query(sql, [taskId, userId], (err, result) => {
        if (err) {
            console.error("Error deleting task:", err);
            return res.json({ success: false });
        }
        return res.json({ success: true });
    });
});


router.put("/:userId/updateTask/:taskId", (req, res) => {
    const { taskId } = req.params;
    const { completed } = req.body; // Get the updated status from request body
    const userId = req.userId
    console.log(completed)
    const sql = "UPDATE tasks SET completed = ? WHERE task_id = ? AND user_id = ?";
    db.query(sql, [completed, taskId, userId], (err, result) => {
        if (err) {
            console.error("Error updating task:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (result.affectedRows > 0) {
            res.json({ success: true, message: "Task updated successfully" });
        } else {
            res.status(404).json({ success: false, message: "Task not found" });
        }
    });
    console.log("task is set completed")
});

router.put('/:userId/updateStat', async (req, res) => {
    const { userId } = req.params;  // Get userId from the route parameters
    const { completed } = req.body; // Extract 'completed' from request body

    try {
        // Check if stat exists for the user
        const [results] = await db.execute(
            'SELECT * FROM user_stats WHERE stat_name = "work" AND user_id = ?',
            [userId]
        );

        if (results.length === 0) {
            if (!completed) {
                return res.status(400).json({ message: "Cannot decrease a non-existent stat" });
            }

            // Stat doesn't exist, so create a new one
            const insertQuery = `
                INSERT INTO user_stats (user_id, stat_name, stat_value, updated_at)
                VALUES (?, "work", 1, NOW())
            `;
            await db.execute(insertQuery, [userId]);

            return res.status(201).json({ message: "Stat created successfully" });
        }

        // Stat exists, so update it
        const updateQuery = `
            UPDATE user_stats
            SET stat_value = GREATEST(0, stat_value + ?), updated_at = NOW()
            WHERE stat_name = "work" AND user_id = ?
        `;

        await db.execute(updateQuery, [completed ? 1 : -1, userId]);

        res.status(200).json({ message: "Stat updated successfully" });
    } catch (err) {
        console.error("Error updating stat:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete('/:userId/deleteDoneTasks', async (req, res) => {
    const { id } = req.body; // Expect `type` ("task" or "habit") and `id` (taskId or habitId)
    const user_id = req.userId;

    if ( !id) {
        return res.status(400).json({ message: 'Invalid input: "id" is required' });
    }


    try {
        
        // Check if the user exists
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [user_id]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the entity exists for this user
        const [entityRows] = await db.execute(`SELECT * FROM tasks WHERE user_id = ? AND task_id = ?`, [user_id, id]);
        if (entityRows.length === 0) {
            return res.status(404).json({ message: `tasks not found` });
        }

        // Delete the entity
        await db.execute(`DELETE FROM tasks WHERE task_id = ? AND user_id = ?`, [id, user_id]);
        res.status(200).json({ message: `task deleted successfully` });
    } catch (err) {
        console.error(`Error deleting task}:`, err);
        res.status(500).json({ message: `Error deleting task` });
    }
});


module.exports = router;

