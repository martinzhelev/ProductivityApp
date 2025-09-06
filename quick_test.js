// Quick test to identify the 500 error cause
require('dotenv').config();

console.log('🔍 Quick Configuration Test...\n');

// Test 1: Environment variables
console.log('1. Environment Variables:');
console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅' : '❌'}`);
console.log(`   STRIPE_PREMIUM_PRICE_ID: ${process.env.STRIPE_PREMIUM_PRICE_ID ? '✅' : '❌'}`);
console.log(`   DATABASE_HOST: ${process.env.DATABASE_HOST ? '✅' : '❌'}`);
console.log('');

// Test 2: Stripe connection
console.log('2. Stripe Connection:');
try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('   ✅ Stripe instance created');
    
    // Test price retrieval
    stripe.prices.retrieve(process.env.STRIPE_PREMIUM_PRICE_ID)
        .then(price => {
            console.log('   ✅ Price ID is valid');
            console.log(`   Price: ${price.unit_amount} ${price.currency}`);
        })
        .catch(err => {
            console.log('   ❌ Price ID error:', err.message);
        });
} catch (error) {
    console.log('   ❌ Stripe error:', error.message);
}

// Test 3: Database connection
console.log('3. Database Connection:');
const mysql = require('mysql2/promise');

mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
}).then(connection => {
    console.log('   ✅ Database connected');
    return connection.execute('SELECT 1 as test');
}).then(() => {
    console.log('   ✅ Database query successful');
}).catch(error => {
    console.log('   ❌ Database error:', error.message);
});
