# Subscription System Fix Guide

## Issues Found and Fixed

### 1. Missing .env File ✅ FIXED
**Problem**: The application requires environment variables for Stripe integration but no .env file exists.

**Solution**: Create a `.env` file in the root directory with the following content:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=NULL
DATABASE_NAME=productivityapp

# JWT Secret
JWT_SECRET=your_jwt_secret_here_change_this_in_production_12345

# Stripe Configuration
# Replace these with your actual Stripe keys from https://stripe.com
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here

# Server Configuration
PORT=3000
```

### 2. Hardcoded Database Credentials ✅ FIXED
**Problem**: Database connection details were hardcoded in server.js.

**Solution**: Updated server.js to use environment variables with fallback values.

### 3. Missing Subscriptions Table ✅ FIXED
**Problem**: The database might not have the required subscriptions table.

**Solution**: Created `database/create_subscriptions_table.sql` script to create the necessary table structure.

### 4. Stripe Configuration Issues ✅ FIXED
**Problem**: Missing environment variables would cause Stripe operations to fail.

**Solution**: Added error handling and warnings for missing Stripe configuration.

## Setup Instructions

### Step 1: Create .env File
Create a `.env` file in your project root with the content shown above.

### Step 2: Get Stripe Keys
1. Go to [stripe.com](https://stripe.com) and create an account
2. Switch to **Test mode** for development
3. Go to **Developers > API keys**
4. Copy your **Publishable key** and **Secret key**
5. Replace the placeholder values in your .env file

### Step 3: Create Stripe Product and Price
1. In Stripe Dashboard, go to **Products**
2. Click **Add product**
3. Set product name: "Premium Subscription"
4. Set price to $7.99/month (or your desired price)
5. Copy the **Price ID** (starts with `price_`)
6. Replace `price_your_premium_price_id_here` in your .env file

### Step 4: Set Up Webhooks
1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL to: `http://localhost:3000/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)
6. Replace `whsec_your_webhook_secret_here` in your .env file

### Step 5: Create Database Tables
Run the SQL script to create the subscriptions table:

```bash
mysql -u root -p productivityapp < database/create_subscriptions_table.sql
```

Or manually execute the SQL commands in your MySQL client.

### Step 6: Test the Setup
1. Start your server: `npm run devStart`
2. Check the console for any warning messages about missing Stripe keys
3. Navigate to the subscription page
4. Try to create a checkout session

## Testing with Stripe Test Cards

Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)

## Troubleshooting

### Common Issues:

1. **"Stripe configuration missing" error**
   - Check that all Stripe keys are properly set in .env file
   - Restart the server after updating .env

2. **Database connection errors**
   - Verify MySQL is running
   - Check database credentials in .env file
   - Ensure the `productivityapp` database exists

3. **Webhook signature verification failed**
   - Verify the webhook secret is correct
   - Ensure webhook endpoint URL is accessible
   - Check that webhook events are properly configured

4. **Subscription not updating**
   - Check webhook events are being received
   - Verify database connection and table structure
   - Check server logs for errors

### For Local Development:
Use Stripe CLI for local webhook testing:
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/stripe/webhook
```

## Security Notes

- Never commit your .env file to version control
- Use test keys for development, live keys for production
- Always verify webhook signatures
- Use HTTPS in production
- Regularly rotate your API keys

## Next Steps

After completing the setup:
1. Test the complete subscription flow
2. Verify webhook events are processed correctly
3. Test subscription cancellation and reactivation
4. Deploy to production with live Stripe keys
