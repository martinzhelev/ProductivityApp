// Debug script for incomplete subscription status
require('dotenv').config();

async function debugIncompleteSubscription() {
    console.log('🔍 Debugging Incomplete Subscription...\n');
    
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
        const subscriptionId = 'sub_1S4MmhHmE6ldbjuqUwS81qYG';
        const customerId = 'cus_T0NXQxo9d2KoVm';
        
        console.log('1. Checking Stripe Subscription:');
        try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            console.log('   Subscription ID:', subscription.id);
            console.log('   Status:', subscription.status);
            console.log('   Customer:', subscription.customer);
            console.log('   Current Period Start:', new Date(subscription.current_period_start * 1000));
            console.log('   Current Period End:', new Date(subscription.current_period_end * 1000));
            console.log('   Latest Invoice:', subscription.latest_invoice);
            console.log('   Payment Intent:', subscription.latest_invoice ? 'Check invoice' : 'No invoice');
            console.log('');
            
            if (subscription.latest_invoice) {
                console.log('2. Checking Latest Invoice:');
                const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
                console.log('   Invoice ID:', invoice.id);
                console.log('   Status:', invoice.status);
                console.log('   Payment Intent:', invoice.payment_intent);
                console.log('   Amount Paid:', invoice.amount_paid);
                console.log('   Amount Due:', invoice.amount_due);
                console.log('');
                
                if (invoice.payment_intent) {
                    console.log('3. Checking Payment Intent:');
                    const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
                    console.log('   Payment Intent ID:', paymentIntent.id);
                    console.log('   Status:', paymentIntent.status);
                    console.log('   Amount:', paymentIntent.amount);
                    console.log('   Currency:', paymentIntent.currency);
                    console.log('   Last Payment Error:', paymentIntent.last_payment_error);
                    console.log('');
                }
            }
        } catch (error) {
            console.log('   ❌ Error retrieving subscription from Stripe:', error.message);
        }

        console.log('4. Checking Database Subscription:');
        const [subscriptionRows] = await db.execute(
            'SELECT * FROM subscriptions WHERE stripe_subscription_id = ?',
            [subscriptionId]
        );
        
        if (subscriptionRows.length > 0) {
            const sub = subscriptionRows[0];
            console.log('   Database Status:', sub.status);
            console.log('   Plan Type:', sub.plan_type);
            console.log('   User ID:', sub.user_id);
            console.log('   Created:', sub.created_at);
            console.log('   Updated:', sub.updated_at);
        } else {
            console.log('   ❌ No subscription found in database');
        }
        console.log('');

        console.log('5. Checking User Status:');
        const [userRows] = await db.execute(
            'SELECT user_id, username, email, subscription_status FROM users WHERE user_id = ?',
            [27]
        );
        
        if (userRows.length > 0) {
            const user = userRows[0];
            console.log('   User ID:', user.user_id);
            console.log('   Username:', user.username);
            console.log('   Email:', user.email);
            console.log('   Subscription Status:', user.subscription_status);
        } else {
            console.log('   ❌ User not found');
        }
        console.log('');

        console.log('6. Checking for Payments Table:');
        try {
            const [tableRows] = await db.execute("SHOW TABLES LIKE 'payments'");
            if (tableRows.length > 0) {
                console.log('   ✅ Payments table exists');
                const [paymentRows] = await db.execute('SELECT * FROM payments WHERE user_id = ? OR subscription_id = ?', [27, subscriptionId]);
                console.log('   Payment records found:', paymentRows.length);
                if (paymentRows.length > 0) {
                    paymentRows.forEach((payment, index) => {
                        console.log(`   ${index + 1}. Payment ID: ${payment.id || 'N/A'}`);
                        console.log(`      Amount: ${payment.amount || 'N/A'}`);
                        console.log(`      Status: ${payment.status || 'N/A'}`);
                        console.log(`      Created: ${payment.created_at || 'N/A'}`);
                    });
                }
            } else {
                console.log('   ℹ️  Payments table does not exist (this might be normal)');
            }
        } catch (error) {
            console.log('   ❌ Error checking payments table:', error.message);
        }

    } catch (error) {
        console.error('❌ Error during debug:', error);
    } finally {
        await db.end();
    }
}

// Run the debug
debugIncompleteSubscription().catch(console.error);

