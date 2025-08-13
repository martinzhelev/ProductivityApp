const express = require('express');
const router = express.Router();
const db = require('../server');
const { stripe, PRODUCT_CONFIG, WEBHOOK_CONFIG } = require('../config/stripe');

// Middleware за проверка на потребител
router.use((req, res, next) => {
    req.userId = req.cookies.userId;
    if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized: User ID not found in cookies" });
    }
    next();
});

// Създаване на checkout session
router.post('/create-checkout-session', async (req, res) => {
    try {
        const userId = req.userId;
        
        // Вземаме информация за потребителя
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userRows[0];
        
        // Създаваме или намираме Stripe customer
        let customer;
        const [existingCustomerRows] = await db.execute(
            'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? AND stripe_customer_id IS NOT NULL LIMIT 1',
            [userId]
        );

        if (existingCustomerRows.length > 0) {
            customer = await stripe.customers.retrieve(existingCustomerRows[0].stripe_customer_id);
        } else {
            customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    user_id: userId.toString()
                }
            });
        }

        // Създаваме checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: PRODUCT_CONFIG.premium.price_id,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.protocol}://${req.get('host')}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/subscribe/cancel`,
            metadata: {
                user_id: userId.toString()
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Webhook за обработка на Stripe събития
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_CONFIG.endpoint_secret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

// Обработка на успешно завършен checkout
async function handleCheckoutSessionCompleted(session) {
    const userId = parseInt(session.metadata.user_id);
    
    // Обновяваме статуса на потребителя
    await db.execute(
        'UPDATE users SET subscription_status = ? WHERE user_id = ?',
        ['premium', userId]
    );

    // Записваме абонамента в базата данни
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    await db.execute(`
        INSERT INTO subscriptions (
            user_id, stripe_subscription_id, stripe_customer_id, 
            status, plan_type, current_period_start, current_period_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
        userId,
        subscription.id,
        subscription.customer,
        subscription.status,
        'premium',
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000)
    ]);
}

// Обработка на създаден абонамент
async function handleSubscriptionCreated(subscription) {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = parseInt(customer.metadata.user_id);
    
    await db.execute(`
        INSERT INTO subscriptions (
            user_id, stripe_subscription_id, stripe_customer_id, 
            status, plan_type, current_period_start, current_period_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        plan_type = VALUES(plan_type),
        current_period_start = VALUES(current_period_start),
        current_period_end = VALUES(current_period_end)
    `, [
        userId,
        subscription.id,
        subscription.customer,
        subscription.status,
        'premium',
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000)
    ]);
}

// Обработка на обновен абонамент
async function handleSubscriptionUpdated(subscription) {
    await db.execute(`
        UPDATE subscriptions 
        SET status = ?, 
            current_period_start = ?, 
            current_period_end = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription_id = ?
    `, [
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.id
    ]);

    // Ако абонаментът е отменен, връщаме потребителя към безплатен план
    if (subscription.status === 'canceled') {
        const [subscriptionRows] = await db.execute(
            'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
            [subscription.id]
        );
        
        if (subscriptionRows.length > 0) {
            await db.execute(
                'UPDATE users SET subscription_status = ? WHERE user_id = ?',
                ['free', subscriptionRows[0].user_id]
            );
        }
    }
}

// Обработка на изтрит абонамент
async function handleSubscriptionDeleted(subscription) {
    const [subscriptionRows] = await db.execute(
        'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
        [subscription.id]
    );
    
    if (subscriptionRows.length > 0) {
        await db.execute(
            'UPDATE users SET subscription_status = ? WHERE user_id = ?',
            ['free', subscriptionRows[0].user_id]
        );
    }
}

// Обработка на успешно плащане
async function handleInvoicePaymentSucceeded(invoice) {
    // Можем да добавим допълнителна логика тук
    console.log('Payment succeeded for invoice:', invoice.id);
}

// Обработка на неуспешно плащане
async function handleInvoicePaymentFailed(invoice) {
    console.log('Payment failed for invoice:', invoice.id);
}

// Отменяне на абонамент
router.post('/cancel-subscription', async (req, res) => {
    try {
        const userId = req.userId;
        
        // Намираме активния абонамент
        const [subscriptionRows] = await db.execute(
            'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (subscriptionRows.length === 0) {
            return res.status(404).json({ error: 'No active subscription found' });
        }

        const subscriptionId = subscriptionRows[0].stripe_subscription_id;
        
        // Отменяме абонамента в Stripe
        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });

        res.json({ success: true, message: 'Subscription will be canceled at the end of the current period' });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// Reactivate subscription
router.post('/reactivate-subscription', async (req, res) => {
    try {
        const userId = req.userId;
        
        // Намираме абонамента
        const [subscriptionRows] = await db.execute(
            'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (subscriptionRows.length === 0) {
            return res.status(404).json({ error: 'No subscription found' });
        }

        const subscriptionId = subscriptionRows[0].stripe_subscription_id;
        
        // Reactivate абонамента в Stripe
        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false
        });

        res.json({ success: true, message: 'Subscription reactivated successfully' });
    } catch (error) {
        console.error('Error reactivating subscription:', error);
        res.status(500).json({ error: 'Failed to reactivate subscription' });
    }
});

// Вземане на информация за абонамент
router.get('/subscription-info', async (req, res) => {
    try {
        const userId = req.userId;
        
        const [subscriptionRows] = await db.execute(`
            SELECT s.*, u.subscription_status 
            FROM subscriptions s 
            RIGHT JOIN users u ON s.user_id = u.user_id 
            WHERE u.user_id = ? 
            ORDER BY s.created_at DESC 
            LIMIT 1
        `, [userId]);

        if (subscriptionRows.length === 0) {
            return res.json({ 
                hasSubscription: false, 
                planType: 'free',
                status: 'free'
            });
        }

        const subscription = subscriptionRows[0];
        const hasActiveSubscription = subscription.status === 'active' && 
                                   subscription.plan_type === 'premium' && 
                                   subscription.subscription_status === 'premium';

        res.json({
            hasSubscription: hasActiveSubscription,
            planType: subscription.plan_type || 'free',
            status: subscription.status || 'free',
            currentPeriodEnd: subscription.current_period_end
        });
    } catch (error) {
        console.error('Error getting subscription info:', error);
        res.status(500).json({ error: 'Failed to get subscription info' });
    }
});

module.exports = router; 