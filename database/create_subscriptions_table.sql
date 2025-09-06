-- Create subscriptions table for Stripe integration
USE productivityapp;

-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status ENUM('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid') DEFAULT 'incomplete',
    plan_type ENUM('free', 'premium') DEFAULT 'free',
    current_period_start DATETIME,
    current_period_end DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_stripe_subscription_id (stripe_subscription_id),
    INDEX idx_status (status)
);

-- Add subscription_status column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status ENUM('free', 'premium') DEFAULT 'free';

-- Update all existing users to have 'free' status
UPDATE users SET subscription_status = 'free' WHERE subscription_status IS NULL;

-- Show the structure of the subscriptions table
DESCRIBE subscriptions;

-- Show the structure of the users table
DESCRIBE users;
