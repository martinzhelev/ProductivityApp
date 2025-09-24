const express = require("express");
const router = express.Router();
const db = require("../server");
const { checkSubscriptionStatus } = require("../middleware/subscriptionMiddleware");

// Middleware за проверка на потребител - изключваме cancel страницата
router.use((req, res, next) => {
    // Cancel страницата не се нуждае от аутентификация
    if (req.path === '/cancel') {
        return next();
    }
    
    req.userId = req.cookies.userId;
    if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized: User ID not found in cookies" });
    }
    next();
});

// Добавяме middleware за проверка на абонамент статуса - само за основните страници
router.use((req, res, next) => {
    if (req.path === '/cancel') {
        return next();
    }
    return checkSubscriptionStatus(req, res, next);
});

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.userId;
        const { hasPremium, planType } = req.subscriptionStatus;
        
        // Simplified: no special handling of payment success query params

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
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false
        };

        if (subscriptionRows.length > 0) {
            const subscription = subscriptionRows[0];
            const isActive = subscription.status === 'active' && subscription.plan_type === 'premium';
            const isCanceled = subscription.status === 'canceled';
            const hasTimeLeft = subscription.current_period_end && new Date(subscription.current_period_end) > new Date();
            
            subscriptionInfo = {
                hasSubscription: isActive || (isCanceled && hasTimeLeft),
                planType: subscription.plan_type || 'free',
                status: subscription.status || 'free',
                currentPeriodEnd: subscription.current_period_end,
                cancelAtPeriodEnd: isCanceled && hasTimeLeft
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

// Success page - DEPRECATED: Now handled directly in the main subscribe route
// router.get("/success", async (req, res) => {
//     // This route is no longer used as we redirect directly to /subscribe/{userId}?payment=success
// });

// Cancel page
router.get("/cancel", async (req, res) => {
    try {
        console.log('Cancel page accessed');
        
        // Try to get user from cookies if available
        const userId = req.cookies.userId;
        
        if (userId) {
            const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
            if (userRows.length > 0) {
                return res.render("subscribe-cancel", {
                    username: userRows[0].username,
                    userId: userId
                });
            }
        }

        // Fallback: render cancel page without user-specific info
        console.log('Rendering generic cancel page');
        res.render("subscribe-cancel", {
            username: 'User',
            userId: null
        });
    } catch (error) {
        console.error('Error in cancel route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;