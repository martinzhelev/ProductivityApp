# Webhook Debug Guide

## 🚨 **Current Issue:**
Payments go through successfully in Stripe, but users remain on the free plan. This means the webhook isn't working properly.

## 🔍 **Debug Steps:**

### **Step 1: Upload Enhanced Backend**
Upload the updated `routes/stripe.js` file with comprehensive webhook debugging.

### **Step 2: Check Webhook Configuration**
1. Go to your Stripe Dashboard
2. Navigate to **Developers > Webhooks**
3. Check if your webhook endpoint is configured:
   - **URL**: `https://amblezio.com/stripe/webhook`
   - **Events**: Make sure these events are selected:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

### **Step 3: Test Webhook**
1. Make a test payment
2. Check your server console logs for webhook messages
3. Look for these debug messages:

```
=== WEBHOOK RECEIVED ===
Headers: {...}
Body length: 1234
Webhook signature verified successfully
Event type: checkout.session.completed
Event ID: evt_...
Processing webhook event: checkout.session.completed
Handling checkout.session.completed
=== HANDLING CHECKOUT SESSION COMPLETED ===
Session ID: cs_...
Session metadata: {...}
Session subscription: sub_...
Processing checkout session completed for user: 26
Found subscription in session: sub_...
Updating user subscription status to premium...
User subscription status updated successfully
Retrieving subscription from Stripe...
Subscription retrieved: sub_... Status: active
Inserting subscription into database...
Checkout session completed successfully for user: 26
Webhook processed successfully
```

### **Step 4: Check Webhook Logs in Stripe**
1. Go to Stripe Dashboard > Developers > Webhooks
2. Click on your webhook endpoint
3. Check the **Recent deliveries** tab
4. Look for failed webhook calls (red status)
5. Click on failed webhooks to see error details

## 🎯 **Common Issues & Solutions:**

### **1. Webhook Not Being Called**
- **Cause**: Webhook URL not configured in Stripe
- **Solution**: Add webhook endpoint in Stripe Dashboard

### **2. Webhook Signature Verification Failed**
- **Cause**: Wrong webhook secret or endpoint secret
- **Solution**: Check `STRIPE_WEBHOOK_SECRET` in your `.env` file

### **3. Webhook Returns 500 Error**
- **Cause**: Database connection issues or code errors
- **Solution**: Check server console logs for specific errors

### **4. Webhook Processes But User Not Updated**
- **Cause**: Database update fails or user not found
- **Solution**: Check database connection and user data

### **5. Webhook Processes But Subscription Not Created**
- **Cause**: Subscription table issues or duplicate key conflicts
- **Solution**: Check subscription table structure and data

## 🔧 **Quick Fixes to Try:**

### **1. Verify Webhook Secret**
Make sure your `.env` file has:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **2. Check Webhook URL**
Ensure your webhook URL is accessible:
```
https://amblezio.com/stripe/webhook
```

### **3. Test Webhook Manually**
Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:3000/stripe/webhook
```

### **4. Check Database Connection**
Make sure your database is accessible and the `subscriptions` table exists.

## 📋 **Files to Upload:**

1. **`routes/stripe.js`** - Enhanced with webhook debugging
2. **`WEBHOOK_DEBUG_GUIDE.md`** - This debug guide

## 📞 **Next Steps:**

1. Upload the enhanced `routes/stripe.js`
2. Make a test payment
3. Check server console logs for webhook debug messages
4. Share the console output with me
5. I'll help you fix the specific webhook issue

## 🚨 **Important Notes:**

- Webhooks are called by Stripe, not by your app
- Webhooks must return a 200 status code
- Webhook failures are logged in Stripe Dashboard
- Test webhooks in Stripe Dashboard to verify they work

The enhanced logging will show exactly where the webhook process fails!
