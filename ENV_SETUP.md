# Настройка на .env файл

## Създайте .env файл в root директорията на проекта със следното съдържание:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_NAME=productivityapp

# JWT Secret
JWT_SECRET=your_jwt_secret_here_change_this_in_production

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here
```

## За да получите Stripe ключовете:

1. Отидете на [stripe.com](https://stripe.com) и създайте акаунт
2. В Dashboard отидете на **Developers > API keys**
3. Копирайте **Publishable key** и **Secret key**
4. Заменете `sk_test_your_stripe_secret_key_here` с вашия Secret key
5. Заменете `pk_test_your_stripe_publishable_key_here` с вашия Publishable key

## За да получите Price ID:

1. В Stripe Dashboard отидете на **Products**
2. Създайте нов продукт "Premium Subscription"
3. Добавете цена (например $9.99/месец)
4. Копирайте Price ID (започва с `price_`)
5. Заменете `price_your_premium_price_id_here` с вашия Price ID

## За да получите Webhook Secret:

1. В Stripe Dashboard отидете на **Developers > Webhooks**
2. Добавете endpoint: `https://yourdomain.com/stripe/webhook`
3. Изберете събитията за изпращане
4. Копирайте Webhook Secret (започва с `whsec_`)
5. Заменете `whsec_your_webhook_secret_here` с вашия Webhook Secret 