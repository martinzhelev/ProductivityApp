document.addEventListener("DOMContentLoaded", function () {
    const saveEventBtn = document.getElementById("saveEventBtn");
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");
    const eventList = document.getElementById("eventList");
    
    function getCookie(name) {
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.split("=");
            if (cookieName === name) {
                return decodeURIComponent(cookieValue);
            }
        }
        return null;
    }
    const userId = getCookie("userId") || window.userId;

    let currentPage = parseInt("<%= currentPage %>") || 1;
    const limit = parseInt("<%= limit %>") || 5;

    saveEventBtn.addEventListener("click", function () {
        const eventName = document.getElementById("eventName").value;
        const date = document.getElementById("eventDate").value;
        const time = document.getElementById("eventTime").value;

        if (!date || !time) {
            alert("Please select both date and time");
            return;
        }

        fetch("/social/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ 
                date, 
                time, 
                eventName: eventName || "Social Event" 
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("eventName").value = "";
                document.getElementById("eventDate").value = "";
                document.getElementById("eventTime").value = "";
                currentPage = 1; // Show newest events
                updateEventList();
            } else {
                alert(data.error);
            }
        })
        .catch(error => console.error("Error saving event:", error));
    });

    function updateEventList() {
        fetch(`/social/${userId}?page=${currentPage}&limit=${limit}`, {
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newEventList = doc.getElementById("eventList").innerHTML;
            const newPageInfo = doc.getElementById("pageInfo").textContent;
            const newPrevDisabled = doc.getElementById("prevPage").hasAttribute("disabled");
            const newNextDisabled = doc.getElementById("nextPage").hasAttribute("disabled");

            eventList.innerHTML = newEventList;
            pageInfo.textContent = newPageInfo;
            prevPageBtn.disabled = newPrevDisabled;
            nextPageBtn.disabled = newNextDisabled;

            addDeleteListeners();
        })
        .catch(error => console.error("Error fetching events:", error));
    }

    function addDeleteListeners() {
        document.querySelectorAll(".delete-event").forEach(button => {
            button.addEventListener("click", function () {
                const id = this.getAttribute("data-id"); // Use id instead of date
                fetch("/social/delete", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include',
                    body: JSON.stringify({ id }) // Send id instead of date
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updateEventList();
                    } else {
                        alert(data.error || "Error deleting event");
                    }
                })
                .catch(error => console.error("Error deleting event:", error));
            });
        });
    }

    prevPageBtn.addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            updateEventList();
        }
    });

    nextPageBtn.addEventListener("click", function () {
        const totalPages = parseInt(pageInfo.textContent.split("of")[1].trim());
        if (currentPage < totalPages) {
            currentPage++;
            updateEventList();
        }
    });

    addDeleteListeners();
});