// const express = require('express');
// // const mongoose = require('mongoose');
// const bodyParser = require('body-parser');  // Import body-parser
// const app = express();

// // Set EJS as the view engine
// app.set('view engine', 'ejs');


// // Use body-parser globally for parsing JSON bodies
// app.use(bodyParser.json());  // Parse JSON bodies
// app.use(bodyParser.urlencoded({ extended: true }));  // Parse URL-encoded bodies
// app.use(express.static('public'));

// // Routes
// const loginRouter = require("./routes/login")
// const registerRouter = require("./routes/register");
// const homeRouter = require("./routes/home");
// app.use("/register", registerRouter);  // Mounts the register route at /register
// app.use("/login", loginRouter);  
// app.use("/home", homeRouter);

// // Start the server
// const port = 3000;
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });



const express = require('express');
const bodyParser = require('body-parser');  
const app = express();

// Middleware for JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Route Imports
const loginRouter = require("./routes/login");
const registerRouter = require("./routes/register");
const homeRouter = require("./routes/home");

// Mount Routes
app.use("/register", registerRouter);
app.use("/login", loginRouter);  
app.use("/home", homeRouter);

// Handle 404 errors
app.use((req, res) => {
    res.status(404).send("Page not found");
});

// Handle other errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
