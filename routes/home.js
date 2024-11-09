const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const db = require("../server");
const User = require("../models/user")
const mongoose = require("mongoose");





router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Query to get the user by ID
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Query to get the tasks associated with the user
        const [taskRows] = await db.execute('SELECT * FROM tasks WHERE user_id = ?', [userId]);

        const user = userRows[0];

        // Render the "home" view, passing the user's tasks and username
        res.render("home", { tasks: taskRows, username: user.username, userId: user.user_id });
    } catch (err) {
        console.error("Error fetching tasks:", err);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});


router.post('/:userId', async (req, res) => {
    const { task } = req.body;

    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Add the new task to the user's tasks array
        const newTask = { task, completed: false };
        user.tasks.push(newTask);
        await user.save();

        const addedTask = user.tasks[user.tasks.length - 1]; // Get the last added task
        console.log('New Task:', addedTask);  // Log the task being returned
        res.status(201).json({ message: 'Task added successfully', task: addedTask });
    } catch (err) {
        console.error("Error adding task:", err);
        res.status(500).json({ message: 'Error adding task' });
    }
});



// router.delete('/:taskId', async (req, res) => {
//     const { taskId } = req.params;

//     try {
//         // Convert taskId to ObjectId and find the task by ID and delete it from the database
//         const deletedTask = await Task.findByIdAndDelete(taskId);

//         if (!deletedTask) {
//             return res.status(404).json({ message: 'Task not found' });
//         }

//         console.log(`Task ${taskId} deleted successfully`);
//         res.status(200).json({ message: 'Task deleted successfully' });
//     } catch (err) {
//         console.error("Error deleting task:", err);
//         res.status(500).json({ message: 'Error deleting task' });
//     }
// });



router.delete('/:userId', async (req, res) => {
    try {
        const taskId = req.params.id;
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const task = user.tasks.id(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        // Remove the task from the user's tasks array
        
        task.remove();
        await user.save();
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error("Error deleting task:", err);
        res.status(500).json({ message: 'Error deleting task' });
    }
});




router.patch('/:userId', async (req, res) => {
    const { taskId } = req.body;  // Get taskId from the body

    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Find the task within the user's tasks array
        const task = user.tasks.id(taskId);  // Use taskId from req.body
        if (!task) return res.status(404).json({ message: 'Task not found' });

        user.tasks.pull(taskId);
        await user.save();
        res.json({ message: 'Task updated successfully', task });
    } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ message: 'Error updating task' });
    }
});



module.exports = router