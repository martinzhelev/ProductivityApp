document.addEventListener("DOMContentLoaded", () => {
    const saveDeadlineBtn = document.getElementById("saveDeadlineBtn");

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

    saveDeadlineBtn.addEventListener("click", () => {
        const name = document.getElementById("deadlineName").value.trim();
        const date = document.getElementById("deadlineDate").value;
        const time = document.getElementById("deadlineTime").value;

        if (!name || !date || !time) {
            alert("Please fill out all fields.");
            return;
        }

        // Combine date and time into a single DateTime string (YYYY-MM-DD HH:MM:SS)
        const deadlineDateTime = `${date} ${time}:00`;

        fetch(`/work/${userId}/add-deadline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, deadlineDateTime }),
        })
            .then((response) => {
                if (response.ok) return response.json();
                throw new Error("Failed to save deadline.");
            })
            .then(() => location.reload()) // Reload page to show new deadline
            .catch((error) => console.error(error));
        window.location.reload();
    });

    document.querySelectorAll(".delete-deadline").forEach(button => {
        button.addEventListener("click", function () {
            const deadlineId = this.getAttribute("data-id");

            if (confirm("Are you sure you want to delete this deadline?")) {
                fetch(`/work/${userId}/deadlines/${deadlineId}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                })
                    .then(response => response.json())

                    .catch(error => console.error("Error:", error));
            }
            window.location.reload();

        });
    });

    const taskList = document.getElementById("tasks-list");
    const taskModal = new bootstrap.Modal(document.getElementById("taskModal"));
    const saveTaskBtn = document.getElementById("saveTaskBtn");

    // Open modal when clicking "Add Task"
    document.getElementById("addTask").addEventListener("click", function () {
        taskModal.show();
    });

    // Save Task
    saveTaskBtn.addEventListener("click", function () {
        const taskName = document.getElementById("taskName").value.trim();

        if (!taskName) {
            alert("Please enter a task name.");
            return;
        }

        fetch(`/work/${userId}/addTask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task: taskName, category: "work" }),
        })
            .then(response => response.json())

            .catch(error => console.error("Error:", error));
        window.location.reload();

    });

    // Delete Task Event
    function attachDeleteEvent(button) {
        button.addEventListener("click", function () {
            const taskId = this.getAttribute("data-id");

            if (confirm("Are you sure you want to delete this task?")) {
                fetch(`/work/${userId}/deleteTask/${taskId}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            this.closest("li").remove();
                        } else {
                            alert("Failed to delete task.");
                        }
                    })
                    .catch(error => console.error("Error:", error));
            }
            window.location.reload();

        });
    }
    // Attach delete event listeners to existing tasks
    document.querySelectorAll(".delete-task").forEach(attachDeleteEvent);


    function attachCheckboxEvent(checkbox) {
        checkbox.addEventListener("change", async function () {
            const taskId = this.closest("li").getAttribute("data-task-id");
            const isCompleted = this.checked;
            console.log(isCompleted)
            // Update task status
            fetch(`/work/${userId}/updateTask/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: isCompleted })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    alert("Failed to update task status.");
                    this.checked = !isCompleted; // Revert checkbox if update fails
                }
            })
            .catch(error => console.error("Error:", error));
    
            // Optionally, trigger stat update without additional data
            fetch(`/work/${userId}/updateStat`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ completed: isCompleted })

            })
            .then(response => response.json())
            .then(data => console.log('Stat updated:', data))
            .catch(error => console.error('Error:', error));
        });
    }
    
    
    // Attach event listeners to existing checkboxes
    document.querySelectorAll(".checkbox").forEach(attachCheckboxEvent);
    
    const tasksList = document.getElementById("tasks-list");

    function removeDoneTasks() {
        const tasks = tasksList.querySelectorAll('li');

        tasks.forEach(taskItem => {
            const checkbox = taskItem.querySelector('.checkbox');
            if (checkbox && checkbox.checked) {
                const taskId = taskItem.getAttribute('data-task-id');
                fetch(`/work/${userId}/deleteDoneTasks`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: taskId })
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
        window.location.reload();
    }
    document.getElementById("removeDoneTask").addEventListener("click", removeDoneTasks);
});
