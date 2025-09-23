const express = require("express");
const router = express.Router();
const db = require("../server"); // Import database connection

// GET /:userId - Fetch user, exercises, and completed workouts
router.get('/:userId', async (req, res) => {
    let year = parseInt(req.query.year);
    let month = parseInt(req.query.month);
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 5;

    if (isNaN(year) || isNaN(month)) {
        const today = new Date();
        year = today.getFullYear();
        month = today.getMonth();
    }

    try {
        const userId = req.user.userId;
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
        let [exercises] = await db.execute(
            'SELECT exercise_name AS name, exercise_id, active FROM exercises WHERE user_id = ? AND date = ? AND active = 1',
            [userId, today]
        );

        // Fetch sets for today's exercises
        let setsPromises = exercises.map(exercise => {
            return db.execute(
                'SELECT set1, set2, set3, set4, set5 FROM sets WHERE user_id = ? AND exercise_id = ? AND date = ?',
                [userId, exercise.exercise_id, today]
            );
        });

        let setsResults = await Promise.all(setsPromises);

        // Initialize exercises with sets
        exercises = exercises.map((exercise, index) => {
            const sets = setsResults[index]?.[0]?.[0] || {
                set1: 0,
                set2: 0,
                set3: 0,
                set4: 0,
                set5: 0
            };
            return { ...exercise, sets };
        });

        // Fetch all exercises with pagination
        const [allExercises] = await db.execute(
            'SELECT exercise_name AS name, exercise_id, active, date FROM exercises WHERE user_id = ? ORDER BY date DESC',
            [userId]
        );

        // Calculate pagination
        const totalPages = Math.ceil(allExercises.length / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedExercises = allExercises.slice(startIndex, endIndex);

        // Fetch sets for paginated exercises
        let allSetsPromises = paginatedExercises.map(exercise => {
            return db.execute(
                'SELECT set1, set2, set3, set4, set5 FROM sets WHERE user_id = ? AND exercise_id = ? AND date = ?',
                [userId, exercise.exercise_id, exercise.date]
            );
        });

        let allSetsResults = await Promise.all(allSetsPromises);

        const exercisesWithSets = paginatedExercises.map((exercise, index) => {
            const sets = allSetsResults[index]?.[0]?.[0] || {
                set1: 0,
                set2: 0,
                set3: 0,
                set4: 0,
                set5: 0
            };
            return { ...exercise, sets };
        });

        // Format completed workouts
        const formattedCompletedWorkouts = completedWorkouts.map(workout => {
            const workoutDate = new Date(workout.date);
            workoutDate.setMinutes(workoutDate.getMinutes() - workoutDate.getTimezoneOffset());
            return {
                ...workout,
                date: workoutDate.toISOString().split('T')[0]
            };
        });

        // Render template with pagination data
        res.render('body', {
            month,
            year,
            exercises: exercises || [],
            allExercises: exercisesWithSets,
            totalPages,
            currentPage: page,
            completedWorkouts: formattedCompletedWorkouts || [],
            username,
            userId: req.params.userId
        });
    } catch (error) {
        console.error("Error fetching workouts:", error);
        res.status(500).json({ message: "An error occurred while fetching workouts" });
    }
});




// POST /:userId - Handle various workout actions
router.post('/:userId', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { action, exerciseName, workoutDate, category, workoutId, reps, date, isCompleted, exercise_id: exerciseId } = req.body;


        if (!userId) return res.status(400).json({ message: 'User ID is required' });
        switch (action) {
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
            case "finishWorkout": {
                console.log("category: " + category)
                console.log("date: " + date)
                const [existing] = await db.execute(
                    'SELECT * FROM workouts_calendar WHERE user_id = ? AND date = ?',
                    [userId, date]
                );

                if (!userId || !date || !category) {
                    return res.status(400).json({ success: false, message: "Missing required parameters" });
                }

                if (existing.length > 0) {
                    await db.execute(
                        'UPDATE workouts_calendar SET is_completed = ?, category = ? WHERE user_id = ? AND date = ?',
                        [1, category, userId, date]
                    );
                } else {
                    await db.execute(
                        'INSERT INTO workouts_calendar (user_id, date, category, is_completed) VALUES (?, ?, ?, ?)',
                        [userId, date, category, 1]
                    );
                }

                await db.execute(
                    'UPDATE exercises SET active = ? WHERE user_id = ? AND date = ?',
                    [0, userId, date]
                )


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

router.patch('/:userId', async (req, res) => {
    const { category, action } = req.body;
    const userId = req.user.userId
    switch (action) {
        case "finishWorkout": {
            const [statRows] = await db.execute(
                'SELECT * FROM user_stats WHERE user_id = ? AND stat_name = ?',
                [userId, category]
            );

            if (statRows.length > 0) {
                console.log(`Stat found, incrementing value for stat: ${category}`); // Debugging
                const statId = statRows[0].stat_id;

                // Decrement the stat value (optional logic for "un-completing")
                await db.execute(
                    'UPDATE user_stats SET stat_value = GREATEST(stat_value + 1, 0) WHERE stat_id = ?',
                    [statId]
                );
            }
            else {
                // ❌ Stat doesn't exist, insert it with the increment value
                await db.execute(
                    'INSERT INTO user_stats (user_id, stat_name, stat_value) VALUES (?, ?, ?)',
                    [userId, category, 1]
                );
                console.log(`Stat not found, created new stat with value ${incrementValue}`);
            }
            return res.json({ success: true, message: 'Workout status updated' });
        }
        default:
            return res.status(400).json({ message: 'Invalid action' });
    }
});
module.exports = router;
