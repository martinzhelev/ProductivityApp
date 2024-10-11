const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require('../models/user');

router.get('/',(req, res)=>{
    res.render("home");
})

module.exports = router