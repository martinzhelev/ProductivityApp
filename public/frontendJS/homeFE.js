const taskModal = document.getElementById('task-modal');
const habitModal = document.getElementById('habit-modal');
const overlay = document.getElementById('overlay');
const addTaskButton = document.getElementById('addTask');
const closeButton = document.querySelector('.close-button');
const modalAddTask = document.getElementById('modal-add-task');
const modalAddHabit = document.getElementById('modal-add-habit');

const tasksList = document.getElementById("tasks-list");
const removeTaskButton = document.getElementById('removeTask');


// Functions for Modal
function openTaskModal() {
    taskModal.style.display = 'block';
    overlay.style.display = 'block';
}

function closeTaskModal() {
    taskModalodal.style.display = 'none';
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
            const taskId = this.closest('li').getAttribute('data-task-id');
            const isChecked = this.checked;
            
            updateTaskStatus(taskId, isChecked); // Send PATCH request to update task status
        });
    });
}

// Add event listeners for interactive elements
function addEventListeners() {
    addTaskButton.addEventListener('click', openTaskModal);
    closeButton.addEventListener('click', closeTaskModal);
    overlay.addEventListener('click', closeTaskModal);
    modalAddTask.addEventListener('click', addTask);
    removeTaskButton.addEventListener('click', removeDoneTasks);
}

// Initialize app
addCheckboxEventListeners();
addEventListeners();



