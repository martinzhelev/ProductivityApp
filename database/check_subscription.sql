-- Проверка на абонаментите в базата данни
USE productivityapp;

-- Проверяваме дали съществува абонамент за потребител 1
SELECT * FROM subscriptions WHERE user_id = 1;

-- Проверяваме статуса на потребителя
SELECT user_id, username, subscription_status FROM users WHERE user_id = 1;

-- Проверяваме всички абонаменти
SELECT * FROM subscriptions;

-- Проверяваме всички потребители и техния статус
SELECT user_id, username, subscription_status FROM users; 