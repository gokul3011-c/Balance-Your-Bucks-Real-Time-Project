const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Gokul@2005', // Replace with your actual MySQL root password
    database: 'balance_your_bucks'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const verified = jwt.verify(token, 'your_jwt_secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// User Routes
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password, securityPin } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPin = await bcrypt.hash(securityPin, 10);

        const query = 'INSERT INTO users (username, email, password, security_pin) VALUES (?, ?, ?, ?)';
        db.query(query, [username, email, hashedPassword, hashedPin], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: 'User created successfully' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/signin', async (req, res) => {
    try {
        const { username, password, securityPin } = req.body;
        const query = 'SELECT * FROM users WHERE username = ?';
        
        db.query(query, [username], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (results.length === 0) return res.status(400).json({ error: 'User not found' });

            const user = results[0];
            const validPassword = await bcrypt.compare(password, user.password);
            const validPin = await bcrypt.compare(securityPin, user.security_pin);

            if (!validPassword || !validPin) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ id: user.id }, 'your_jwt_secret');
            res.json({ token, username: user.username });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Budget Routes
app.post('/api/budget', verifyToken, (req, res) => {
    const { totalBudget, essentialsPercentage, personalPercentage, savingsPercentage } = req.body;
    const query = 'INSERT INTO budgets (user_id, total_budget, essentials_percentage, personal_percentage, savings_percentage) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [req.user.id, totalBudget, essentialsPercentage, personalPercentage, savingsPercentage], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ message: 'Budget created successfully' });
    });
});

app.get('/api/budget', verifyToken, (req, res) => {
    const query = 'SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
    
    db.query(query, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results[0] || {});
    });
});

// Transaction Routes
app.post('/api/transactions', verifyToken, (req, res) => {
    const { paymentFrom, paymentTo, amount, category, reason, transactionDate } = req.body;
    const query = 'INSERT INTO transactions (user_id, payment_from, payment_to, amount, category, reason, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    db.query(query, [req.user.id, paymentFrom, paymentTo, amount, category, reason, transactionDate], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ message: 'Transaction added successfully' });
    });
});

app.get('/api/transactions', verifyToken, (req, res) => {
    const query = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC';
    
    db.query(query, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Notification Settings Routes
app.post('/api/notifications', verifyToken, (req, res) => {
    const { type, enabled } = req.body;
    const query = 'INSERT INTO notifications (user_id, type, enabled) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE enabled = ?';
    
    db.query(query, [req.user.id, type, enabled, enabled], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ message: 'Notification settings updated successfully' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});