// Stripe конфигурация
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Конфигурация на продукта
const PRODUCT_CONFIG = {
    premium: {
        price_id: process.env.STRIPE_PREMIUM_PRICE_ID,
        product_name: 'Premium Subscription',
        product_description: 'Access to all premium features',
        amount: 799 // $7.99 in cents
    }
};

// Webhook endpoint configuration
const WEBHOOK_CONFIG = {
    endpoint_secret: process.env.STRIPE_WEBHOOK_SECRET
};

module.exports = {
    stripe,
    PRODUCT_CONFIG,
    WEBHOOK_CONFIG
}; 