# 🚀 Бързи инструкции за настройка на Stripe интеграция

## 📋 Стъпки за настройка:

### 1. Инсталиране на зависимости
```bash
npm install stripe
```

### 2. Създаване на .env файл
Създайте файл `.env` в root директорията със следното съдържание:

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

### 3. Настройка на Stripe акаунт
1. Отидете на [stripe.com](https://stripe.com) и създайте акаунт
2. В Dashboard отидете на **Developers > API keys**
3. Копирайте **Publishable key** и **Secret key**
4. Заменете стойностите в .env файла

### 4. Създаване на продукт в Stripe
1. В Stripe Dashboard отидете на **Products**
2. Създайте нов продукт "Premium Subscription"
3. Добавете цена (например $9.99/месец)
4. Копирайте Price ID и го добавете в .env файла

### 5. Настройка на Webhook
1. В Stripe Dashboard отидете на **Developers > Webhooks**
2. Добавете endpoint: `https://yourdomain.com/stripe/webhook`
3. Изберете събитията:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Копирайте Webhook Secret и го добавете в .env файла

### 6. Създаване на таблици в базата данни
Изпълнете SQL скрипта от `database/create_subscriptions_table_fixed.sql` в MySQL:

```sql
USE productivityapp;

-- Проверка на структурата на users таблицата
DESCRIBE users;

-- Създаване на таблица за абонаменти (без Foreign Key първо)
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
    INDEX idx_user_id (user_id),
    INDEX idx_stripe_subscription_id (stripe_subscription_id),
    INDEX idx_status (status)
);

-- Добавяне на Foreign Key след създаване на таблицата
ALTER TABLE subscriptions 
ADD CONSTRAINT fk_subscriptions_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Добавяне на колона за абонамент статус в users таблицата
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status ENUM('free', 'premium') DEFAULT 'free';

-- Създаване на таблица за плащания (без Foreign Key първо)
CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    subscription_id BIGINT UNSIGNED,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('succeeded', 'pending', 'failed', 'canceled') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_stripe_payment_intent_id (stripe_payment_intent_id)
);

-- Добавяне на Foreign Keys за payments таблицата
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_user_id 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_subscription_id 
FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE SET NULL;
```

### 7. Стартиране на приложението
```bash
npm run devStart
```

### 8. Тестване
1. Отидете на `/subscribe/{userId}`
2. Тествайте плащане с тестови карти:
   - **Успешно плащане**: `4242 4242 4242 4242`
   - **Неуспешно плащане**: `4000 0000 0000 0002`

## 🔧 Функционалности

### За безплатни потребители:
- ✅ Доступ до Home Dashboard
- ❌ Ограничен достъп до други модули

### За премиум потребители:
- ✅ Пълен достъп до всички модули
- ✅ Неограничено проследяване
- ✅ Приоритетна поддръжка
- ✅ Експорт на данни
- ✅ Разширени анализи

## 🚨 Важни бележки:
- Никога не споделяйте secret ключовете
- Използвайте HTTPS в production
- Регулярно обновявайте зависимости
- Мониторирайте webhook събития

## 🔧 Troubleshooting:

### Ако получавате Foreign Key грешки:
1. Проверете дали `users` таблицата има `user_id` колона
2. Проверете дали `user_id` е от тип `BIGINT UNSIGNED`
3. Използвайте алтернативния скрипт от `database/create_subscriptions_table_alternative.sql`
4. Добавете Foreign Keys ръчно след създаване на таблиците 