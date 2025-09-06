// Debug script for subscription creation - run this on your production server
require('dotenv').config();

async function debugSubscriptionCreation() {
    console.log('🔍 Debugging Subscription Creation...\n');
    
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
        const userId = 26; // Your current user ID from the logs
        
        console.log('1. Environment Variables Check:');
        console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
        console.log(`   STRIPE_PREMIUM_PRICE_ID: ${process.env.STRIPE_PREMIUM_PRICE_ID ? '✅ Set' : '❌ Missing'}`);
        if (process.env.STRIPE_PREMIUM_PRICE_ID) {
            console.log(`   Price ID: ${process.env.STRIPE_PREMIUM_PRICE_ID}`);
        }
        console.log('');

        console.log('2. Database Connection Test:');
        const [testRows] = await db.execute('SELECT 1 as test');
        console.log('   ✅ Database connection successful');
        console.log('');

        console.log('3. User Check:');
        const [userRows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (userRows.length === 0) {
            console.log('   ❌ User not found in database');
            return;
        }
        
        const user = userRows[0];
        console.log('   ✅ User found:');
        console.log(`   - ID: ${user.user_id}`);
        console.log(`   - Username: ${user.username}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Subscription Status: ${user.subscription_status}`);
        console.log('');

        console.log('4. Existing Customer Check:');
        const [existingCustomerRows] = await db.execute(
            'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? AND stripe_customer_id IS NOT NULL LIMIT 1',
            [userId]
        );
        
        if (existingCustomerRows.length > 0) {
            console.log('   ✅ Existing customer found:', existingCustomerRows[0].stripe_customer_id);
        } else {
            console.log('   ℹ️  No existing customer - will create new one');
        }
        console.log('');

        console.log('5. Stripe Connection Test:');
        try {
            const account = await stripe.accounts.retrieve();
            console.log('   ✅ Stripe connection successful');
            console.log(`   Account ID: ${account.id}`);
            console.log(`   Account type: ${account.type}`);
        } catch (error) {
            console.log('   ❌ Stripe connection failed:', error.message);
            return;
        }
        console.log('');

        console.log('6. Price ID Test:');
        if (process.env.STRIPE_PREMIUM_PRICE_ID) {
            try {
                const price = await stripe.prices.retrieve(process.env.STRIPE_PREMIUM_PRICE_ID);
                console.log('   ✅ Price ID is valid');
                console.log(`   Price ID: ${price.id}`);
                console.log(`   Amount: ${price.unit_amount} ${price.currency}`);
                console.log(`   Active: ${price.active}`);
                console.log(`   Type: ${price.type}`);
            } catch (error) {
                console.log('   ❌ Price ID error:', error.message);
                console.log(`   Error type: ${error.type}`);
                return;
            }
        } else {
            console.log('   ❌ No price ID configured');
            return;
        }
        console.log('');

        console.log('7. Customer Creation Test:');
        try {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    user_id: userId.toString()
                }
            });
            console.log('   ✅ Customer creation successful');
            console.log(`   Customer ID: ${customer.id}`);
            console.log(`   Email: ${customer.email}`);
        } catch (error) {
            console.log('   ❌ Customer creation failed:', error.message);
            console.log(`   Error type: ${error.type}`);
        }
        console.log('');

        console.log('8. Checkout Session Test:');
        try {
            const session = await stripe.checkout.sessions.create({
                customer: 'cus_test', // This will fail but shows if the API call structure is correct
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: process.env.STRIPE_PREMIUM_PRICE_ID,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: 'https://amblezio.com/subscribe/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url: 'https://amblezio.com/subscribe/cancel',
                metadata: {
                    user_id: userId.toString()
                }
            });
            console.log('   ✅ Checkout session creation successful');
        } catch (error) {
            console.log('   ❌ Checkout session creation failed:', error.message);
            console.log(`   Error type: ${error.type}`);
            console.log(`   Error code: ${error.code}`);
        }

    } catch (error) {
        console.error('❌ Error during debug:', error);
    } finally {
        await db.end();
    }
}

// Run the debug
debugSubscriptionCreation().catch(console.error);
