// const modal = document.getElementById('modal');
//     const overlay = document.getElementById('overlay');
//     const addTaskButton = document.getElementById('addTask');
//     const closeButton = document.querySelector('.close-button');
//     const modalAddTask = document.getElementById('modal-add-task');
//     const tasksList = document.getElementById("tasks-list");
//     const removeTask = document.getElementById('removeTask');
//     // Function to open modal
//     function openModal() {
//         modal.style.display = 'block';
//         overlay.style.display = 'block';
//     }

//     // Function to close modal
//     function closeModal() {
//         modal.style.display = 'none';
//         overlay.style.display = 'none';
//     }

//     function removeDoneTasks() {
//         // Get all the tasks in the list
//         const tasks = tasksList.querySelectorAll('li');
    
//         tasks.forEach(taskItem => {
//             // Get the checkbox of each task
//             const checkbox = taskItem.querySelector('.checkbox');
    
//             // If the checkbox is checked, send a DELETE request to remove the task
//             if (checkbox && checkbox.checked) {
//                 // Assuming the task's id is stored in a data attribute like data-task-id
//                 const taskId = taskItem.getAttribute('data-task-id');
                                
//                 fetch(`/home/${taskId}`, {
//                     method: 'DELETE',
//                     headers: {
//                         'Content-Type': 'application/json'
//                     }
//                 })
//                 .then(response => {
//                     if (!response.ok) {
//                         return response.json().then(errData => { throw new Error(errData.message); });
//                     }
//                     return response.json();
//                 })
//                 .then(data => {
//                     console.log(`Task ${taskId} deleted`);
//                     // Remove the task from the DOM
//                     tasksList.removeChild(taskItem);
//                 })
//                 .catch(error => {
//                     console.error('Error:', error);
//                 });
//             }
//         });
//     }


//     function updateTaskStatus(taskId, isChecked) {
//         // Send a PATCH request to update the task's completion status in the database
//         fetch(`/home/${taskId}`, {
//             method: 'PATCH',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ completed: isChecked }) // Send the updated status
//         })
//         .then(response => {
//             if (!response.ok) {
//                 return response.json().then(errData => { throw new Error(errData.message); });
//             }
//             return response.json();
//         })
//         .then(data => {
//             console.log(`Task ${taskId} updated successfully`);
//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });
//     }
    
//     // Add event listeners to all checkboxes associated with tasks
//     function addCheckboxEventListeners() {
//         const checkboxes = document.querySelectorAll('.checkbox');
        
//         checkboxes.forEach(checkbox => {
//             checkbox.addEventListener('change', function() {
//                 const taskId = this.closest('li').getAttribute('data-task-id');
//                 const isChecked = this.checked;
                
//                 updateTaskStatus(taskId, isChecked); // Send PATCH request to update task status
//             });
//         });
//     }
    
//     // Example: Modify the addTask function to include the checkbox change event listener
//     function addTask(event) {
//         event.preventDefault();

//         let task = document.getElementById('task-input').value;

//         if (task.trim() !== '') {
//             const newTaskItem = document.createElement('li');
//             newTaskItem.innerHTML = `<input type="checkbox" class="checkbox"> ${task}`;
//             tasksList.appendChild(newTaskItem);
//         }
    
//         if (task.trim() !== '') {
//             fetch('/home', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ task: task })
//             })
//             .then(response => {
//                 if (!response.ok) {
//                     return response.json().then(errData => { throw new Error(errData.message); });
//                 }
//                 return response.json();
//             })
//             .then(data => {
                
//                 if (data.message === 'Task added successfully') {
//                         alert(data.message)
//                     } else {
//                         alert(data.message);
//                     }
    
    
//                 document.getElementById('task-input').value = '';
    
//             })
//             .catch(error => {
//                 console.error('Error:', error);
//             });
//         }
//         closeModal();

//     }
    


//     addCheckboxEventListeners();
//     // Event listeners
//     addTaskButton.addEventListener('click', openModal);
//     closeButton.addEventListener('click', closeModal);
//     overlay.addEventListener('click', closeModal);
//     modalAddTask.addEventListener('click', addTask);
//     removeTask.addEventListener('click', removeDoneTasks);




const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const addTaskButton = document.getElementById('addTask');
const closeButton = document.querySelector('.close-button');
const modalAddTask = document.getElementById('modal-add-task');
const tasksList = document.getElementById("tasks-list");
const removeTaskButton = document.getElementById('removeTask');

const userId = document.getElementById('user-info').getAttribute('data-user-id');


// Functions for Modal
function openModal() {
    modal.style.display = 'block';
    overlay.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
    overlay.style.display = 'none';
}

// Function to add a new task
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
            if (data.message === 'Task added successfully') {
                alert(data.message);
                appendTaskToDOM(data.task);  // Assuming the task is returned in the response
            } else {
                alert('Failed to add task');
            }
            document.getElementById('task-input').value = '';
        })
        .catch(error => console.error('Error:', error));
    }
    closeModal();
}

// Append a new task to the DOM with checkbox and event listeners
function appendTaskToDOM(task) {
    const newTaskItem = document.createElement('li');
    newTaskItem.setAttribute('data-task-id', task._id);
    newTaskItem.innerHTML = `<input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}> ${task.task}`;
    
    // Add event listener to checkbox
    const checkbox = newTaskItem.querySelector('.checkbox');
    checkbox.addEventListener('change', () => updateTaskStatus(task._id, checkbox.checked));

    tasksList.appendChild(newTaskItem);
}

// Function to update task completion status
function updateTaskStatus(taskId, isChecked) {
    fetch(`/home/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: isChecked })
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
                headers: { 'Content-Type': 'application/json' }
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

// Add event listeners for interactive elements
function addEventListeners() {
    addTaskButton.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    modalAddTask.addEventListener('click', addTask);
    removeTaskButton.addEventListener('click', removeDoneTasks);
}

// Initialize app
addEventListeners();
