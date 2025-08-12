# Настройка на базата данни за абонаменти

## Стъпки за създаване на таблиците:

### 1. Отворете MySQL командния ред или phpMyAdmin

### 2. Изберете вашата база данни:
```sql
USE productivityapp;
```

### 3. Първо проверете структурата на users таблицата:
```sql
DESCRIBE users;
```

### 4. Изпълнете коригирания SQL скрипт от `database/create_subscriptions_table_fixed.sql`:

```sql
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

### 5. Ако горният скрипт не работи, използвайте алтернативния скрипт от `database/create_subscriptions_table_alternative.sql`:

```sql
-- Проверка на структурата на users таблицата
DESCRIBE users;

-- Проверка дали user_id колоната съществува
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'user_id';

-- Ако user_id не съществува, създаваме я
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY FIRST;

-- Създаване на таблица за абонаменти (без Foreign Key)
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

-- Добавяне на колона за абонамент статус в users таблицата
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status ENUM('free', 'premium') DEFAULT 'free';

-- Създаване на таблица за плащания (без Foreign Key)
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
```

### 6. Проверете дали таблиците са създадени:
```sql
SHOW TABLES;
DESCRIBE subscriptions;
DESCRIBE payments;
DESCRIBE users;
```

### 7. Проверете дали колоната subscription_status е добавена в users таблицата:
```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'subscription_status';
```

## Алтернативно изпълнение с файл:

Ако имате достъп до командния ред:

```bash
mysql -u root -p productivityapp < database/create_subscriptions_table_fixed.sql
```

## Проверка на структурата:

След изпълнение на скрипта, трябва да имате следните таблици:
- `subscriptions` - за съхранение на абонаменти
- `payments` - за съхранение на плащания
- `users` - обновена с колона `subscription_status`

## 🔧 Troubleshooting:

### Ако получавате Foreign Key грешки:
1. Проверете дали `users` таблицата има `user_id` колона
2. Проверете дали `user_id` е от тип `BIGINT UNSIGNED`
3. Използвайте алтернативния скрипт без Foreign Keys
4. Добавете Foreign Keys ръчно след създаване на таблиците 