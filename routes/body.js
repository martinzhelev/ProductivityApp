const express = require("express");
const router = express.Router();
const db = require("../server"); // Import database connection

// GET /:userId - Fetch user, exercises, and completed workouts
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }

        // Fetch user data
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        const username = userRows.length > 0 ? userRows[0].username : "Guest";

        // Fetch completed workouts
        const [completedWorkouts] = await db.execute(
            'SELECT workout_id, is_completed, date FROM workouts_calendar WHERE user_id = ?', 
            [userId]
        );

        // Get today's date
        const today = new Date().toISOString().split('T')[0];

        // Fetch today's workouts (if available)
        const [workouts] = await db.execute(
            'SELECT workout_id FROM workouts_calendar WHERE user_id = ? AND date = ?',
            [userId, today]
        );

        // Fetch exercises (if workout exists)
        let exercises = [];
[exercises] = await db.execute(
    'SELECT exercise_name AS name, exercise_id FROM exercises WHERE user_id = ? AND date = ?',
    [userId, today]
);

// Now we need to fetch sets for each exercise
let setsPromises = exercises.map(exercise => {
    return db.execute(
        'SELECT set1, set2, set3, set4, set5 FROM sets WHERE user_id = ? AND exercise_id = ? AND date = ?',
        [userId, exercise.exercise_id, today]
    );
});

// Wait for all set fetch operations to complete
let setsResults = await Promise.all(setsPromises);

// Log the sets results to debug
console.log("Sets Results:", setsResults);

// Merge the sets with exercises
// Merge the sets with exercises
exercises = exercises.map((exercise, index) => {
    const sets = setsResults[index][0] && setsResults[index][0][0] ? setsResults[index][0][0] : {}; // Access the first object in the array
    return {
        ...exercise,
        sets: sets // Merge sets with exercises
    };
});

        // Format completed workouts
        const formattedCompletedWorkouts = completedWorkouts.map(workout => {
            const workoutDate = new Date(workout.date);
            
            // Adjust for the time zone offset
            workoutDate.setMinutes(workoutDate.getMinutes() - workoutDate.getTimezoneOffset());
        
            // Return the formatted date as YYYY-MM-DD
            return {
                ...workout,
                date: workoutDate.toISOString().split('T')[0]
            };
        });
        

        // Render template
        res.render('body', {
            exercises: exercises || [],
            completedWorkouts: formattedCompletedWorkouts || [],
            username
        });
    } catch (error) {
        console.error("Error fetching workouts:", error);
        res.status(500).json({ message: "An error occurred while fetching workouts" });
    }
});



// POST /:userId - Handle various workout actions
router.post('/:userId', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        const { action, exerciseName, workoutDate, category, workoutId, reps, minutes, date, isCompleted, exercise_id: exerciseId } = req.body;
        if (!userId) return res.status(400).json({ message: 'User ID is required' });

        switch (action) {
            case 'fetchWorkouts': {
                const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
                const username = userRows.length > 0 ? userRows[0].username : "Guest";

                const [completedWorkouts] = await db.execute(
                    'SELECT workout_id, is_completed, date FROM workouts_calendar WHERE user_id = ?',
                    [userId]
                );

                const [exercises] = await db.execute(
                    'SELECT exercise_name AS name FROM exercises WHERE user_id = ?',
                    [userId]
                );

                return res.json({
                    exercises: exercises || [],
                    completedWorkouts: completedWorkouts || [],
                    username
                });
            }
            case 'addExercise': {
                if (!exerciseName || !category) {
                    return res.status(400).json({ message: 'Exercise name and category are required' });
                }
                await db.execute(
                    'INSERT INTO exercises (user_id, date, exercise_name) VALUES (?, ?, ?)',
                    [userId, workoutDate, exerciseName]
                );
                return res.json({ success: true, message: 'Exercise added successfully' });
            }
            case 'addSet': {
                // Now exerciseId is defined!
                if (!exerciseId || reps === undefined) {
                  return res.status(400).json({ message: 'Exercise ID and reps are required' });
                }
              
                // Fetch existing sets
                const [setsResult] = await db.execute(
                  'SELECT set1, set2, set3, set4, set5 FROM sets WHERE exercise_id = ?',
                  [exerciseId]
                );
              
                if (setsResult.length === 0) {
                  // Insert new record if none exists
                  await db.execute(
                    'INSERT INTO sets (exercise_id, user_id, date, set1, set2, set3, set4, set5) VALUES (?, ?, ?, 0, 0, 0, 0, 0)',
                    [exerciseId, userId, new Date().toISOString().split('T')[0]]
                  );
                  const [newSetsResult] = await db.execute('SELECT set1, set2, set3, set4, set5 FROM sets WHERE exercise_id = ?', [exerciseId]);
                  var sets = newSetsResult[0]; // Use `var` to ensure scope is correct
                } else {
                  var sets = setsResult[0];
                }
              
                // Determine which set to update
                let setToUpdate = null;
                if (sets.set1 === 0) setToUpdate = 'set1';
                else if (sets.set2 === 0) setToUpdate = 'set2';
                else if (sets.set3 === 0) setToUpdate = 'set3';
                else if (sets.set4 === 0) setToUpdate = 'set4';
                else if (sets.set5 === 0) setToUpdate = 'set5';
                else return res.status(400).json({ message: 'All sets filled' });
              
                // Update the set
                await db.execute(
                  `UPDATE sets SET ${setToUpdate} = ? WHERE exercise_id = ?`,
                  [reps, exerciseId]
                );
              
                return res.json({ success: true, message: 'Set added successfully' });
              }
            case 'markWorkoutComplete': {
                if (!date) return res.status(400).json({ message: 'Workout date is required' });
                const [existing] = await db.execute(
                    'SELECT * FROM workouts_calendar WHERE user_id = ? AND date = ?',
                    [userId, date]
                );
                if (existing.length > 0) {
                    await db.execute(
                        'UPDATE workouts_calendar SET is_completed = ? WHERE user_id = ? AND date = ?',
                        [isCompleted ? 1 : 0, userId, date]
                    );
                } else {
                    await db.execute(
                        'INSERT INTO workouts_calendar (is_completed, user_id, date) VALUES (?, ?, ?)',
                        [isCompleted ? 1 : 0, userId, date]
                    );
                }
                return res.json({ success: true, message: 'Workout status updated' });
            }
            default:
                return res.status(400).json({ message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Workout API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
