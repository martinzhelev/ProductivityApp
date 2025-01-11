document.addEventListener("DOMContentLoaded", function(event) {
    const taskModal = document.getElementById('task-modal');
    const habitModal = document.getElementById('habit-modal');
    const overlay = document.getElementById('overlay');
    const addTaskButton = document.getElementById('addTask');
    const addHabitButton = document.getElementById('addHabit');
    const closeButtons = document.querySelectorAll('.close-button'); // Renamed to closeButtons
    const modalAddTask = document.getElementById('modal-add-task');
    const modalAddHabit = document.getElementById('modal-add-habit');

    const tasksList = document.getElementById("tasks-list");
    const removeTaskButton = document.getElementById('removeTask');
    const userId = getCookie('userId');

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Functions for Modal
    function openTaskModal() {
        taskModal.style.display = 'block';
        overlay.style.display = 'block';
    }

    function closeTaskModal() {
        taskModal.style.display = 'none';
        overlay.style.display = 'none';
    }
    function openHabitModal() {
        habitModal.style.display = 'block';
        overlay.style.display = 'block';
    }

    function closeHabitModal() {
        habitModal.style.display = 'none';
        overlay.style.display = 'none';
    }

    function addTask(event) {
        event.preventDefault();
        const taskInput = document.getElementById('task-input').value.trim();

        if (taskInput) {
            fetch(`/home/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: taskInput })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Response Data:', data);  // Log the data to verify contents
                if (data.message === 'Task added successfully' && data.task) {
                    appendTaskToDOM(data.task);  // Pass the task object directly
                } else {
                    alert('Failed to add task');
                }
                document.getElementById('task-input').value = '';
            })
            .catch(error => console.error('Error:', error));
        }
        closeTaskModal();
    }
    function addHabit(event) {
        event.preventDefault();
        const habitInput = document.getElementById('habit-input').value.trim(); // Updated to 'habit-input'
        console.log(habitInput)
        if (habitInput) {
            fetch(`/home/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habit: habitInput }) // Updated to send 'habit'
            })
            .then(response => response.json())
            .then(data => {
                console.log('Response Data:', data);  // Log the data to verify contents
                if (data.message === 'Habit added successfully' && data.habit) { // Updated message and check for 'habit'
                    appendHabitToDOM(data.habit);  // Updated to 'appendHabitToDOM'
                } else {
                    alert('Failed to add habit');
                }
                document.getElementById('habit-input').value = ''; // Updated to 'habit-input'
            })
            .catch(error => console.error('Error:', error));
        }
        closeHabitModal(); // Updated to 'closeHabitModal'
    }

    function appendTaskToDOM(task) {
        if (!task || !task.task_id) {
            console.error('Task object is missing or incomplete:', task);
            return;
        }

        const newTaskItem = document.createElement('li');
        newTaskItem.setAttribute('data-task-id', task.task_id);
        newTaskItem.innerHTML = `<input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}> ${task.task}`;
        
        // Add event listener to the checkbox for task status updates
        const checkbox = newTaskItem.querySelector('.checkbox');
        checkbox.addEventListener('change', () => updateTaskStatus(task.task_id, checkbox.checked));

        tasksList.appendChild(newTaskItem);
    }

    function appendHabitToDOM(habit) {
        if (!habit || !habit.habit_id) {
            console.error('Habit object is missing or incomplete:', habit);
            return;
        }

        const newHabitItem = document.createElement('li');
        newHabitItem.setAttribute('data-habit-id', habit.habit_id);
        //console.log(habit)
        console.log(habit.habitId)

        newHabitItem.innerHTML = `<input type="checkbox" class="checkbox" ${habit.completed ? 'checked' : ''}> ${habit.habit}`;
        
        // Add event listener to the checkbox for habit status updates
        const checkbox = newHabitItem.querySelector('.checkbox');
        checkbox.addEventListener('change', () => updateHabitStatus(habit.habit_id, checkbox.checked));

        habitsList.appendChild(newHabitItem); // Make sure `habitsList` is definedldddlllldlll
    }

    // Function to update task completion status
    function updateTaskStatus(taskId, isChecked) {
        fetch(`/home/${userId}`, {  // Only userId in the URL
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, completed: isChecked })  // Send taskId in the body
        })
        .then(response => response.json())
        .then(data => console.log(`Task ${taskId} updated successfully`))
        .catch(error => console.error('Error:', error));
    }

    function updateHabitStatus(habitId, isChecked) {
        fetch(`/home/${userId}`, {  // Only userId in the URL
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ habitId, completed: isChecked })  // Send habitId in the body
        })
        .then(response => response.json())
        .then(data => console.log(`Habit ${habitId} updated successfully`))
        .catch(error => console.error('Error:', error));
    }

    // Function to remove all completed tasks
    function removeDoneTasks() {
        const tasks = tasksList.querySelectorAll('li');

        tasks.forEach(taskItem => {
            const checkbox = taskItem.querySelector('.checkbox');
            if (checkbox && checkbox.checked) {
                const taskId = taskItem.getAttribute('data-task-id');
                fetch(`/home/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Task deleted successfully') {
                        tasksList.removeChild(taskItem);
                        console.log(`Task ${taskId} deleted`);
                    }
                })
                .catch(error => console.error('Error:', error));
            }
        });
    }

    function addCheckboxEventListeners() {
        const checkboxes = document.querySelectorAll('.checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const listItem = this.closest('li');
                const isChecked = this.checked;

                // Determine if it's a task or a habit based on data attributes
                if (listItem.hasAttribute('data-task-id')) {
                    const taskId = listItem.getAttribute('data-task-id');
                    updateTaskStatus(taskId, isChecked); // Send PATCH request to update task status
                } else if (listItem.hasAttribute('data-habit-id')) {
                    const habitId = listItem.getAttribute('data-habit-id');
                    updateHabitStatus(habitId, isChecked); // Send PATCH request to update habit status
                }
            });
        });
    }

    // Add event listeners for interactive elements
    function addEventListeners() {
        // Task event listeners
        addTaskButton.addEventListener('click', openTaskModal);
        closeButtons.forEach(button => button.addEventListener('click', closeTaskModal)); // Loop through closeButtons
        overlay.addEventListener('click', closeTaskModal);
        modalAddTask.addEventListener('click', addTask);
        removeTaskButton.addEventListener('click', removeDoneTasks);

        // Habit event listeners
        addHabitButton.addEventListener('click', openHabitModal);
        closeButtons.forEach(button => button.addEventListener('click', closeHabitModal)); // Loop through closeButtons
        modalAddHabit.addEventListener('click', addHabit);
    }

    // Initialize app
    addCheckboxEventListeners();
    addEventListeners();
});