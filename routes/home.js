const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require('../models/user');


// Connect to MongoDB using Mongoose
const url = "mongodb://localhost:27017/ProductivityApp"; // Make sure to include the database name

mongoose.connect(url)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("MongoDB connection error:", err));






router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Render the "home" view, passing the user's tasks to it
        res.render("home", { tasks: user.tasks, username: user.username, userId: req.params.userId });
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