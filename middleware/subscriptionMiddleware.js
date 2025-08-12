const db = require('../server');

// Middleware за проверка дали потребителят има премиум абонамент
const requirePremium = async (req, res, next) => {
    try {
        // Проверяваме userId от различни места
        const userId = req.userId || req.user?.user_id || req.cookies.userId || req.params.userId;
        
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: User ID not found" });
        }

        console.log('Checking premium access for user:', userId);

        // Проверяваме статуса на абонамента
        const [subscriptionRows] = await db.execute(`
            SELECT s.status, s.plan_type
            FROM subscriptions s 
            WHERE s.user_id = ? 
            ORDER BY s.created_at DESC 
            LIMIT 1
        `, [userId]);

        let hasPremium = false;
        
        if (subscriptionRows.length > 0) {
            const subscription = subscriptionRows[0];
            console.log('Found subscription:', subscription);
            
            // Проверяваме дали има активен премиум абонамент
            if (subscription.plan_type === 'premium' && subscription.status === 'active') {
                hasPremium = true;
                console.log('Premium access granted');
            }
        }

        if (!hasPremium) {
            console.log('Premium access denied for user:', userId);
            return res.status(403).json({ 
                error: "Premium subscription required",
                message: "Трябва да имате премиум абонамент за достъп до тази функция"
            });
        }

        next();
    } catch (error) {
        console.error('Subscription middleware error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Middleware за проверка на абонамент статуса (връща информация без да блокира)
const checkSubscriptionStatus = async (req, res, next) => {
    try {
        // Проверяваме userId от различни места
        const userId = req.userId || req.user?.user_id || req.cookies.userId || req.params.userId;
        
        if (!userId) {
            req.subscriptionStatus = { hasPremium: false, planType: 'free' };
            return next();
        }

        // Проверяваме статуса на абонамента
        const [subscriptionRows] = await db.execute(`
            SELECT s.status, s.plan_type
            FROM subscriptions s 
            WHERE s.user_id = ? 
            ORDER BY s.created_at DESC 
            LIMIT 1
        `, [userId]);

        let hasPremium = false;
        let planType = 'free';
        
        if (subscriptionRows.length > 0) {
            const subscription = subscriptionRows[0];
            
            if (subscription.plan_type === 'premium' && subscription.status === 'active') {
                hasPremium = true;
                planType = 'premium';
            }
        }

        req.subscriptionStatus = { hasPremium, planType };
        next();
    } catch (error) {
        console.error('Subscription status check error:', error);
        req.subscriptionStatus = { hasPremium: false, planType: 'free' };
        next();
    }
};

module.exports = {
    requirePremium,
    checkSubscriptionStatus
}; 