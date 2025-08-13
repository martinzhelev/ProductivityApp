# Quick Setup Guide

## ✅ What's Been Updated

### 1. **Payment Integration**
- ✅ Stripe subscription system fully integrated
- ✅ Webhook handling for subscription events
- ✅ Subscription management (cancel/reactivate)
- ✅ Database integration for subscription tracking

### 2. **Navigation Updates**
- ✅ Payments page added to all navigation menus
- ✅ Consistent menu structure across all pages
- ✅ Easy access to subscription management

### 3. **Access Control**
- ✅ Free users redirected to payments page when accessing premium features
- ✅ Premium users have full access to all modules
- ✅ Clear messaging about subscription requirements

## 🚀 How It Works

### For Free Users:
1. Can access Home Dashboard
2. When trying to access any other module (Body, Mental, Work, etc.), they're automatically redirected to the Payments page
3. See a clear message explaining they need premium to access the feature
4. Can upgrade to premium via Stripe

### For Premium Users:
1. Full access to all modules
2. Can manage their subscription (cancel/reactivate)
3. Subscription status displayed on payments page

## 🔧 Setup Required

### 1. **Environment Variables**
Add to your `.env` file:
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PREMIUM_PRICE_ID=price_your_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. **Database Setup**
Run the database setup scripts from `DATABASE_SETUP.md` to create:
- `subscriptions` table
- `payments` table
- `subscription_status` column in `users` table

### 3. **Stripe Configuration**
Follow `STRIPE_SETUP.md` for complete Stripe setup instructions.

## 🎯 Testing

### Test Free User Flow:
1. Login with a free user account
2. Try to access any module other than Home
3. Should be redirected to Payments page with upgrade message

### Test Premium User Flow:
1. Login with a premium user account
2. Should have access to all modules
3. Can manage subscription on Payments page

### Test Stripe Integration:
1. Use test card: `4242 4242 4242 4242`
2. Complete subscription process
3. Verify webhook events are received
4. Check database for subscription records

## 📱 Pages Updated

All pages now include the Payments link in their navigation:
- ✅ Home Dashboard
- ✅ Body/Workout Tracker
- ✅ Mental Health Tracker
- ✅ Work Deadlines
- ✅ Social Events
- ✅ Time Off Scheduler
- ✅ Calorie Tracker
- ✅ Profile

## 🔄 Middleware Changes

- **New**: `redirectFreeUsers` middleware
- **Updated**: All premium routes now use redirect instead of blocking
- **Improved**: Better error handling and user experience

## 🎨 UI Improvements

- Consistent navigation across all pages
- Clear subscription status indicators
- Better messaging for free users
- Professional payment flow

## 🚨 Important Notes

1. **Webhook URL**: Update your Stripe webhook endpoint to: `https://yourdomain.com/stripe/webhook`
2. **Test Mode**: Use Stripe test mode for development
3. **Database**: Ensure all tables are created before testing
4. **Environment**: Make sure all environment variables are set

## 🆘 Troubleshooting

### Common Issues:
1. **Redirect not working**: Check middleware is properly imported
2. **Stripe errors**: Verify API keys and webhook configuration
3. **Database errors**: Ensure all tables exist and have correct structure
4. **Menu not showing**: Check if userId is being passed correctly

### Debug Steps:
1. Check server logs for middleware errors
2. Verify Stripe webhook events are being received
3. Test database connections
4. Check environment variables are loaded

## 📞 Support

For issues or questions:
1. Check the logs for error messages
2. Verify all setup steps are completed
3. Test with Stripe test mode first
4. Ensure database is properly configured 