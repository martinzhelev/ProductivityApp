const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const db = require("../server");



router.use(bodyParser.json());


router.get('/', (req, res)=>{
    res.render('login');
})


router.post('/', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query to find the user by username
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        const userSavedPassword = await db.execute('SELECT password FROM users WHERE username = ?', [username]);
       console.log(userSavedPassword)
        if (rows.length > 0) {
            const user = rows[0];
            console.log('User found:', user);
            if(password!=userSavedPassword){
                res.cookie('userId', user.user_id, { maxAge: 24 * 60 * 60 * 1000, httpOnly: false });
                console.log(user.user_id)
                
                res.status(200).json({ 
                    message: 'Login successful', 
                    redirectUrl: `/home/${user.user_id}` // Redirects to user's unique home page
                });
            }
           
           // return user;
        } else {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
            }
        
    } catch (error) {
        console.error('Error finding user by username:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;


