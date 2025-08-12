const express = require("express");
const router = express.Router();
const db = require("../server");
const { checkSubscriptionStatus } = require("../middleware/subscriptionMiddleware");

router.use((req, res, next) => {
    req.userId = req.cookies.userId;
    if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized: User ID not found in cookies" });
    }
    next();
});

// Добавяме middleware за проверка на абонамент статуса
router.use(checkSubscriptionStatus);

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.userId;
        const { hasPremium, planType } = req.subscriptionStatus;

        // Fetch user details
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Вземаме информация за абонамента
        const [subscriptionRows] = await db.execute(`
            SELECT s.*
            FROM subscriptions s 
            WHERE s.user_id = ? 
            ORDER BY s.created_at DESC 
            LIMIT 1
        `, [userId]);

        let subscriptionInfo = {
            hasSubscription: hasPremium,
            planType: planType,
            status: 'free',
            currentPeriodEnd: null
        };

        if (subscriptionRows.length > 0) {
            const subscription = subscriptionRows[0];
            subscriptionInfo = {
                hasSubscription: hasPremium,
                planType: subscription.plan_type || 'free',
                status: subscription.status || 'free',
                currentPeriodEnd: subscription.current_period_end
            };
        }

        res.render("subscribe", {
            username: userRows[0].username,
            userId: userId,
            subscriptionInfo: subscriptionInfo
        });
    } catch (error) {
        console.error('Error in subscribe route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Success page
router.get("/success", async (req, res) => {
    try {
        const userId = req.userId;
        const sessionId = req.query.session_id;

        if (!sessionId) {
            return res.redirect(`/subscribe/${userId}`);
        }

        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.render("subscribe-success", {
            username: userRows[0].username,
            userId: userId,
            sessionId: sessionId
        });
    } catch (error) {
        console.error('Error in success route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cancel page
router.get("/cancel", async (req, res) => {
    try {
        const userId = req.userId;

        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.render("subscribe-cancel", {
            username: userRows[0].username,
            userId: userId
        });
    } catch (error) {
        console.error('Error in cancel route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;