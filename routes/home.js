const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const db = require("../server");
const User = require("../models/user")
const mongoose = require("mongoose");





router.get('/:userId', async (req, res) => {
    try {
        console.log('Cookies:', req.cookies)
        const userId = req.cookies.userId;

        // Query to get the user by ID
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
       

        // Query to get the tasks associated with the user
        const [taskRows] = await db.execute('SELECT * FROM tasks WHERE user_id = ?', [userId]);
        const [habitRows] = await db.execute('SELECT * FROM habits WHERE user_id = ?', [userId]);

        const user = userRows[0];

        // Render the "home" view, passing the user's tasks and username
        res.render("home", { tasks: taskRows, habits: habitRows,  username: user.username, userId: user.user_id });
    } catch (err) {
        console.error("Error fetching tasks:", err);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});


router.post('/:userId', async (req, res) => {
    const { task } = req.body;
    const userId = req.params.userId;

    try {
        // Check if the user exists (using SQL query)
        const [user] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Insert the new task for the user
        const [result] = await db.execute('INSERT INTO tasks (user_id, task, completed) VALUES (?, ?, ?)', [userId, task, false]);

        // Fetch the newly inserted task (assuming the task ID is auto-incremented)
        const [newTask] = await db.execute('SELECT * FROM tasks WHERE task_id = ?', [result.insertId]);

        console.log('New Task:', newTask);  // Log the task being returned

        // Respond with the task data
        res.status(201).json({
            message: 'Task added successfully',
            task: newTask[0]  // Return the task object
        });
    } catch (err) {
        console.error('Error adding task:', err);
        res.status(500).json({ message: 'Error adding task' });
    }
});


router.delete('/:userId', async (req, res) => {
    const { taskId } = req.body;  // Assume taskId is passed in the body of the request

    try {
        // Query to find the user by userId
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [req.params.userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0]; // Get the user data (SQL result will be an array)
        
        // Query to find the task by taskId associated with this user
        const [taskRows] = await db.execute('SELECT * FROM tasks WHERE user_id = ? AND task_id = ?', [req.params.userId, taskId]);

        if (taskRows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Task exists, now proceed to delete it
        await db.execute('DELETE FROM tasks WHERE task_id = ? AND user_id = ?', [taskId, req.params.userId]);

        res.status(200).json({ message: 'Task deleted successfully' });

    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ message: 'Error deleting task' });
    }
});





router.patch('/:userId', async (req, res) => {
    const { taskId, completed } = req.body;  // Get taskId and completed status from the body

    try {
        // Step 1: Find the user
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [req.params.userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];  // Get the user data (SQL result will be an array)

        // Step 2: Check if the task exists for this user
        const [taskRows] = await db.execute('SELECT * FROM tasks WHERE user_id = ? AND task_id = ?', [req.params.userId, taskId]);

        if (taskRows.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const task = taskRows[0];  // Get the task data

        // Step 3: Update the task's completion status
        await db.execute('UPDATE tasks SET completed = ? WHERE task_id = ? AND user_id = ?', [completed, taskId, req.params.userId]);

        // Step 4: Return the updated task data
        res.json({ message: 'Task updated successfully', task: { ...task, completed } });

    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ message: 'Error updating task' });
    }
});




module.exports = router