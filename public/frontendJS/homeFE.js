document.addEventListener("DOMContentLoaded", function (event) {
    const taskModal = document.getElementById('task-modal');
    const habitModal = document.getElementById('habit-modal');
    const overlay = document.getElementById('overlay');
    const addTaskButton = document.getElementById('addTask');
    const addHabitButton = document.getElementById('addHabit');
    const closeButtons = document.querySelectorAll('.close-button'); // Renamed to closeButtons
    const modalAddTask = document.getElementById('modal-add-task');
    const modalAddHabit = document.getElementById('modal-add-habit');
    const habitsList = document.getElementById('habits-list');
    const tasksList = document.getElementById("tasks-list");
    const removeTaskButton = document.getElementById('removeTask');
    const removeDoneHabitsButton = document.getElementById('removeHabit'); // Renamed to removeDoneHabitsButton

    var taskCategory;
    var habitCategory;

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
        taskCategory = document.getElementById('task-category').value
        console.log("taskCategory: " + taskCategory)

        if (taskInput) {
            fetch(`/home/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: taskInput, taskCategory: taskCategory })
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Response Data:', data);  // Log the data to verify contents
                    if (data.message === 'Task added successfully' && data.item) {
                        appendTaskToDOM(data.item); // Ensure the response's `item` matches your structure
                    }
                    else {
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
        habitCategory = document.getElementById('habit-category').value
        console.log(habitInput)
        if (habitInput) {
            fetch(`/home/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habit: habitInput, habitCategory: habitCategory }) // Updated to send 'habit'
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Response Data:', data);  // Log the data to verify contents
                    if (data.message === 'Habit added successfully' && data.item) {
                        appendHabitToDOM(data.item);
                    }
                    else {
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
        newTaskItem.innerHTML = `
            <div>
                <input type="checkbox" class="checkbox me-2" ${task.completed ? 'checked' : ''}>
                ${task.task}
            </div>
            <button class="btn btn-danger btn-sm delete-task" data-id="${task.task_id}">Delete</button>
        `;

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
        newHabitItem.innerHTML = `
            <div>
                <input type="checkbox" class="checkbox me-2" ${habit.completed ? 'checked' : ''}>
                ${habit.habit}
            </div>
            <button class="btn btn-danger btn-sm delete-task" data-id="${habit.habit_id}">Delete</button>
        `;

        // Add event listener to the checkbox for habit status updates
        const checkbox = newHabitItem.querySelector('.checkbox');
        checkbox.addEventListener('change', () => updateHabitStatus(habit.habit_id, checkbox.checked));

        habitsList.appendChild(newHabitItem);
    }

    // Function to update task completion status
    function updateTaskStatus(taskId, isChecked) {
        event.preventDefault();
        const taskCategory = document.getElementById('task-category').value
        console.log("task category: " + taskCategory)
        fetch(`/home/${userId}`, {  // Only userId in the URL
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'task', id: taskId, completed: isChecked, taskCategory: taskCategory })
        })
            .then(response => response.json())
            .then(data => console.log(`Task ${taskId} updated successfully`))
            .catch(error => console.error('Error:', error));
    }

    function updateHabitStatus(habitId, isChecked) {
        event.preventDefault();
        habitCategory = document.getElementById('habit-category').value

        fetch(`/home/${userId}`, {  // Only userId in the URL
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'habit', id: habitId, completed: isChecked, habitCategory: habitCategory })
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
                    body: JSON.stringify({ type: 'task', id: taskId })
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
    function removeDoneHabits() {
        const habits = habitsList.querySelectorAll('li'); // Select all habit items

        habits.forEach(habitItem => {
            const checkbox = habitItem.querySelector('.checkbox'); // Find checkbox for each habit
            if (checkbox && checkbox.checked) {
                const habitId = habitItem.getAttribute('data-habit-id'); // Get habit ID
                fetch(`/home/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'habit', id: habitId }) // Send type as 'habit'
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message === 'Habit deleted successfully') {
                            habitsList.removeChild(habitItem); // Remove the habit from DOM
                            console.log(`Habit ${habitId} deleted`);
                        }
                    })
                    .catch(error => console.error('Error:', error));
            }
        });
    }


    function addCheckboxEventListeners() {
        const checkboxes = document.querySelectorAll('.checkbox');

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', async function () {
                const listItem = this.closest('li');
                const isChecked = this.checked;
                

                // Determine if it's a task or a habit based on data attributes
                if (listItem.hasAttribute('data-task-id')) {
                    const taskId = listItem.getAttribute('data-task-id');
                    await updateTaskStatus(taskId, isChecked); // Send PATCH request to update task status
                } else if (listItem.hasAttribute('data-habit-id')) {
                    const habitId = listItem.getAttribute('data-habit-id');
                    await updateHabitStatus(habitId, isChecked); // Send PATCH request to update habit status
                }
            });
        });
    }

    // Add event listeners for interactive elements
    function addEventListeners() {
        // Task event listeners
        addTaskButton.addEventListener('click', openTaskModal);
        closeButtons.forEach(button => button.addEventListener('click', closeTaskModal));
        overlay.addEventListener('click', closeTaskModal);
        modalAddTask.addEventListener('click', addTask);
        removeTaskButton.addEventListener('click', removeDoneTasks);

        // Habit event listeners
        addHabitButton.addEventListener('click', openHabitModal);
        removeDoneHabitsButton.addEventListener('click', removeDoneHabits);
        closeButtons.forEach(button => button.addEventListener('click', closeHabitModal));
        modalAddHabit.addEventListener('click', addHabit);
    }

    // Single delete handler for all delete buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-task')) {
            const id = e.target.getAttribute('data-id');
            const li = e.target.closest('li');
            
            // Determine if it's a task or habit
            const isTask = li.hasAttribute('data-task-id');
            
            if (confirm("Are you sure you want to delete this item?")) {
                fetch(`/home/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        type: isTask ? 'task' : 'habit', 
                        id: id 
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Task deleted successfully' || data.message === 'Habit deleted successfully') {
                        li.remove();
                    } else {
                        throw new Error('Failed to delete item');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to delete item');
                });
            }
        }
    });

    // Initialize app
    addCheckboxEventListeners();
    addEventListeners();
});