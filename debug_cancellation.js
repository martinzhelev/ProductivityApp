// Debug script for subscription cancellation
require('dotenv').config();

async function debugCancellation() {
    console.log('🔍 Debugging Subscription Cancellation...\n');
    
    const mysql = require('mysql2/promise');
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Database connection
    const db = mysql.createPool({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        waitForConnections: true,
        connectionLimit: 0,
        queueLimit: 0,
    });

    try {
        const userId = 12; // Your user ID from the logs
        
        console.log('1. Checking user subscription in database:');
        const [subscriptionRows] = await db.execute(
            'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (subscriptionRows.length === 0) {
            console.log('   ❌ No subscription found in database');
            return;
        }

        const subscription = subscriptionRows[0];
        console.log('   ✅ Subscription found:');
        console.log(`   - ID: ${subscription.id}`);
        console.log(`   - User ID: ${subscription.user_id}`);
        console.log(`   - Stripe Subscription ID: ${subscription.stripe_subscription_id}`);
        console.log(`   - Status: ${subscription.status}`);
        console.log(`   - Plan Type: ${subscription.plan_type}`);
        console.log(`   - Created: ${subscription.created_at}`);
        console.log('');

        console.log('2. Testing Stripe subscription retrieval:');
        if (subscription.stripe_subscription_id) {
            try {
                const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
                console.log('   ✅ Stripe subscription retrieved:');
                console.log(`   - ID: ${stripeSubscription.id}`);
                console.log(`   - Status: ${stripeSubscription.status}`);
                console.log(`   - Customer: ${stripeSubscription.customer}`);
                console.log(`   - Current Period End: ${new Date(stripeSubscription.current_period_end * 1000)}`);
                console.log(`   - Cancel at Period End: ${stripeSubscription.cancel_at_period_end}`);
                console.log('');

                console.log('3. Testing subscription update (dry run):');
                console.log('   This would update the subscription to cancel at period end');
                console.log('   (Not actually updating - just showing what would happen)');
                
            } catch (error) {
                console.log('   ❌ Error retrieving Stripe subscription:', error.message);
                console.log(`   Error type: ${error.type}`);
            }
        } else {
            console.log('   ❌ No Stripe subscription ID found');
        }

        console.log('4. Checking user status:');
        const [userRows] = await db.execute(
            'SELECT user_id, username, email, subscription_status FROM users WHERE user_id = ?',
            [userId]
        );

        if (userRows.length > 0) {
            const user = userRows[0];
            console.log('   ✅ User found:');
            console.log(`   - ID: ${user.user_id}`);
            console.log(`   - Username: ${user.username}`);
            console.log(`   - Email: ${user.email}`);
            console.log(`   - Subscription Status: ${user.subscription_status}`);
        } else {
            console.log('   ❌ User not found');
        }

    } catch (error) {
        console.error('❌ Error during debug:', error);
    } finally {
        await db.end();
    }
}

// Run the debug
debugCancellation().catch(console.error);
