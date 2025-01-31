document.addEventListener('DOMContentLoaded', () => {
    // Parse userId from cookies
    function getCookie(name) {
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.split("=");
            if (cookieName === name) {
                return decodeURIComponent(cookieValue);
            }
        }
        return null; // Return null if not found
    }
    const userId = getCookie("userId");
    console.log("userId:", userId);

    // Fetch workouts for the user
    async function fetchWorkouts() {
        try {
            const response = await fetch(`/body/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fetchWorkouts' })
            });
            if (!response.ok) throw new Error('Failed to fetch workouts');
            const data = await response.json();
            console.log('Fetched workouts:', data);
        } catch (error) {
            console.error('Error fetching workouts:', error);
        }
    }

    // Add exercise form submission
    document.getElementById('addExerciseForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const exerciseName = document.getElementById('exerciseName').value;
        const category = document.getElementById('categoryPicker').value;
        const workoutDate = new Date().toISOString().split('T')[0]; // Allow custom date input

        try {
            const response = await fetch(`/body/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addExercise', exerciseName, category, workoutDate })
            });
            if (!response.ok) throw new Error('Failed to add exercise');
            location.reload(); // Reload the page to reflect changes
        } catch (error) {
            console.error('Error adding exercise:', error);
        }
    });

    //Add set form submission
    document.querySelectorAll('[data-bs-target="#addSetModal"]').forEach(button => {
        button.addEventListener('click', () => {
            const exerciseId = button.getAttribute('data-exercise-id');
            console.log("Clicked button exerciseId:", exerciseId); // Debugging
            document.getElementById('data-exercise-id').value = exerciseId;
            console.log("Hidden input value:", exerciseId); // Debugging
        });
    });
    
    
    document.getElementById('addSetForm').addEventListener('submit', async (event) => {
        event.preventDefault();
    
        const exercise_id = document.getElementById('data-exercise-id').value;
        const reps = document.getElementById('reps').value;
    
        console.log("Submitting:", { exercise_id, reps }); // Debugging
    
        if (!exercise_id) {
            console.error("Error: exercise_id is missing!");
            return;
        }
    
        try {
            const response = await fetch(`/body/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'addSet', 
                    reps, 
                    exercise_id
                })
            });
            if (!response.ok) throw new Error('Failed to add set');
            location.reload();
        } catch (error) {
            console.error('Error adding set:', error);
        }
    });
    

    // Mark workout as complete/incomplete
    document.querySelectorAll('.workout-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async (event) => {
            const isCompleted = event.target.checked;
            const date = event.target.getAttribute('data-date');
            if (!date) return;

            try {
                const response = await fetch(`/body/${userId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'markWorkoutComplete', date, isCompleted })
                });
                if (!response.ok) throw new Error('Failed to update workout status');
            } catch (error) {
                console.error('Error updating workout status:', error);
            }
        });
    });

    // Initial fetch of workouts
    fetchWorkouts();
});