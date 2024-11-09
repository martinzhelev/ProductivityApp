const express = require('express');
const mysql = require('mysql2/promise')
const bodyParser = require('body-parser');  
const app = express();

// Middleware for JSON and URL-encoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

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

  // Connect to MySQL
//   db.connect((err) => {
//     if (err) {
//       console.error('Error connecting to MySQL: ' + err.stack);
//       return;
//     }
//     console.log('Connected to MySQL as ID ' + db.threadId);
//   });

  module.exports = db;

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
