CREATE DATABASE balance_your_bucks;
USE balance_your_bucks;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    security_pin VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_budget DECIMAL(10,2) NOT NULL,
    essentials_percentage DECIMAL(5,2) NOT NULL,
    personal_percentage DECIMAL(5,2) NOT NULL,
    savings_percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    payment_from VARCHAR(100) NOT NULL,
    payment_to VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category ENUM('essentials', 'personal', 'savings') NOT NULL,
    reason TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('budget_limit', 'transaction', 'financial_tip') NOT NULL,
    enabled BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(id)
);