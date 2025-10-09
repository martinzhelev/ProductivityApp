document.addEventListener("DOMContentLoaded", function () {
    const saveEventBtn = document.getElementById("saveEventBtn");
    const prevEventPageBtn = document.getElementById("prevEventPage");
    const nextEventPageBtn = document.getElementById("nextEventPage");
    const eventPageInfo = document.getElementById("eventPageInfo");
    const eventList = document.getElementById("eventList");
    const savePersonBtn = document.getElementById("savePersonBtn");
    const prevPeoplePageBtn = document.getElementById("prevPeoplePage");
    const nextPeoplePageBtn = document.getElementById("nextPeoplePage");
    const peoplePageInfo = document.getElementById("peoplePageInfo");
    const peopleList = document.getElementById("peopleList");

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

    let eventPage = parseInt("<%= eventPage %>") || 1;
    const eventLimit = parseInt("<%= eventLimit %>") || 5;
    let peoplePage = parseInt("<%= peoplePage %>") || 1;
    const peopleLimit = parseInt("<%= peopleLimit %>") || 5;

    function applyDarkClasses(container) {
        if (!container) return;
        container.querySelectorAll('.list-group-item').forEach(el => {
            el.classList.add('glass');
        });
        container.querySelectorAll('.gift-list li').forEach(li => {
            li.classList.add('glass');
        });
    }

    // Social Events
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
            body: JSON.stringify({ date, time, eventName: eventName || "Social Event" }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("eventName").value = "";
                document.getElementById("eventDate").value = "";
                document.getElementById("eventTime").value = "";
                eventPage = 1;
                updateEventList();
            } else {
                alert(data.error || "Error saving event");
            }
        })
        .catch(error => console.error("Error saving event:", error));
    });

    function updateEventList() {
        fetch(`/social/${userId}?eventPage=${eventPage}&eventLimit=${eventLimit}&peoplePage=${peoplePage}&peopleLimit=${peopleLimit}`, { credentials: 'include' })
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            eventList.innerHTML = doc.getElementById("eventList").innerHTML;
            applyDarkClasses(eventList);
            eventPageInfo.textContent = doc.getElementById("eventPageInfo").textContent;
            prevEventPageBtn.disabled = doc.getElementById("prevEventPage").hasAttribute("disabled");
            nextEventPageBtn.disabled = doc.getElementById("nextEventPage").hasAttribute("disabled");
            addEventListeners(); // Updated to include complete listener
        })
        .catch(error => console.error("Error fetching events:", error));
    }

    function addEventListeners() {
        // Delete event listeners
        document.querySelectorAll(".delete-event").forEach(button => {
            button.addEventListener("click", function () {
                const id = this.getAttribute("data-id");
                fetch("/social/delete", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include',
                    body: JSON.stringify({ id })
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

        // Complete event listeners
        document.querySelectorAll(".complete-event").forEach(button => {
            button.addEventListener("click", function () {
                const eventId = this.getAttribute("data-id");
                fetch(`/social/${userId}/completeEvent`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include',
                    body: JSON.stringify({ eventId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updateEventList(); // Refresh list after completion
                        alert("Event marked as completed! Social stat updated.");
                    } else {
                        alert(data.message || "Error completing event");
                    }
                })
                .catch(error => console.error("Error completing event:", error));
            });
        });
    }

    prevEventPageBtn.addEventListener("click", function () {
        if (eventPage > 1) {
            eventPage--;
            updateEventList();
        }
    });

    nextEventPageBtn.addEventListener("click", function () {
        const totalPages = parseInt(eventPageInfo.textContent.split("of")[1].trim());
        if (eventPage < totalPages) {
            eventPage++;
            updateEventList();
        }
    });

    // People List
    savePersonBtn.addEventListener("click", function () {
        const name = document.getElementById("personName").value;
        const birthday = document.getElementById("personBirthday").value;
        const gift = document.getElementById("personGift").value;

        if (!name) {
            alert("Please enter a name");
            return;
        }

        fetch("/social/people/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ name, birthday, gift })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("personName").value = "";
                document.getElementById("personBirthday").value = "";
                document.getElementById("personGift").value = "";
                peoplePage = 1;
                updatePeopleList();
            } else {
                alert(data.error || "Error adding person");
            }
        })
        .catch(error => console.error("Error adding person:", error));
    });

    function updatePeopleList() {
        fetch(`/social/${userId}?eventPage=${eventPage}&eventLimit=${eventLimit}&peoplePage=${peoplePage}&peopleLimit=${peopleLimit}`, { credentials: 'include' })
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            peopleList.innerHTML = doc.getElementById("peopleList").innerHTML;
            applyDarkClasses(peopleList);
            peoplePageInfo.textContent = doc.getElementById("peoplePageInfo").textContent;
            prevPeoplePageBtn.disabled = doc.getElementById("prevPeoplePage").hasAttribute("disabled");
            nextPeoplePageBtn.disabled = doc.getElementById("nextPeoplePage").hasAttribute("disabled");
            addPeopleListeners();
        })
        .catch(error => console.error("Error fetching people:", error));
    }

    function addPeopleListeners() {
        document.querySelectorAll(".delete-person").forEach(button => {
            button.addEventListener("click", function () {
                const id = this.getAttribute("data-id");
                fetch("/social/people/delete", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include',
                    body: JSON.stringify({ id })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updatePeopleList();
                    } else {
                        alert(data.error || "Error deleting person");
                    }
                })
                .catch(error => console.error("Error deleting person:", error));
            });
        });

        document.querySelectorAll(".editable").forEach(span => {
            span.addEventListener("click", function () {
                const currentText = this.textContent;
                const field = this.getAttribute("data-field");
                const id = this.closest(".list-group-item").getAttribute("data-id");
                const input = field === "birthday" ? document.createElement("input") : document.createElement("input");
                
                if (field === "birthday") {
                    input.type = "date";
                    input.value = currentText === "Not set" ? "" : new Date(currentText.split("/").reverse().join("-")).toISOString().split("T")[0];
                } else {
                    input.type = "text";
                    input.value = currentText === "Not set" || currentText === "None" ? "" : currentText;
                }

                input.className = "form-control form-control-sm d-inline-block w-auto";
                this.replaceWith(input);
                input.focus();

                input.addEventListener("blur", function () {
                    const newValue = this.value;
                    const span = document.createElement("span");
                    span.className = "editable";
                    span.setAttribute("data-field", field);
                    span.textContent = field === "birthday" ? 
                        (newValue ? new Date(newValue).toLocaleDateString('en-GB') : "Not set") : 
                        (newValue || "Unknown");

                    this.replaceWith(span);
                    fetch("/social/people/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: 'include',
                        body: JSON.stringify({ id, [field]: newValue })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (!data.success) {
                            alert(data.error || "Error updating person");
                            updatePeopleList();
                        }
                    })
                    .catch(error => console.error("Error updating person:", error));
                    addPeopleListeners();
                });
            });
        });

        document.querySelectorAll(".add-gift-btn").forEach(button => {
            button.addEventListener("click", function () {
                const personId = this.previousElementSibling.getAttribute("data-person-id");
                const giftName = this.previousElementSibling.value.trim();

                if (!giftName) {
                    alert("Please enter a gift name");
                    return;
                }

                fetch("/social/gifts/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include',
                    body: JSON.stringify({ person_id: personId, gift_name: giftName })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.previousElementSibling.value = "";
                        updatePeopleList();
                    } else {
                        alert(data.error || "Error adding gift");
                    }
                })
                .catch(error => console.error("Error adding gift:", error));
            });
        });

        document.querySelectorAll(".delete-gift").forEach(button => {
            button.addEventListener("click", function () {
                const giftId = this.getAttribute("data-gift-id");
                fetch("/social/gifts/delete", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include',
                    body: JSON.stringify({ gift_id: giftId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updatePeopleList();
                    } else {
                        alert(data.error || "Error deleting gift");
                    }
                })
                .catch(error => console.error("Error deleting gift:", error));
            });
        });
    }

    prevPeoplePageBtn.addEventListener("click", function () {
        if (peoplePage > 1) {
            peoplePage--;
            updatePeopleList();
        }
    });

    nextPeoplePageBtn.addEventListener("click", function () {
        const totalPages = parseInt(peoplePageInfo.textContent.split("of")[1].trim());
        if (peoplePage < totalPages) {
            peoplePage++;
            updatePeopleList();
        }
    });

    // Initial setup
    addEventListeners(); // Updated name
    addPeopleListeners();
    applyDarkClasses(eventList);
    applyDarkClasses(peopleList);

    // Observe dynamic changes to keep styles consistent
    const observer = new MutationObserver(() => applyDarkClasses(peopleList));
    if (peopleList) {
        observer.observe(peopleList, { childList: true, subtree: true });
    }
});