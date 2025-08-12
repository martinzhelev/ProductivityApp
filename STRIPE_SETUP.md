# Stripe Integration Setup Instructions

## 📋 Преглед
Този документ описва как да настроите Stripe интеграцията за системата за абонаменти.

## 🔧 Стъпки за настройка

### 1. Инсталиране на зависимости
```bash
npm install stripe
```

### 2. Създаване на Stripe акаунт
1. Отидете на [stripe.com](https://stripe.com)
2. Създайте нов акаунт
3. Активирайте тестовия режим (Test Mode)

### 3. Конфигуриране на Stripe Dashboard

#### Създаване на продукт и цена:
1. В Stripe Dashboard отидете на **Products**
2. Създайте нов продукт:
   - **Name**: Premium Subscription
   - **Description**: Access to all premium features
3. Добавете цена:
   - **Pricing model**: Recurring
   - **Billing period**: Monthly
   - **Price**: $9.99 (или желаната сума)
   - **Currency**: USD
4. Запишете **Price ID** (започва с `price_`)

#### Настройка на Webhook:
1. В Stripe Dashboard отидете на **Developers > Webhooks**
2. Добавете endpoint:
   - **URL**: `https://yourdomain.com/stripe/webhook`
   - **Events to send**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. Запишете **Webhook Secret** (започва с `whsec_`)

### 4. Конфигуриране на .env файл
Създайте `.env` файл в root директорията:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_NAME=productivityapp

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here
```

### 5. Изпълнение на SQL скрипта
Изпълнете SQL скрипта от `database/subscriptions_table.sql` в MySQL:

```sql
-- Създаване на таблица за абонаменти
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status ENUM('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing', 'paused') DEFAULT 'active',
    plan_type ENUM('free', 'premium') DEFAULT 'free',
    current_period_start DATETIME,
    current_period_end DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_stripe_subscription_id (stripe_subscription_id),
    INDEX idx_status (status)
);

-- Добавяне на колона за абонамент статус в users таблицата
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status ENUM('free', 'premium') DEFAULT 'free';

-- Създаване на таблица за плащания
CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    subscription_id BIGINT UNSIGNED,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('succeeded', 'pending', 'failed', 'canceled') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_stripe_payment_intent_id (stripe_payment_intent_id)
);
```

### 6. Тестване на интеграцията

#### Локално тестване:
1. Стартирайте сървъра: `npm run devStart`
2. Отидете на `/subscribe/{userId}`
3. Тествайте плащане с тестови карти:
   - **Успешно плащане**: `4242 4242 4242 4242`
   - **Неуспешно плащане**: `4000 0000 0000 0002`

#### Webhook тестване:
1. Използвайте [ngrok](https://ngrok.com) за локално тестване
2. Стартирайте ngrok: `ngrok http 3000`
3. Обновете webhook URL в Stripe Dashboard
4. Тествайте webhook събития

## 🔐 Безопасност

### Production настройки:
1. Превключете към Live режим в Stripe
2. Обновете всички ключове с live версии
3. Настройте SSL сертификат
4. Конфигурирайте firewall правила

### Важни бележки:
- Никога не споделяйте secret ключовете
- Използвайте HTTPS в production
- Регулярно обновявайте зависимости
- Мониторирайте webhook събития

## 🚀 Функционалности

### За безплатни потребители:
- ✅ Доступ до Home Dashboard
- ❌ Ограничен достъп до други модули

### За премиум потребители:
- ✅ Пълен достъп до всички модули
- ✅ Неограничено проследяване
- ✅ Приоритетна поддръжка
- ✅ Експорт на данни
- ✅ Разширени анализи

## 🔧 Troubleshooting

### Често срещани проблеми:

1. **Webhook не работи**:
   - Проверете URL адреса
   - Проверете webhook secret
   - Проверете SSL сертификата

2. **Плащане не се обработва**:
   - Проверете Stripe ключовете
   - Проверете price ID
   - Проверете database връзката

3. **Middleware грешки**:
   - Проверете database структурата
   - Проверете user_id в cookies
   - Проверете subscription статуса

### Логове за дебъгване:
```javascript
// Добавете в routes/stripe.js
console.log('Webhook received:', event.type);
console.log('Subscription data:', event.data.object);
```

## 📞 Поддръжка

За допълнителна помощ:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- GitHub Issues: [създайте issue в репозиторията] 