const modal = document.getElementById('modal');
    const overlay = document.getElementById('overlay');
    const addTaskButton = document.getElementById('addTask');
    const closeButton = document.querySelector('.close-button');
    const modalAddTask = document.getElementById('modal-add-task');
    const tasksList = document.getElementById("tasks-list");
    const removeTask = document.getElementById('removeTask');
    // Function to open modal
    function openModal() {
        modal.style.display = 'block';
        overlay.style.display = 'block';
    }

    // Function to close modal
    function closeModal() {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }

    function removeDoneTasks() {
        // Get all the tasks in the list
        const tasks = tasksList.querySelectorAll('li');
    
        tasks.forEach(taskItem => {
            // Get the checkbox of each task
            const checkbox = taskItem.querySelector('.checkbox');
    
            // If the checkbox is checked, send a DELETE request to remove the task
            if (checkbox && checkbox.checked) {
                // Assuming the task's id is stored in a data attribute like data-task-id
                const taskId = taskItem.getAttribute('data-task-id');
                                
                fetch(`/home/${taskId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(errData => { throw new Error(errData.message); });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`Task ${taskId} deleted`);
                    // Remove the task from the DOM
                    tasksList.removeChild(taskItem);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }
        });
    }

    // function addTask(event){
    //     event.preventDefault();
    //     let task = document.getElementById('task-input').value

    //     let taskObject = {
    //         task: task
    //     };

    //     if (task.trim() !== '') {
    //         const newTaskItem = document.createElement('li');
    //         newTaskItem.innerHTML = `<input type="checkbox" class="checkbox"> ${task}`;
    //         tasksList.appendChild(newTaskItem);
    //     }

       

    //     fetch('/home', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify(taskObject)
    //     })
    //     .then(response => {
    //         // Check for non-200 responses
    //         if (!response.ok) {
    //             return response.json().then(errData => { throw new Error(errData.message); });
    //         }
    //         return response.json();
    //     })
    //     .then(data => {
    //         console.log("task registered")
    //         if (data.message === 'Task added successfully') {
    //             alert(data.message)
    //         } else {
    //             alert(data.message);
    //         }
    //     })
    //     .catch(error => {
    //         console.error('Error:', error);
    //     });

    //     closeModal();
    // }







    function updateTaskStatus(taskId, isChecked) {
        // Send a PATCH request to update the task's completion status in the database
        fetch(`/home/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed: isChecked }) // Send the updated status
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => { throw new Error(errData.message); });
            }
            return response.json();
        })
        .then(data => {
            console.log(`Task ${taskId} updated successfully`);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    
    // Add event listeners to all checkboxes associated with tasks
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
    
    // Example: Modify the addTask function to include the checkbox change event listener
    function addTask(event) {
        event.preventDefault();

        let task = document.getElementById('task-input').value;

        if (task.trim() !== '') {
            const newTaskItem = document.createElement('li');
            newTaskItem.innerHTML = `<input type="checkbox" class="checkbox"> ${task}`;
            tasksList.appendChild(newTaskItem);
        }
    
        if (task.trim() !== '') {
            fetch('/home', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ task: task })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => { throw new Error(errData.message); });
                }
                return response.json();
            })
            .then(data => {
                
                if (data.message === 'Task added successfully') {
                        alert(data.message)
                    } else {
                        alert(data.message);
                    }
    
    
                document.getElementById('task-input').value = '';
    
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
        closeModal();

    }
    


    addCheckboxEventListeners();
    // Event listeners
    addTaskButton.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    modalAddTask.addEventListener('click', addTask);
    removeTask.addEventListener('click', removeDoneTasks);
