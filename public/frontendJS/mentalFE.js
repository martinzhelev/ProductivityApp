document.addEventListener("DOMContentLoaded", function () {
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
    const userId = getCookie("userId");

    let currentPage = 1;
    const booksPerPage = 5; // Adjust the number of books per page

    // Function to render books
    function renderBooks(books) {
        const bookListContainer = document.getElementById("bookList");
        bookListContainer.innerHTML = ""; // Clear the current list

        books.forEach(book => {
            const bookDiv = document.createElement("div");
            bookDiv.classList.add("border", "p-3", "mb-3");
            bookDiv.id = `book-${book.book_id}`;
            bookDiv.innerHTML = `
                <h4>${book.title}</h4>
                ${!book.completed ? `<input type="checkbox" class="markAsRead" data-id="${book.book_id}"> Mark as Read` : ''}
                ${book.completed ? `<button class="btn btn-info btn-sm info-btn" data-id="${book.book_id}" data-title="${book.title}" data-summary="${book.summary}" data-review="${book.review}">Info</button>` : ''}
            `;
            bookListContainer.appendChild(bookDiv);
        });
    }

    // Function to render pagination
    function renderPagination(totalBooks) {
        const totalPages = Math.ceil(totalBooks / booksPerPage);

        let paginationContainer = document.getElementById("pagination");
    
        if (!paginationContainer) {
            console.error("Pagination container not found!");
            return;
        }
    
        console.log("Total Books:", totalBooks);
        console.log("Total Pages:", totalPages);
        console.log("Current Page:", currentPage);
    
        paginationContainer.innerHTML = ""; // Clear current pagination
    
        // Create previous page button
        const prevButton = document.createElement("button");
        prevButton.textContent = "Previous";
        prevButton.classList.add("btn", "btn-secondary", "me-2");
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                loadBooks();
            }
        });
        paginationContainer.appendChild(prevButton);
    
        // Create next page button
        const nextButton = document.createElement("button");
        nextButton.textContent = "Next";
        nextButton.classList.add("btn", "btn-secondary");
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadBooks();
            }
        });
        paginationContainer.appendChild(nextButton);
    }
    
    // Load books for the current page
    async function loadBooks() {
        try {


            // here the /getBooks makes the markAsComplete not work
            //also cant find the pagination container


            const response = await fetch(`/mental/${userId}/getBooks?page=${currentPage}&limit=${booksPerPage}`);
            const data = await response.json();

            renderBooks(data.books);
            renderPagination(data.totalBooks); // Assuming the API response includes totalBooks for pagination
        } catch (error) {
            console.error("Error loading books:", error);
        }
    }

    // Initial load of books
    loadBooks();

    // Add book form submission
    document.getElementById("addBookForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        let title = document.getElementById("bookTitle").value;

        try {
            await fetch(`/mental/${userId}/addBook`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });
            window.location.reload();
        } catch (error) {
            console.error("Error adding book:", error);
        }
    });

    // Event listener for book info buttons
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("info-btn")) {
            console.log("Info button clicked!", event.target.dataset.title); // Debugging log
            let title = event.target.dataset.title;
            let summary = event.target.dataset.summary;
            let review = event.target.dataset.review;
            openModal(title, summary, review);
        }
    });

    // Mark book as read and open review modal
    document.getElementById("bookList").addEventListener("change", async function (event) {
        if (event.target.classList.contains("markAsRead")) {
            let bookId = event.target.dataset.id;
            openReviewModal(bookId);

    

            let bookDiv = document.getElementById(`book-${bookId}`);

            try {
                await fetch(`/mental/${userId}/markAsRead`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bookId }),
                });

                // Remove the checkbox
                this.remove();
            } catch (error) {
                console.error("Error marking book as read:", error);
            }
        }
    });

    // Save review when "Save" button is clicked
    document.getElementById("saveReview").addEventListener("click", async function () {
        let summary = document.getElementById("inputBookSummary").value;
        let review = document.getElementById("inputBookReview").value;
        let bookId = document.getElementById("reviewBookId").value; // ✅ Corrected bookId retrieval

        try {
            await fetch(`/mental/${userId}/updateBook`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookId, review, summary }),
            });

            // Close the modal after saving
            let modal = bootstrap.Modal.getInstance(document.getElementById("bookReviewModal"));
            modal.hide();

            window.location.reload(); // Reload to update UI
        } catch (error) {
            console.error("Error updating book:", error);
        }
    });

    // Open book info modal
    function openModal(title, summary, review) {
        document.getElementById("modalBookTitle").innerText = title;
        document.getElementById("modalBookSummary").innerText = summary;
        document.getElementById("modalBookReview").innerText = review;

        let modal = new bootstrap.Modal(document.getElementById("bookInfoModal"));
        modal.show();
    }

    // Open review modal
    function openReviewModal(bookId) {
        document.getElementById("reviewBookId").value = bookId;
        let modal = new bootstrap.Modal(document.getElementById("bookReviewModal"));
        modal.show();
    }

    document.getElementById("saveProgress").addEventListener("click", async ()=>{
        let type = document.getElementById("progressType").value;
        let amount = document.getElementById("progressAmount").value

        try {
            await fetch(`/mental/${userId}/saveProgress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, amount }),
            });

        } catch (error) {
            console.error("Error updating progress:", error);
        }
        window.location.reload(); // Reload to update UI
    })

    document.getElementById("saveMeditationProgress").addEventListener("click", async ()=>{
        let amount = document.getElementById("meditationProgressAmount").value

        try {
            await fetch(`/mental/${userId}/saveMeditationProgress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });

        } catch (error) {
            console.error("Error updating progress:", error);
        }
        window.location.reload(); // Reload to update UI
    })
});
