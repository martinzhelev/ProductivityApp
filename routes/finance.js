const express = require("express");
const router = express.Router();
const db = require("../server");

// Ensure userId is present from JWT middleware
router.use((req, res, next) => {
    req.userId = req.user?.userId;
    if (!req.userId) return res.status(401).json({ error: "Unauthorized: User ID not found" });
    next();
});

// GET /:userId - Finance dashboard with logs and simple stats
router.get('/:userId', async (req, res) => {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    try {
        const [userRows] = await db.execute('SELECT username FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });

        // Aggregate stats for current month
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // 1-based
        const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;

        const [monthStats] = await db.execute(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
             FROM finance_logs
             WHERE user_id = ? AND DATE_FORMAT(log_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')`,
            [userId, monthStart]
        ).catch(() => [[{ income: 0, expense: 0 }]]);

        // Recent logs, most recent first
        const [logs] = await db.execute(
            `SELECT id, type, amount, category, note, log_date, created_at
             FROM finance_logs
             WHERE user_id = ?
             ORDER BY log_date DESC, created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        ).catch(() => [[]]);

        const [[{ totalCount } = { totalCount: 0 }]] = await db.execute(
            `SELECT COUNT(*) AS totalCount FROM finance_logs WHERE user_id = ?`,
            [userId]
        ).catch(() => [[{ totalCount: 0 }]]);

        const totalPages = Math.max(1, Math.ceil(totalCount / limit));

        res.render('finance', {
            username: userRows[0].username,
            userId,
            page,
            totalPages,
            logs,
            monthIncome: monthStats[0]?.income || 0,
            monthExpense: monthStats[0]?.expense || 0
        });
    } catch (err) {
        console.error('Finance GET error:', err);
        res.status(500).json({ message: 'Failed to load finance data' });
    }
});

// POST /:userId/add - Add finance log
router.post('/:userId/add', async (req, res) => {
    const userId = req.userId;
    const { type, amount, category = 'General', note = '', date } = req.body;

    if (!['income', 'expense'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const logDate = date || new Date().toISOString().split('T')[0];

    try {
        await db.execute(
            `INSERT INTO finance_logs (user_id, type, amount, category, note, log_date, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [userId, type, numericAmount, category, note, logDate]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Finance add error:', err);
        res.status(500).json({ message: 'Failed to add log' });
    }
});

// DELETE /:userId/delete - Delete a finance log by id
router.delete('/:userId/delete', async (req, res) => {
    const userId = req.userId;
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'Missing id' });
    try {
        await db.execute('DELETE FROM finance_logs WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Finance delete error:', err);
        res.status(500).json({ message: 'Failed to delete log' });
    }
});

module.exports = router;


