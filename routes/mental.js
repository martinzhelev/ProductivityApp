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
    const userId = req.userId;
    try {
        const [books] = await db.execute('SELECT * FROM books WHERE user_id = ?', [userId]);
        const [readingProgress] = await db.execute(
            'SELECT COALESCE(SUM(pages_read), 0) AS pages, COALESCE(SUM(minutes_read), 0) AS minutes FROM reading_progress WHERE user_id = ? AND date = CURDATE()',
            [userId]
        );
        const [meditation] = await db.execute(
            'SELECT COALESCE(SUM(minutes), 0) AS total FROM meditation WHERE user_id = ? AND date = CURDATE()',
            [userId]
        );
        res.render('mental', {
            books,
            readingProgress: readingProgress[0],
            meditationProgress: meditation[0]
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "An error occurred while fetching data." });
    }
});

// Assume you are using Express.js and MySQL
router.get('/:userId/getBooks', async (req, res) => {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    try {
        const booksQuery = `
            SELECT * FROM books
            WHERE user_id = ?
            ORDER BY book_id DESC  -- ✅ Reverse order
            LIMIT ? OFFSET ?;
        `;
        const [books] = await db.execute(booksQuery, [userId, limit, offset]);

        const countQuery = `
            SELECT COUNT(*) AS totalBooks FROM books WHERE user_id = ?;
        `;
        const [[totalResult]] = await db.execute(countQuery, [userId]);
        const totalBooks = totalResult.totalBooks;

        res.json({
            books: books,
            totalBooks: totalBooks
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching books' });
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
router.post('/:userId/saveMeditationProgress', async (req, res) => {
    const userId = req.userId;
    let { amount } = req.body;
    const date = new Date().toISOString().split('T')[0];

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid meditation minutes." });
    }

    try {
        // Check if there is an existing record for today
        const [existing] = await db.execute('SELECT * FROM meditation WHERE user_id = ? AND date = ?', [userId, date]);

        if (existing.length > 0) {
            // Update existing record
            await db.execute(
                'UPDATE meditation SET minutes = minutes + ? WHERE user_id = ? AND date = ?',
                [amount, userId, date]
            );
        } else {
            // Insert new record
            await db.execute(
                'INSERT INTO meditation (user_id, date, minutes) VALUES (?, ?, ?)',
                [userId, date, amount]
            );
        }

        res.json({ success: true, message: "Meditation progress saved." });
    } catch (error) {
        console.error("Error saving meditation progress:", error);
        res.status(500).json({ error: "An error occurred while saving meditation progress." });
    }
});


module.exports = router;
