const express = require('express');
const router = express.Router();
const db = require('../server'); // Database connection

// Middleware to get userId from cookies
router.use((req, res, next) => {
    req.userId = req.cookies.userId;
    if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized: User ID not found in cookies" });
    }
    next();
});

// Fetch books, reading progress, and meditation progress
router.get('/:userId', async (req, res) => {
    const userId = req.userId;  // Ensure you're getting userId from the URL
    const { page = 1, limit = 5 } = req.query;  // Set default values for pagination if not provided

    try {
        // Fetch books with pagination
        const [books] = await db.execute(
            'SELECT * FROM books WHERE user_id = ? LIMIT ? OFFSET ?',
            [userId, limit, (page - 1) * limit]
        );

        // Fetch total number of books for pagination
        const [totalBooks] = await db.execute('SELECT COUNT(*) AS total FROM books WHERE user_id = ?', [userId]);
        const totalPages = Math.ceil(totalBooks[0].total / limit);  // Calculate total pages

        // Fetch reading progress for the user today
        const [readingProgress] = await db.execute(
            'SELECT COALESCE(SUM(pages_read), 0) AS pages, COALESCE(SUM(minutes_read), 0) AS minutes FROM reading_progress WHERE user_id = ? AND date = CURDATE()',
            [userId]
        );

        // Fetch meditation progress for the user today
        const [meditation] = await db.execute(
            'SELECT COALESCE(SUM(minutes), 0) AS total FROM meditation WHERE user_id = ? AND date = CURDATE()',
            [userId]
        );

        // Render the 'mental' template with the fetched data and pagination info
        res.render('mental', {
            books,
            readingProgress: readingProgress[0],  // Ensure we are passing the first row of data
            meditationCounter: meditation[0].total,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "An error occurred while fetching data." });
    }
});





// Add a new book
router.post('/:userId/addBook', async (req, res) => {
    const userId = req.userId;
    let { title, summary = "", review = "" } = req.body;
    if (!title) return res.status(400).json({ error: "Book title is required" });
    try {
        await db.execute('INSERT INTO books (user_id, title, summary, review) VALUES (?, ?, ?, ?)', [userId, title, summary, review]);
        res.status(201).json({ success: true, message: "Book added successfully." });
    } catch (error) {
        console.error("Error adding book:", error);
        res.status(500).json({ error: "An error occurred while adding the book." });
    }
});

// Edit a book
router.put('/:userId/updateBook', async (req, res) => {
    const userId = req.userId;
    const { bookId, summary, review } = req.body;
    if (!bookId) return res.status(400).json({ error: "Book ID is required." });
    try {
        await db.execute('UPDATE books SET summary = ?, review = ?, completed = 1 WHERE user_id = ? AND book_id = ?', [summary, review, userId, bookId]);
        res.json({ success: true, message: "Book updated successfully." });
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ error: "An error occurred while updating the book." });
    }
});

// Mark as read
router.put('/:userId/markAsRead', async (req, res) => {
    const userId = req.userId;
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ error: "Book ID is required." });
    try {
        await db.execute('UPDATE books SET completed = 1 WHERE user_id = ? AND book_id = ?', [userId, bookId]);
        res.json({ success: true, message: "Book marked as read." });
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ error: "An error occurred while marking the book as read." });
    }
});

// Delete a book
router.delete('/:userId/deleteBook', async (req, res) => {
    const userId = req.userId;
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ error: "Book ID is required." });
    try {
        await db.execute('DELETE FROM books WHERE user_id = ? AND book_id = ?', [userId, bookId]);
        res.json({ success: true, message: "Book deleted successfully." });
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({ error: "An error occurred while deleting the book." });
    }
});

// Save reading progress
router.post('/:userId/saveProgress', async (req, res) => {
    const userId = req.userId;
    let { type, amount } = req.body;
    const date = new Date().toISOString().split('T')[0];
    if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ error: "Invalid progress amount." });
    type = type === "pages" ? "pages_read" : "minutes_read";
    try {
        const [existing] = await db.execute('SELECT * FROM reading_progress WHERE user_id = ? AND date = ?', [userId, date]);
        if (existing.length > 0) {
            await db.execute(`UPDATE reading_progress SET ${type} = ${type} + ? WHERE user_id = ? AND date = ?`, [amount, userId, date]);
        } else {
            await db.execute(`INSERT INTO reading_progress (user_id, date, ${type}) VALUES (?, ?, ?)`, [userId, date, amount]);
        }
        res.json({ success: true, message: "Reading progress saved." });
    } catch (error) {
        console.error("Error saving reading progress:", error);
        res.status(500).json({ error: "An error occurred while saving reading progress." });
    }
});

// Add meditation progress
router.post('/:userId/addMeditation', async (req, res) => {
    const userId = req.userId;
    const { minutes } = req.body;
    const date = new Date().toISOString().split('T')[0];
    if (!minutes || isNaN(minutes) || minutes <= 0) return res.status(400).json({ error: "Invalid meditation minutes." });
    try {
        await db.execute('INSERT INTO meditation (user_id, date, minutes) VALUES (?, ?, ?)', [userId, date, minutes]);
        res.status(201).json({ success: true, message: "Meditation progress saved." });
    } catch (error) {
        console.error("Error saving meditation progress:", error);
        res.status(500).json({ error: "An error occurred while saving meditation progress." });
    }
});

module.exports = router;
