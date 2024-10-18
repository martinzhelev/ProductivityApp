const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Task = require('../models/task');


// Connect to MongoDB using Mongoose
const url = "mongodb://localhost:27017/ProductivityApp"; // Make sure to include the database name

mongoose.connect(url)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("MongoDB connection error:", err));

    router.get('/', async (req, res) => {
        try {
            // Fetch all tasks from the database
            const tasks = await Task.find({});
            
            // Render the "home" view, passing the tasks to it
            res.render("home", { tasks });
            
        } catch (err) {
            console.error("Error fetching tasks:", err);
           
            res.status(500).json({ message: 'Error fetching tasks' });
        }
    });

router.post('/', async (req, res) => {
    const { task } = req.body;

    const taskObject = {task};
    console.log(taskObject);

    try {
        // Create a new user document
        const newTask = new Task(taskObject);
        await newTask.save(); // Save the user to the database
        console.log("Task added successfully");
    } catch (err) {
        console.error("Error adding task:", err);
        res.status(500).json({ message: 'Error adding task' });
    }
});

router.delete('/:taskId', async (req, res) => {
    const { taskId } = req.params;

    try {
        // Convert taskId to ObjectId and find the task by ID and delete it from the database
        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        console.log(`Task ${taskId} deleted successfully`);
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error("Error deleting task:", err);
        res.status(500).json({ message: 'Error deleting task' });
    }
});







// PATCH route to update task completion status
router.patch('/:id', async (req, res) => {
    const taskId = req.params.id;
    const { completed } = req.body; // Completed status from the request body

    try {
        // Find the task by ID and update its 'completed' status
        const updatedTask = await Task.findByIdAndUpdate(taskId, { completed: completed }, { new: true });
        
        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task updated successfully', task: updatedTask });
    } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ message: 'Error updating task' });
    }
});



module.exports = router