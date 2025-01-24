const express = require("express");
const router = express.Router();
const db = require("../server"); // Import database connection

// GET /:userId - Fetch user, exercises, and completed workouts
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.cookies.userId; // Get userId from URL parameter

        if (!userId) {
            return res.status(400).json({ message: "User ID is missing" });
        }

        // Fetch user data
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch completed workouts
        const [completedWorkouts] = await db.execute(
            'SELECT workout_id, is_completed, date FROM workouts_calendar WHERE user_id = ?', 
            [userId]
        );

        // Fetch all exercises
        const [exercises] = await db.execute(
            'SELECT workout_id, exercise_name AS name, sets, reps, category FROM workouts WHERE user_id = ?', 
            [userId]
        );

        // Format the date field to 'YYYY-MM-DD'
        const formattedCompletedWorkouts = completedWorkouts.map(workout => {
            const date = new Date(workout.date);
            const formattedDate = date.toISOString().split('T')[0]; // Get the date part only (YYYY-MM-DD)
            return {
                ...workout,
                date: formattedDate
            };
        });

        // Render template with fetched data
        res.render('body', {
            exercises,
            completedWorkouts: formattedCompletedWorkouts,
            username: userRows[0].username
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
        const { action, exerciseName, workoutDate, category, workoutId, reps, minutes, date, isCompleted } = req.body;

        if (!userId) return res.status(400).json({ message: 'User ID is required' });

        switch (action) {
            case 'fetchWorkouts': {
                // Fetch user data
                const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
                if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });

                // Fetch completed workouts
                const [completedWorkouts] = await db.execute(
                    'SELECT workout_id, is_completed, date FROM workouts_calendar WHERE user_id = ?',
                    [userId]
                );

                // Fetch all exercises
                const [exercises] = await db.execute(
                    'SELECT workout_id, exercise_name AS name, sets, reps, category FROM workouts WHERE user_id = ?',
                    [userId]
                );

                return res.json({ exercises, completedWorkouts, username: userRows[0].username });
            }

            case 'addExercise': {
                if (!exerciseName || !category) {
                    return res.status(400).json({ message: 'Exercise name and category are required' });
                }

                await db.execute(
                    'INSERT INTO workouts (user_id, workout_date, exercise_name, sets, reps, category) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, workoutDate, exerciseName, 0, 0, category]
                );

                return res.json({ success: true, message: 'Exercise added successfully' });
            }

            case 'addSet': {
                if (!workoutId || reps === undefined || minutes === undefined) {
                    return res.status(400).json({ message: 'Workout ID, reps, and minutes are required' });
                }

                await db.execute('UPDATE workouts SET sets = sets + 1, reps = ? WHERE workout_id = ?', [reps, workoutId]);

                return res.json({ success: true, message: 'Set added successfully' });
            }

            case 'markWorkoutComplete': {
                if (!date) return res.status(400).json({ message: 'Workout date is required' });

                const [existing] = await db.execute(
                    'SELECT * FROM workouts_calendar WHERE user_id = ? AND date = ?',
                    [userId, date]
                );

                if (existing.length > 0) {
                    // Update existing workout status
                    await db.execute(
                        'UPDATE workouts_calendar SET is_completed = ? WHERE user_id = ? AND date = ?',
                        [isCompleted ? 1 : 0, userId, date]
                    );
                    return res.json({ success: true, message: 'Workout status updated' });
                } else {
                    // Insert new workout status
                    await db.execute(
                        'INSERT INTO workouts_calendar (is_completed, user_id, date) VALUES (?, ?, ?)',
                        [isCompleted ? 1 : 0, userId, date]
                    );
                    return res.json({ success: true, message: 'Workout added successfully' });
                }
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
