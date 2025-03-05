const express = require('express');
const mysql = require('mysql2/promise')
const bodyParser = require('body-parser');  
const app = express();
const cookieParser = require('cookie-parser');

// Middleware for JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// Set EJS as the view engine
app.set('view engine', 'ejs');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password:null,
    database: 'productivityapp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

  module.exports = db;

// Route Imports
const loginRouter = require("./routes/login");
const registerRouter = require("./routes/register");
const homeRouter = require("./routes/home");
const bodyRouter = require("./routes/body");
const mentalRouter = require('./routes/mental');
const workRouter = require('./routes/work')
const socialRouter = require('./routes/social')

// Mount Routes
app.use("/register", registerRouter);
app.use("/login", loginRouter);  
app.use("/home", homeRouter);
app.use("/body", bodyRouter)
app.use('/mental', mentalRouter);
app.use("/work", workRouter);
app.use("/social", socialRouter)

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
