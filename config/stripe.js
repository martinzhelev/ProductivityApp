// Stripe конфигурация
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Конфигурация на продукта
const PRODUCT_CONFIG = {
    price_id: process.env.STRIPE_PRICE_ID || 'price_your_price_id_here', // Ще получите това от Stripe Dashboard
    product_name: 'Premium Subscription',
    product_description: 'Access to all premium features'
};

module.exports = {
    stripe,
    PRODUCT_CONFIG
}; 