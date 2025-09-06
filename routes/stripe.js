const express = require('express');
const router = express.Router();
const db = require('../server');
const { stripe, PRODUCT_CONFIG, WEBHOOK_CONFIG } = require('../config/stripe');

// Middleware за проверка на потребител - изключваме webhook endpoint
router.use((req, res, next) => {
    // Webhook endpoint не се нуждае от аутентификация
    if (req.path === '/webhook') {
        return next();
    }
    
    req.userId = req.cookies.userId;
    if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized: User ID not found in cookies" });
    }
    next();
});

// Създаване на checkout session
router.post('/create-checkout-session', async (req, res) => {
    try {
        console.log('=== SUBSCRIPTION CREATION DEBUG ===');
        console.log('User ID:', req.userId);
        console.log('Stripe Secret Key exists:', !!process.env.STRIPE_SECRET_KEY);
        console.log('Price ID exists:', !!process.env.STRIPE_PREMIUM_PRICE_ID);
        console.log('Price ID value:', process.env.STRIPE_PREMIUM_PRICE_ID);
        
        // Проверка за наличието на Stripe ключовете
        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PREMIUM_PRICE_ID) {
            console.log('ERROR: Missing Stripe configuration');
            return res.status(500).json({ 
                error: 'Stripe configuration missing',
                message: 'Моля, настройте Stripe ключовете в .env файла'
            });
        }

        const userId = req.userId;
        
        // Вземаме информация за потребителя
        console.log('Fetching user data for ID:', userId);
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            console.log('ERROR: User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userRows[0];
        console.log('User found:', user.username, user.email);
        
        // Validate user email
        if (!user.email) {
            console.log('ERROR: User email is missing');
            return res.status(400).json({ error: 'User email is required for subscription' });
        }
        
        // Създаваме или намираме Stripe customer
        console.log('Creating/finding Stripe customer...');
        let customer;
        const [existingCustomerRows] = await db.execute(
            'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? AND stripe_customer_id IS NOT NULL LIMIT 1',
            [userId]
        );

        if (existingCustomerRows.length > 0) {
            console.log('Found existing customer:', existingCustomerRows[0].stripe_customer_id);
            try {
                customer = await stripe.customers.retrieve(existingCustomerRows[0].stripe_customer_id);
                console.log('Existing customer retrieved:', customer.id);
            } catch (error) {
                console.log('ERROR: Failed to retrieve existing customer:', error.message);
                console.log('Creating new customer instead...');
                customer = await stripe.customers.create({
                    email: user.email,
                    metadata: {
                        user_id: userId.toString()
                    }
                });
                console.log('New customer created:', customer.id);
            }
        } else {
            console.log('Creating new customer...');
            try {
                customer = await stripe.customers.create({
                    email: user.email,
                    metadata: {
                        user_id: userId.toString()
                    }
                });
                console.log('Customer created:', customer.id);
            } catch (error) {
                console.log('ERROR: Failed to create customer:', error.message);
                throw error;
            }
        }

        // Създаваме checkout session
        console.log('Creating checkout session with price:', PRODUCT_CONFIG.premium.price_id);
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

        console.log('Checkout session created successfully:', session.id);
        res.json({ url: session.url });
    } catch (error) {
        console.error('=== ERROR IN CHECKOUT SESSION CREATION ===');
        console.error('Error type:', error.type);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        res.status(500).json({ 
            error: 'Failed to create checkout session',
            details: error.message,
            type: error.type || 'Unknown error'
        });
    }
});

// Webhook за обработка на Stripe събития
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Headers:', req.headers);
    console.log('Body length:', req.body.length);
    
    // Проверка за наличието на webhook secret
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('STRIPE_WEBHOOK_SECRET не е настроен');
        return res.status(500).send('Webhook configuration missing');
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_CONFIG.endpoint_secret);
        console.log('Webhook signature verified successfully');
        console.log('Event type:', event.type);
        console.log('Event ID:', event.id);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        console.log('Processing webhook event:', event.type);
        switch (event.type) {
            case 'checkout.session.completed':
                console.log('Handling checkout.session.completed');
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'customer.subscription.created':
                console.log('Handling customer.subscription.created');
                await handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                console.log('Handling customer.subscription.updated');
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                console.log('Handling customer.subscription.deleted');
                await handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                console.log('Handling invoice.payment_succeeded');
                await handleInvoicePaymentSucceeded(event.data.object);
                break;
            case 'invoice.payment_failed':
                console.log('Handling invoice.payment_failed');
                await handleInvoicePaymentFailed(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        console.log('Webhook processed successfully');
        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

// Обработка на успешно завършен checkout
async function handleCheckoutSessionCompleted(session) {
    try {
        console.log('=== HANDLING CHECKOUT SESSION COMPLETED ===');
        console.log('Session ID:', session.id);
        console.log('Session metadata:', session.metadata);
        console.log('Session subscription:', session.subscription);
        
        const userId = parseInt(session.metadata.user_id);
        console.log('Processing checkout session completed for user:', userId);
        
        // Проверяваме дали има subscription в session
        if (!session.subscription) {
            console.log('No subscription found in session, waiting for subscription.created event');
            return;
        }

        console.log('Found subscription in session:', session.subscription);

        // Обновяваме статуса на потребителя
        console.log('Updating user subscription status to premium...');
        await db.execute(
            'UPDATE users SET subscription_status = ? WHERE user_id = ?',
            ['premium', userId]
        );
        console.log('User subscription status updated successfully');

        // Записваме абонамента в базата данни
        console.log('Retrieving subscription from Stripe...');
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        console.log('Subscription retrieved:', subscription.id, 'Status:', subscription.status);
        
        console.log('Inserting subscription into database...');
        await db.execute(`
            INSERT INTO subscriptions (
                user_id, stripe_subscription_id, stripe_customer_id, 
                status, plan_type, current_period_start, current_period_end
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            plan_type = VALUES(plan_type),
            current_period_start = VALUES(current_period_start),
            current_period_end = VALUES(current_period_end),
            updated_at = CURRENT_TIMESTAMP
        `, [
            userId,
            subscription.id,
            subscription.customer,
            subscription.status,
            'premium',
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000)
        ]);
        
        console.log('Checkout session completed successfully for user:', userId);
    } catch (error) {
        console.error('Error in handleCheckoutSessionCompleted:', error);
        throw error;
    }
}

// Обработка на създаден абонамент
async function handleSubscriptionCreated(subscription) {
    try {
        console.log('=== HANDLING SUBSCRIPTION CREATED ===');
        console.log('Subscription ID:', subscription.id);
        console.log('Subscription status:', subscription.status);
        console.log('Customer ID:', subscription.customer);
        
        console.log('Retrieving customer from Stripe...');
        const customer = await stripe.customers.retrieve(subscription.customer);
        console.log('Customer retrieved:', customer.id);
        console.log('Customer metadata:', customer.metadata);
        
        const userId = parseInt(customer.metadata.user_id);
        console.log('User ID from customer metadata:', userId);
        
        if (!userId) {
            console.error('No user_id found in customer metadata');
            return;
        }
        
        // Обновяваме статуса на потребителя
        console.log('Updating user subscription status to premium...');
        await db.execute(
            'UPDATE users SET subscription_status = ? WHERE user_id = ?',
            ['premium', userId]
        );
        console.log('User subscription status updated successfully');
        
        console.log('Inserting subscription into database...');
        await db.execute(`
            INSERT INTO subscriptions (
                user_id, stripe_subscription_id, stripe_customer_id, 
                status, plan_type, current_period_start, current_period_end
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            plan_type = VALUES(plan_type),
            current_period_start = VALUES(current_period_start),
            current_period_end = VALUES(current_period_end),
            updated_at = CURRENT_TIMESTAMP
        `, [
            userId,
            subscription.id,
            subscription.customer,
            subscription.status,
            'premium',
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000)
        ]);
        
        console.log('Subscription created successfully for user:', userId);
    } catch (error) {
        console.error('Error in handleSubscriptionCreated:', error);
        throw error;
    }
}

// Обработка на обновен абонамент
async function handleSubscriptionUpdated(subscription) {
    try {
        console.log('Processing subscription updated:', subscription.id, 'Status:', subscription.status);
        
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
        if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
            const [subscriptionRows] = await db.execute(
                'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
                [subscription.id]
            );
            
            if (subscriptionRows.length > 0) {
                await db.execute(
                    'UPDATE users SET subscription_status = ? WHERE user_id = ?',
                    ['free', subscriptionRows[0].user_id]
                );
                console.log('User downgraded to free plan:', subscriptionRows[0].user_id);
            }
        }
        
        console.log('Subscription updated successfully:', subscription.id);
    } catch (error) {
        console.error('Error in handleSubscriptionUpdated:', error);
        throw error;
    }
}

// Обработка на изтрит абонамент
async function handleSubscriptionDeleted(subscription) {
    try {
        console.log('Processing subscription deleted:', subscription.id);
        
        const [subscriptionRows] = await db.execute(
            'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
            [subscription.id]
        );
        
        if (subscriptionRows.length > 0) {
            await db.execute(
                'UPDATE users SET subscription_status = ? WHERE user_id = ?',
                ['free', subscriptionRows[0].user_id]
            );
            console.log('User downgraded to free plan after subscription deletion:', subscriptionRows[0].user_id);
        }
        
        console.log('Subscription deleted successfully:', subscription.id);
    } catch (error) {
        console.error('Error in handleSubscriptionDeleted:', error);
        throw error;
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
        console.log('=== SUBSCRIPTION CANCELLATION DEBUG ===');
        const userId = req.userId;
        console.log('User ID:', userId);
        
        // Намираме активния абонамент
        console.log('Searching for active subscription...');
        const [subscriptionRows] = await db.execute(
            'SELECT stripe_subscription_id, status, plan_type FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        console.log('Found subscription rows:', subscriptionRows);

        if (subscriptionRows.length === 0) {
            console.log('ERROR: No subscription found for user');
            return res.status(404).json({ error: 'No subscription found' });
        }

        const subscription = subscriptionRows[0];
        console.log('Subscription details:', subscription);

        if (!subscription.stripe_subscription_id) {
            console.log('ERROR: No Stripe subscription ID found');
            return res.status(404).json({ error: 'No Stripe subscription ID found' });
        }

        if (subscription.status !== 'active') {
            console.log('ERROR: Subscription is not active, status:', subscription.status);
            return res.status(400).json({ error: `Subscription status is: ${subscription.status}` });
        }

        const subscriptionId = subscription.stripe_subscription_id;
        console.log('Attempting to cancel Stripe subscription:', subscriptionId);
        
        // Отменяме абонамента в Stripe
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });

        console.log('Stripe subscription updated successfully:', updatedSubscription.id);
        console.log('New subscription status:', updatedSubscription.status);

        res.json({ 
            success: true, 
            message: 'Subscription will be canceled at the end of the current period',
            subscriptionId: subscriptionId,
            newStatus: updatedSubscription.status
        });
    } catch (error) {
        console.error('=== ERROR IN SUBSCRIPTION CANCELLATION ===');
        console.error('Error type:', error.type);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        
        res.status(500).json({ 
            error: 'Failed to cancel subscription',
            details: error.message,
            type: error.type || 'Unknown error'
        });
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