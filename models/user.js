const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Auto-generates ID for each task
    task: { type: String, required: true },
    completed: { type: Boolean, default: false }
});


const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    tasks: [taskSchema]
});

// Check if the model already exists
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
