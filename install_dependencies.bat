@echo off
echo Installing dependencies...
npm install

echo.
echo ========================================
echo STRIPE SETUP REQUIRED
echo ========================================
echo.
echo Please follow these steps to complete Stripe setup:
echo.
echo 1. Create a Stripe account at https://stripe.com
echo 2. Get your API keys from Stripe Dashboard
echo 3. Create a product and price in Stripe
echo 4. Set up webhooks
echo 5. Update your .env file with the keys
echo.
echo See STRIPE_SETUP.md for detailed instructions
echo.
echo ========================================
echo DATABASE SETUP REQUIRED
echo ========================================
echo.
echo Please run the database setup scripts:
echo 1. Check DATABASE_SETUP.md for instructions
echo 2. Run the SQL scripts to create subscription tables
echo.
echo ========================================
echo SETUP COMPLETE
echo ========================================
echo.
echo To start the server, run: npm run devStart
echo.
pause 