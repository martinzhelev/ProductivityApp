const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
});

// Check if the model already exists
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
