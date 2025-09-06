# Your Subscription Logic - Complete Flow

## 🔄 **Complete Subscription Flow**

### **1. User Access Control (Middleware)**
```
User tries to access premium feature → redirectFreeUsers middleware → Check subscription status
```

**Files involved:**
- `middleware/subscriptionMiddleware.js` - `redirectFreeUsers` function
- `server.js` - Routes protected with `redirectFreeUsers`

**Logic:**
1. Check if user has active premium subscription
2. If NO → Redirect to `/subscribe/{userId}?redirected=true`
3. If YES → Allow access

### **2. Subscription Page Display**
```
User visits /subscribe/{userId} → subscribe.js route → Check subscription status → Render page
```

**Files involved:**
- `routes/subscribe.js` - Main subscription route
- `views/subscribe.ejs` - Subscription page template

**Logic:**
1. Get user data from database
2. Check subscription status using `checkSubscriptionStatus` middleware
3. Render appropriate UI based on subscription status

### **3. Subscription Creation Process**
```
User clicks "Subscribe" → Frontend calls /stripe/create-checkout-session → Stripe checkout
```

**Files involved:**
- `views/subscribe.ejs` - Frontend JavaScript
- `routes/stripe.js` - `/create-checkout-session` endpoint

**Step-by-step process:**
1. **User Authentication Check**
   - Verify user ID from cookies
   - Check if user exists in database

2. **Stripe Customer Creation/Retrieval**
   - Check if user already has Stripe customer
   - If NO → Create new Stripe customer
   - If YES → Retrieve existing customer

3. **Checkout Session Creation**
   - Create Stripe checkout session
   - Set success/cancel URLs
   - Add user metadata

4. **Redirect to Stripe**
   - Return checkout URL to frontend
   - Frontend redirects user to Stripe

### **4. Payment Processing (Stripe)**
```
User completes payment → Stripe processes → Webhooks sent to your server
```

**Webhook Events:**
- `checkout.session.completed` - Payment successful
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription status changed
- `customer.subscription.deleted` - Subscription canceled

### **5. Webhook Processing**
```
Stripe sends webhook → /stripe/webhook endpoint → Process event → Update database
```

**Files involved:**
- `routes/stripe.js` - Webhook endpoint and handlers

**Webhook Handlers:**
1. **`handleCheckoutSessionCompleted`**
   - Update user status to 'premium'
   - Create subscription record in database

2. **`handleSubscriptionCreated`**
   - Ensure subscription record exists
   - Update user status to 'premium'

3. **`handleSubscriptionUpdated`**
   - Update subscription status
   - Handle cancellations

4. **`handleSubscriptionDeleted`**
   - Downgrade user to 'free'

### **6. Subscription Management**
```
User manages subscription → Frontend calls /stripe/cancel-subscription → Update Stripe → Webhook updates database
```

**Files involved:**
- `views/subscribe.ejs` - Frontend buttons
- `routes/stripe.js` - Cancel/reactivate endpoints

**Logic:**
1. Find user's active subscription
2. Update subscription in Stripe
3. Webhook automatically updates database

## 🗄️ **Database Structure**

### **Users Table:**
```sql
- user_id (PRIMARY KEY)
- username
- email
- subscription_status (ENUM: 'free', 'premium')
```

### **Subscriptions Table:**
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- stripe_subscription_id (UNIQUE)
- stripe_customer_id
- status (ENUM: 'active', 'canceled', etc.)
- plan_type (ENUM: 'free', 'premium')
- current_period_start
- current_period_end
- created_at
- updated_at
```

## 🔍 **Manual Debugging Steps**

### **1. Check User Authentication**
```sql
SELECT user_id, username, email, subscription_status 
FROM users 
WHERE user_id = [YOUR_USER_ID];
```

### **2. Check Subscription Status**
```sql
SELECT * FROM subscriptions 
WHERE user_id = [YOUR_USER_ID] 
ORDER BY created_at DESC 
LIMIT 1;
```

### **3. Check Stripe Customer**
```sql
SELECT stripe_customer_id FROM subscriptions 
WHERE user_id = [YOUR_USER_ID] 
AND stripe_customer_id IS NOT NULL;
```

### **4. Test Stripe API**
```javascript
// Test price retrieval
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const price = await stripe.prices.retrieve(process.env.STRIPE_PREMIUM_PRICE_ID);
console.log(price);
```

### **5. Check Webhook Events**
- Go to Stripe Dashboard → Webhooks
- Check if events are being sent
- Look for failed webhook deliveries

## 🚨 **Common Failure Points**

### **1. User Authentication**
- User ID not in cookies
- Session expired
- User not found in database

### **2. Stripe Configuration**
- Invalid price ID
- Price not active
- Wrong API keys

### **3. Database Issues**
- Missing tables
- Connection problems
- User not found

### **4. Webhook Issues**
- Webhook endpoint not accessible
- Wrong webhook secret
- Events not configured

### **5. Frontend Issues**
- JavaScript errors
- Network connectivity
- CORS issues

## 🎯 **Debugging Checklist**

1. **Check server logs** for error messages
2. **Verify user exists** in database
3. **Test Stripe connection** with your keys
4. **Check webhook configuration** in Stripe Dashboard
5. **Verify database tables** exist and have data
6. **Test subscription creation** step by step
7. **Check webhook events** are being received

## 📋 **Key Files to Check**

- `routes/stripe.js` - Main Stripe logic
- `routes/subscribe.js` - Subscription page logic
- `middleware/subscriptionMiddleware.js` - Access control
- `views/subscribe.ejs` - Frontend interface
- `server.js` - Route configuration
- `.env` - Environment variables
- Database tables - Data integrity
