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
        console.log(user)
        // Add the new task to the user's tasks array
        user.tasks.push({ task });
        await user.save(); // Save the user to update the task list
        res.status(201).json({ message: 'Task added successfully' });
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



router.delete('/:userId/:taskId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Remove the task from the user's tasks array
        user.tasks.id(req.params.taskId).remove();
        await user.save();
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error("Error deleting task:", err);
        res.status(500).json({ message: 'Error deleting task' });
    }
});






// // PATCH route to update task completion status
// router.patch('/:id', async (req, res) => {
//     const taskId = req.params.id;
//     const { completed } = req.body; // Completed status from the request body

//     try {
//         // Find the task by ID and update its 'completed' status
//         const updatedTask = await Task.findByIdAndUpdate(taskId, { completed: completed }, { new: true });
        
//         if (!updatedTask) {
//             return res.status(404).json({ message: 'Task not found' });
//         }

//         res.json({ message: 'Task updated successfully', task: updatedTask });
//     } catch (err) {
//         console.error("Error updating task:", err);
//         res.status(500).json({ message: 'Error updating task' });
//     }
// });



router.patch('/:userId/:taskId', async (req, res) => {
    const { completed } = req.body;

    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Find the task within the user's tasks array and update it
        const task = user.tasks.id(req.params.taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.completed = completed;
        await user.save();
        res.json({ message: 'Task updated successfully', task });
    } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ message: 'Error updating task' });
    }
});


module.exports = router