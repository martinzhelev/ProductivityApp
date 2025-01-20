const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const db = require("../server");



router.get('/:userId', async (req, res) => {
  try {
      const userId = req.cookies.userId;
      if (!userId) {
          return res.status(400).json({ message: "User ID is missing" });
      }

      const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
      if (userRows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Fetch completed workouts for the user based on workout_id
      const [completedWorkouts] = await db.execute('SELECT workout_id, is_completed, date FROM workouts_calendar WHERE user_id = ?', [userId]);

      const [exercises] = await db.execute('SELECT * FROM workouts WHERE user_id = ?', [userId]);

      // Format the date field to 'YYYY-MM-DD' format
      const formattedCompletedWorkouts = completedWorkouts.map(workout => {
          const date = new Date(workout.date);
          const formattedDate = date.toISOString().split('T')[0]; // Get the date part only (YYYY-MM-DD)
          return {
              ...workout,
              date: formattedDate
          };
      });

      // Log completed workouts with formatted dates
      console.log("Formatted Completed Workouts:", formattedCompletedWorkouts);

      // Send the data to the template
      res.render('body', {exercises, completedWorkouts: formattedCompletedWorkouts, username: userRows[0].username });
  } catch (error) {
      console.error("Error fetching workouts:", error);
      res.status(500).json({ message: "An error occurred while fetching workouts" });
  }
});





router.post('/:userId', async (req, res) => {
  const { date, isCompleted } = req.body; // Use workoutId instead of date
  const userId = req.cookies.userId;

  if (!date) {
      return res.status(400).json({ success: false, message: "date is required." });
  }

  try {
      // Check if the workout exists for the user
      const [existing] = await db.execute(
          'SELECT * FROM workouts_calendar WHERE user_id = ? AND date = ?',
          [userId, date]
      );

      if (existing.length > 0) {
          // Update existing workout status
          const [updateResult] = await db.execute(
              'UPDATE workouts_calendar SET is_completed = ? WHERE user_id = ? AND date = ?',
              [isCompleted, userId, date]
          );

          if (updateResult.affectedRows > 0) {
              return res.json({ success: true, message: 'Workout updated successfully.' });
          } else {
              return res.json({ success: false, message: 'No changes made to the workout.' });
          }
      } else {
          // Insert new workout status
          const [insertResult] = await db.execute(
              'INSERT INTO workouts_calendar (is_completed, user_id, date) VALUES (?, ?, ?)',
              [isCompleted, userId, date]
          );

          if (insertResult.affectedRows > 0) {
              return res.json({ success: true, message: 'Workout added successfully.' });
          } else {
              return res.json({ success: false, message: 'Failed to add the workout.' });
          }
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error.' });
  }
});


module.exports = router;







