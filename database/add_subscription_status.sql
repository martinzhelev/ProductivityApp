-- Добавяне на subscription_status колона в users таблицата
USE productivityapp;

-- Добавяне на колоната ако не съществува
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status ENUM('free', 'premium') DEFAULT 'free';

-- Проверка дали колоната е добавена
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'subscription_status';

-- Обновяване на всички съществуващи потребители да са 'free'
UPDATE users SET subscription_status = 'free' WHERE subscription_status IS NULL;

-- Проверка на резултата
SELECT user_id, username, subscription_status FROM users LIMIT 5; 