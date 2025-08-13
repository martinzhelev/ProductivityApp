# Stripe Setup Guide

## Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete the account verification process
3. Switch to test mode for development

## Step 2: Get Your API Keys

1. In your Stripe Dashboard, go to **Developers > API keys**
2. Copy your **Publishable key** and **Secret key**
3. Keep these keys secure and never commit them to version control

## Step 3: Create a Product and Price

1. Go to **Products** in your Stripe Dashboard
2. Click **Add product**
3. Set product name: "Premium Subscription"
4. Set price to $9.99/month (or your desired price)
5. Copy the **Price ID** (starts with `price_`)

## Step 4: Set Up Webhooks

1. Go to **Developers > Webhooks** in your Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/stripe/webhook`
   - For local development: `http://localhost:3000/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 5: Environment Variables

Add these variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PREMIUM_PRICE_ID=price_your_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Other existing variables...
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_NAME=productivityapp
JWT_SECRET=your_jwt_secret
```

## Step 6: Test the Integration

1. Start your server: `npm run devStart`
2. Navigate to the subscription page
3. Click "Subscribe via Stripe"
4. Use Stripe's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Expiry: Any future date
   - CVC: Any 3 digits

## Step 7: Production Deployment

When deploying to production:

1. Switch to **Live mode** in Stripe Dashboard
2. Update your environment variables with live keys
3. Update webhook endpoint URL to your production domain
4. Test the complete flow with real cards

## Troubleshooting

### Common Issues:

1. **Webhook signature verification failed**
   - Check that `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook endpoint URL is accessible

2. **Price ID not found**
   - Verify `STRIPE_PREMIUM_PRICE_ID` is correct
   - Ensure the price is active in Stripe Dashboard

3. **Subscription not updating**
   - Check webhook events are being received
   - Verify database connection and table structure

### Testing Webhooks Locally:

Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/stripe/webhook

# This will give you a webhook secret to use locally
```

## Security Notes

- Never expose your secret keys in client-side code
- Always verify webhook signatures
- Use HTTPS in production
- Regularly rotate your API keys
- Monitor webhook events for suspicious activity 