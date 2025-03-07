document.addEventListener("DOMContentLoaded", function () {
    const saveDailyBtn = document.getElementById("saveDailyBtn");
    const saveWeeklyBtn = document.getElementById("saveWeeklyBtn");
    const saveMonthlyBtn = document.getElementById("saveMonthlyBtn");
    const saveYearlyBtn = document.getElementById("saveYearlyBtn");
    const dailyList = document.getElementById("dailyList");
    const weeklyList = document.getElementById("weeklyList");
    const monthlyList = document.getElementById("monthlyList");
    const yearlyList = document.getElementById("yearlyList");

    const userId = window.userId;

    // Save Daily Time Off
    saveDailyBtn.addEventListener("click", function () {
        const date = document.getElementById("dailyDate").value;
        const time = document.getElementById("dailyTime").value;
        const description = document.getElementById("dailyDescription").value;

        if (!date || !time) {
            alert("Please select a date and time");
            return;
        }

        fetch("/timeoff/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ type: "day", start_date: date, end_date: date, start_time: time, description })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("dailyDate").value = "";
                document.getElementById("dailyTime").value = "";
                document.getElementById("dailyDescription").value = "";
                updateLists();
            } else {
                alert(data.error || "Error saving daily time off");
            }
        })
        .catch(error => console.error("Error saving daily time off:", error));
    });

    // Save Weekly Time Off
    saveWeeklyBtn.addEventListener("click", function () {
        const date = document.getElementById("weeklyDate").value;
        const time = document.getElementById("weeklyTime").value;
        const description = document.getElementById("weeklyDescription").value;

        if (!date) {
            alert("Please select a date");
            return;
        }

        fetch("/timeoff/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ type: "week", start_date: date, end_date: date, start_time: time || null, description })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("weeklyDate").value = "";
                document.getElementById("weeklyTime").value = "";
                document.getElementById("weeklyDescription").value = "";
                updateLists();
            } else {
                alert(data.error || "Error saving weekly time off");
            }
        })
        .catch(error => console.error("Error saving weekly time off:", error));
    });

    // Save Monthly Time Off (unchanged)
    saveMonthlyBtn.addEventListener("click", function () {
        const start = document.getElementById("monthlyStart").value;
        const end = document.getElementById("monthlyEnd").value;
        const description = document.getElementById("monthlyDescription").value;

        if (!start || !end) {
            alert("Please select start and end dates");
            return;
        }

        fetch("/timeoff/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ type: "month", start_date: start, end_date: end, description })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("monthlyStart").value = "";
                document.getElementById("monthlyEnd").value = "";
                document.getElementById("monthlyDescription").value = "";
                updateLists();
            } else {
                alert(data.error || "Error saving monthly time off");
            }
        })
        .catch(error => console.error("Error saving monthly time off:", error));
    });

    // Save Yearly Time Off (unchanged)
    saveYearlyBtn.addEventListener("click", function () {
        const start = document.getElementById("yearlyStart").value;
        const end = document.getElementById("yearlyEnd").value;
        const description = document.getElementById("yearlyDescription").value;

        if (!start || !end) {
            alert("Please select start and end dates");
            return;
        }

        fetch("/timeoff/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ type: "year", start_date: start, end_date: end, description })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("yearlyStart").value = "";
                document.getElementById("yearlyEnd").value = "";
                document.getElementById("yearlyDescription").value = "";
                updateLists();
            } else {
                alert(data.error || "Error saving yearly time off");
            }
        })
        .catch(error => console.error("Error saving yearly time off:", error));
    });

    function updateLists() {
        fetch(`/timeoff/${userId}`, { credentials: 'include' })
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            dailyList.innerHTML = doc.getElementById("dailyList").innerHTML;
            weeklyList.innerHTML = doc.getElementById("weeklyList").innerHTML;
            monthlyList.innerHTML = doc.getElementById("monthlyList").innerHTML;
            yearlyList.innerHTML = doc.getElementById("yearlyList").innerHTML;
            addDeleteListeners();
        })
        .catch(error => console.error("Error fetching time off lists:", error));
    }

    function addDeleteListeners() {
        document.querySelectorAll(".delete-timeoff").forEach(button => {
            button.addEventListener("click", function () {
                const id = this.getAttribute("data-id");
                fetch("/timeoff/delete", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include',
                    body: JSON.stringify({ id })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updateLists();
                    } else {
                        alert(data.error || "Error deleting time off");
                    }
                })
                .catch(error => console.error("Error deleting time off:", error));
            });
        });
    }

    // Initial setup
    addDeleteListeners();
});