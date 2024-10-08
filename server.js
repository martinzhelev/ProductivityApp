const express = require('express');
// const mongoose = require('mongoose');
const bodyParser = require('body-parser');  // Import body-parser
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');

// MongoDB connection using Mongoose (remove deprecated options)
// mongoose.connect('mongodb://localhost:27017/ProductivityApp')
//     .then(() => {
//         console.log('Connected to MongoDB');
//     })
//     .catch((error) => {
//         console.error('Error connecting to MongoDB:', error);
//     });

// Use body-parser globally for parsing JSON bodies
app.use(bodyParser.json());  // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));  // Parse URL-encoded bodies
app.use(express.static('public'));
// Routes
app.get("/login", (req, res) => {
    res.render('login');  // Ensure you have a views/login.ejs file
});


const registerRouter = require("./routes/register");
app.use("/register", registerRouter);  // Mounts the register route at /register

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
