@echo off
echo Creating .env file for Productivity App...
echo.

REM Create .env file with default values
(
echo # Database Configuration
echo DATABASE_HOST=localhost
echo DATABASE_USER=root
echo DATABASE_PASSWORD=NULL
echo DATABASE_NAME=productivityapp
echo.
echo # JWT Secret
echo JWT_SECRET=your_jwt_secret_here_change_this_in_production_12345
echo.
echo # Stripe Configuration
echo # Replace these with your actual Stripe keys from https://stripe.com
echo STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
echo STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
echo STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
echo STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here
echo.
echo # Server Configuration
echo PORT=3000
) > .env

echo .env file created successfully!
echo.
echo IMPORTANT: You need to replace the placeholder values with your actual Stripe keys:
echo.
echo 1. Go to https://stripe.com and create an account
echo 2. Get your API keys from Developers ^> API keys
echo 3. Create a product and get the Price ID
echo 4. Set up webhooks and get the webhook secret
echo 5. Replace the placeholder values in the .env file
echo.
echo See SUBSCRIPTION_FIX_GUIDE.md for detailed instructions.
echo.
pause
