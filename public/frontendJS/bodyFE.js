document.addEventListener('DOMContentLoaded', () => {
    const userId = getCookie('userId');

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Fetch and display workouts
    async function fetchWorkouts() {
        const response = await fetch(`/body/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetchWorkouts' })
        });

        const data = await response.json();
        console.log('Fetched workouts:', data);
    }

    // Add Exercise
    document.getElementById('addExerciseForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const exerciseName = document.getElementById('exerciseName').value;
        const category = document.getElementById('categoryPicker').value;
        
        const response = await fetch(`/body/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'addExercise', exerciseName, category, workoutDate: new Date().toISOString().split('T')[0] })
        });

        if (response.ok) location.reload();
        else console.error('Failed to add exercise');
    });

    // Add Set
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.add-set-btn').forEach(button => {
            button.addEventListener('click', function () {
                const workoutId = this.getAttribute('data-exercise-id');
                document.getElementById('data-exercise-id').value = workoutId;
            });
        });
    
        document.getElementById('addSetForm').addEventListener('submit', async (event) => {
            event.preventDefault();
    
            const workoutId = document.getElementById('data-exercise-id').value;
            const reps = document.getElementById('reps').value;
            const minutes = document.getElementById('minutes').value;
    
            if (!workoutId || !reps || !minutes) {
                console.error("Missing required fields");
                return;
            }
    
            const response = await fetch(`/body/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addSet', workoutId, reps, minutes })
            });
    
            if (response.ok) location.reload();
            else console.error('Failed to add set');
        });
    });
    

    // Mark Workout as Complete
    document.querySelectorAll('.workout-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async (event) => {
            const isCompleted = event.target.checked;
            const date = event.target.getAttribute('data-date');

            if (!date) {
                console.error('Invalid date');
                return;
            }

            const response = await fetch(`/body/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markWorkoutComplete', date, isCompleted })
            });

            if (!response.ok) console.error('Failed to update workout status');
        });
    });

    // Store exercise ID when opening "Add Set" modal
    document.querySelectorAll('[data-bs-target="#addSetModal"]').forEach(button => {
        button.addEventListener('click', () => {
            const exerciseId = button.getAttribute('data-exercise-id');
            document.getElementById('exerciseId').value = exerciseId;
        });
    });

    fetchWorkouts(); // Fetch workouts on page load
});
