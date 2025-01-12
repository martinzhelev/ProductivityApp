const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const db = require("../server");
const User = require("../models/user")
const mongoose = require("mongoose");





router.get('/:userId', async (req, res) => {
    try {
        const userId = req.cookies.userId; // Assuming userId is stored in cookies

        // Fetch user details
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch tasks and habits for the user
        const [taskRows] = await db.execute('SELECT * FROM tasks WHERE user_id = ?', [userId]);
        const [habitRows] = await db.execute('SELECT * FROM habits WHERE user_id = ?', [userId]);

        // Fetch stats for the user
        const [statRows] = await db.execute(
            'SELECT stat_name, stat_value FROM user_stats WHERE user_id = ?',
            [userId]
        );

        // Transform stats into an object
        const stats = statRows.reduce((acc, stat) => {
            acc[stat.stat_name] = stat.stat_value;
            return acc;
        }, {});

        // Render the EJS template with all data
        res.render('home', {
            username: userRows[0].username,
            tasks: taskRows,
            habits: habitRows,
            stats,
            userId
        });
    } catch (err) {
        console.error('Error fetching user dashboard data:', err);
        res.status(500).json({ message: 'Error fetching user dashboard data' });
    }
});



router.post('/:userId', async (req, res) => {
    const { task, habit } = req.body;
    const user_id = req.cookies.userId;

    if (!user_id) {
        return res.status(401).json({ message: 'User ID is not available in cookies' });
    }

    if (!task && !habit) {
        return res.status(400).json({ message: 'Please provide either a task or a habit' });
    }

    try {
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [user_id]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        let newItem;
        let message;
        if (task) {
            const [result] = await db.execute('INSERT INTO tasks (user_id, task, completed) VALUES (?, ?, ?)', [user_id, task, false]);
            [newItem] = await db.execute('SELECT * FROM tasks WHERE task_id = ?', [result.insertId]);
            message = 'Task added successfully';
        } else if (habit) {
            const [result] = await db.execute('INSERT INTO habits (user_id, habit, completed) VALUES (?, ?, ?)', [user_id, habit, false]);
            [newItem] = await db.execute('SELECT * FROM habits WHERE habit_id = ?', [result.insertId]);
            message = 'Habit added successfully';
        }

        res.status(201).json({ message, item: newItem[0] });
    } catch (err) {
        console.error('Error adding item:', err);
        res.status(500).json({ message: 'Error adding item' });
    }
});


router.delete('/:userId', async (req, res) => {
    const { type, id } = req.body; // Expect `type` ("task" or "habit") and `id` (taskId or habitId)
    const user_id = req.cookies.userId;

    if (!type || !id) {
        return res.status(400).json({ message: 'Invalid input: "type" and "id" are required' });
    }

    if (!['task', 'habit'].includes(type)) {
        return res.status(400).json({ message: 'Invalid "type". Must be "task" or "habit"' });
    }

    try {
        const table = type === 'task' ? 'tasks' : 'habits'; // Determine table based on type
        const idColumn = `${type}_id`; // Determine ID column based on type

        // Check if the user exists
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [user_id]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the entity exists for this user
        const [entityRows] = await db.execute(`SELECT * FROM ${table} WHERE user_id = ? AND ${idColumn} = ?`, [user_id, id]);
        if (entityRows.length === 0) {
            return res.status(404).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
        }

        // Delete the entity
        await db.execute(`DELETE FROM ${table} WHERE ${idColumn} = ? AND user_id = ?`, [id, user_id]);
        res.status(200).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully` });
    } catch (err) {
        console.error(`Error deleting ${type}:`, err);
        res.status(500).json({ message: `Error deleting ${type}` });
    }
});

/**
 * PATCH Route - Works for both tasks and habits
 * Accepts `type` (task or habit), `id` (taskId or habitId), and `completed` in the request body
 */
router.patch('/:userId', async (req, res) => {
    const { type, id, completed } = req.body; // Expect `type`, `id`, and `completed`
    const user_id = req.cookies.userId;

    if (!type || !id || typeof completed === 'undefined') {
        return res.status(400).json({ message: 'Invalid input: "type", "id", and "completed" are required' });
    }

    if (!['task', 'habit'].includes(type)) {
        return res.status(400).json({ message: 'Invalid "type". Must be "task" or "habit"' });
    }

    try {
        const table = type === 'task' ? 'tasks' : 'habits'; // Determine table based on type
        const idColumn = `${type}_id`; // Determine ID column based on type

        // Check if the user exists
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [user_id]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the entity exists for this user
        const [entityRows] = await db.execute(`SELECT * FROM ${table} WHERE user_id = ? AND ${idColumn} = ?`, [user_id, id]);
        if (entityRows.length === 0) {
            return res.status(404).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
        }

        // Update the entity's completion status
        await db.execute(`UPDATE ${table} SET completed = ? WHERE ${idColumn} = ? AND user_id = ?`, [completed, id, user_id]);
        res.status(200).json({
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`,
            [type]: { ...entityRows[0], completed }
        });
    } catch (err) {
        console.error(`Error updating ${type}:`, err);
        res.status(500).json({ message: `Error updating ${type}` });
    }
});



module.exports = router