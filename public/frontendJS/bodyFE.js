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

    // Get current page from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page')) || 1;
    let currentYear = parseInt(urlParams.get("year")) || new Date().getFullYear();
    let currentMonth = parseInt(urlParams.get("month")) || new Date().getMonth();

    // Function to update URL with pagination parameters
    function updateURL(page, year, month) {
        const params = new URLSearchParams(window.location.search);
        params.set('page', page);
        params.set('year', year);
        params.set('month', month);
        window.location.href = `${window.location.pathname}?${params.toString()}`;
    }

    // Handle pagination clicks
    document.querySelectorAll('.pagination .page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            const params = new URLSearchParams(href.substring(1));
            const page = parseInt(params.get('page'));
            const year = parseInt(params.get('year'));
            const month = parseInt(params.get('month'));
            
            // Update URL with all parameters
            const newParams = new URLSearchParams(window.location.search);
            newParams.set('page', page);
            newParams.set('year', year);
            newParams.set('month', month);
            window.location.href = `${window.location.pathname}?${newParams.toString()}`;
        });
    });

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

    document.getElementById('finishWorkoutButton').addEventListener('click', async (event)=>{
        event.preventDefault();

        let category = document.getElementById('categoryPicker').value;
        const today = new Date().toISOString().split('T')[0];       
        console.log("date: "+today)
        console.log(category)
        try {
            const response = await fetch(`/body/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'finishWorkout', category, date: today })
            });
            if (!response.ok) throw new Error('Failed to update workout status');
        } catch (error) {
            console.error('Error updating workout status:', error);
        }

        try{
            let response = await fetch(`/body/${userId}`,{
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({action: 'finishWorkout', category})
            })
            if (!response.ok) throw new Error('Failed to update category point');
        } catch(error){
            console.error("Error updating category point: ", error)
        }
        location.reload();
    })

    // Function to update calendar
    function updateCalendar() {
        const params = new URLSearchParams(window.location.search);
        params.set('year', currentYear);
        params.set('month', currentMonth);
        
        // Update the calendar title
        const calendarTitle = document.getElementById('calendarTitle');
        const date = new Date(currentYear, currentMonth);
        calendarTitle.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        window.location.href = `${window.location.pathname}?${params.toString()}`;
    }

    // Handle month navigation
    document.getElementById("prevMonth").addEventListener("click", (e) => {
        e.preventDefault();
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    });

    document.getElementById("nextMonth").addEventListener("click", (e) => {
        e.preventDefault();
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    });

});