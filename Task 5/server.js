const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// MySQL Connection with promise support for transactions
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',        // Change to your MySQL username
    password: '',        // Change to your MySQL password
    database: 'payment_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// Initialize Database
async function initializeDatabase() {
    try {
        // Create database if not exists
        await pool.query('CREATE DATABASE IF NOT EXISTS payment_system');
        await pool.query('USE payment_system');

        // Create users table (customers and merchants)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                user_type ENUM('customer', 'merchant') NOT NULL,
                balance DECIMAL(15, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create transactions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                transaction_id INT PRIMARY KEY AUTO_INCREMENT,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                status ENUM('pending', 'completed', 'failed', 'rolled_back') DEFAULT 'pending',
                transaction_type ENUM('payment', 'refund') DEFAULT 'payment',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (sender_id) REFERENCES users(user_id),
                FOREIGN KEY (receiver_id) REFERENCES users(user_id),
                INDEX idx_status (status),
                INDEX idx_created (created_at)
            )
        `);

        // Create transaction_logs table for audit
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transaction_logs (
                log_id INT PRIMARY KEY AUTO_INCREMENT,
                transaction_id INT,
                action VARCHAR(50),
                old_balance_sender DECIMAL(15, 2),
                new_balance_sender DECIMAL(15, 2),
                old_balance_receiver DECIMAL(15, 2),
                new_balance_receiver DECIMAL(15, 2),
                log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
            )
        `);

        // Insert sample data if tables are empty
        await insertSampleData();
        
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Insert sample data
async function insertSampleData() {
    try {
        // Check if users exist
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        
        if (users[0].count === 0) {
            // Insert customers
            const customers = [
                ['john_customer', 'John Smith', 'john@email.com', 'customer', 5000.00],
                ['emma_customer', 'Emma Wilson', 'emma@email.com', 'customer', 3500.00],
                ['michael_customer', 'Michael Brown', 'michael@email.com', 'customer', 8200.00],
                ['sarah_customer', 'Sarah Davis', 'sarah@email.com', 'customer', 1200.00],
                ['david_customer', 'David Martinez', 'david@email.com', 'customer', 6700.00],
                ['lisa_customer', 'Lisa Anderson', 'lisa@email.com', 'customer', 4300.00]
            ];

            // Insert merchants
            const merchants = [
                ['amazon_merchant', 'Amazon Store', 'amazon@payment.com', 'merchant', 50000.00],
                ['walmart_merchant', 'Walmart', 'walmart@payment.com', 'merchant', 35000.00],
                ['target_merchant', 'Target', 'target@payment.com', 'merchant', 28000.00],
                ['bestbuy_merchant', 'Best Buy', 'bestbuy@payment.com', 'merchant', 42000.00],
                ['apple_merchant', 'Apple Store', 'apple@payment.com', 'merchant', 75000.00],
                ['netflix_merchant', 'Netflix', 'netflix@payment.com', 'merchant', 15000.00],
                ['spotify_merchant', 'Spotify', 'spotify@payment.com', 'merchant', 12000.00]
            ];

            // Insert all users
            for (let user of [...customers, ...merchants]) {
                await pool.query(
                    'INSERT INTO users (username, full_name, email, user_type, balance) VALUES (?, ?, ?, ?, ?)',
                    user
                );
            }

            console.log('✅ Sample users inserted');

            // Create some sample completed transactions for history
            await insertSampleTransactions();
        }
    } catch (error) {
        console.error('Error inserting sample data:', error);
    }
}

// Insert sample transaction history
async function insertSampleTransactions() {
    try {
        const sampleTransactions = [
            [1, 7, 150.00, 'completed', 'payment', 'Amazon Purchase - Electronics'],
            [2, 8, 89.99, 'completed', 'payment', 'Walmart - Groceries'],
            [3, 9, 1299.99, 'completed', 'payment', 'Best Buy - Laptop'],
            [4, 10, 9.99, 'completed', 'payment', 'Netflix Subscription'],
            [5, 11, 14.99, 'completed', 'payment', 'Spotify Premium'],
            [1, 7, 45.50, 'completed', 'payment', 'Amazon - Books'],
            [2, 8, 120.00, 'completed', 'payment', 'Walmart - Household'],
            [6, 9, 699.99, 'completed', 'payment', 'Apple Store - AirPods'],
            [3, 10, 15.99, 'completed', 'payment', 'Netflix - Gift Card'],
            [4, 11, 9.99, 'completed', 'payment', 'Spotify - Gift']
        ];

        for (let t of sampleTransactions) {
            const [result] = await pool.query(
                `INSERT INTO transactions 
                (sender_id, receiver_id, amount, status, transaction_type, description, completed_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                t
            );

            // Update balances for completed transactions
            await pool.query(
                'UPDATE users SET balance = balance - ? WHERE user_id = ?',
                [t[2], t[0]]
            );
            await pool.query(
                'UPDATE users SET balance = balance + ? WHERE user_id = ?',
                [t[2], t[1]]
            );
        }

        console.log('✅ Sample transactions inserted');
    } catch (error) {
        console.error('Error inserting sample transactions:', error);
    }
}

// ============= TRANSACTION API ENDPOINTS =============

// Process payment with transaction (COMMIT on success, ROLLBACK on failure)
app.post('/api/payment', async (req, res) => {
    const { sender_id, receiver_id, amount, description } = req.body;
    
    // Validation
    if (!sender_id || !receiver_id || !amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid payment details'
        });
    }

    const connection = await pool.getConnection();
    
    try {
        // Start transaction
        await connection.beginTransaction();

        // Check sender exists and has sufficient balance
        const [sender] = await connection.query(
            'SELECT * FROM users WHERE user_id = ? FOR UPDATE',
            [sender_id]
        );

        if (sender.length === 0) {
            throw new Error('Sender not found');
        }

        if (sender[0].balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Check receiver exists
        const [receiver] = await connection.query(
            'SELECT * FROM users WHERE user_id = ? FOR UPDATE',
            [receiver_id]
        );

        if (receiver.length === 0) {
            throw new Error('Receiver not found');
        }

        // Record old balances for logging
        const oldSenderBalance = sender[0].balance;
        const oldReceiverBalance = receiver[0].balance;

        // Deduct from sender
        await connection.query(
            'UPDATE users SET balance = balance - ? WHERE user_id = ?',
            [amount, sender_id]
        );

        // Add to receiver
        await connection.query(
            'UPDATE users SET balance = balance + ? WHERE user_id = ?',
            [amount, receiver_id]
        );

        // Record transaction
        const [transaction] = await connection.query(
            `INSERT INTO transactions 
            (sender_id, receiver_id, amount, status, transaction_type, description, completed_at) 
            VALUES (?, ?, ?, 'completed', 'payment', ?, NOW())`,
            [sender_id, receiver_id, amount, description || 'Payment']
        );

        // Log the transaction
        await connection.query(
            `INSERT INTO transaction_logs 
            (transaction_id, action, old_balance_sender, new_balance_sender, 
             old_balance_receiver, new_balance_receiver) 
            VALUES (?, 'payment', ?, ?, ?, ?)`,
            [
                transaction.insertId,
                oldSenderBalance,
                oldSenderBalance - amount,
                oldReceiverBalance,
                oldReceiverBalance + amount
            ]
        );

        // If everything is successful, COMMIT the transaction
        await connection.commit();

        // Get updated balances
        const [updatedSender] = await pool.query(
            'SELECT balance FROM users WHERE user_id = ?',
            [sender_id]
        );
        
        const [updatedReceiver] = await pool.query(
            'SELECT balance FROM users WHERE user_id = ?',
            [receiver_id]
        );

        res.json({
            success: true,
            message: 'Payment successful',
            transaction_id: transaction.insertId,
            sender_balance: updatedSender[0].balance,
            receiver_balance: updatedReceiver[0].balance,
            amount: amount,
            timestamp: new Date()
        });

    } catch (error) {
        // If any error occurs, ROLLBACK the transaction
        await connection.rollback();
        
        // Log failed transaction attempt
        await pool.query(
            `INSERT INTO transactions 
            (sender_id, receiver_id, amount, status, transaction_type, description) 
            VALUES (?, ?, ?, 'failed', 'payment', ?)`,
            [sender_id, receiver_id, amount, error.message]
        );

        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        connection.release();
    }
});

// Process refund (reverse transaction) with transaction
app.post('/api/refund', async (req, res) => {
    const { transaction_id } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Get original transaction
        const [originalTx] = await connection.query(
            'SELECT * FROM transactions WHERE transaction_id = ? FOR UPDATE',
            [transaction_id]
        );

        if (originalTx.length === 0) {
            throw new Error('Transaction not found');
        }

        if (originalTx[0].status !== 'completed') {
            throw new Error('Only completed transactions can be refunded');
        }

        if (originalTx[0].transaction_type === 'refund') {
            throw new Error('Cannot refund a refund transaction');
        }

        // Check if refund already exists
        const [existingRefund] = await connection.query(
            'SELECT * FROM transactions WHERE description LIKE ? AND status = "completed"',
            [`%Refund for transaction #${transaction_id}%`]
        );

        if (existingRefund.length > 0) {
            throw new Error('Refund already processed for this transaction');
        }

        // Get current balances
        const [sender] = await connection.query(
            'SELECT * FROM users WHERE user_id = ? FOR UPDATE',
            [originalTx[0].receiver_id] // Original receiver becomes sender for refund
        );

        const [receiver] = await connection.query(
            'SELECT * FROM users WHERE user_id = ? FOR UPDATE',
            [originalTx[0].sender_id] // Original sender becomes receiver for refund
        );

        const amount = originalTx[0].amount;

        // Check if merchant has sufficient balance for refund
        if (sender[0].balance < amount) {
            throw new Error('Merchant has insufficient balance for refund');
        }

        // Process refund (reverse the original transaction)
        await connection.query(
            'UPDATE users SET balance = balance - ? WHERE user_id = ?',
            [amount, originalTx[0].receiver_id]
        );

        await connection.query(
            'UPDATE users SET balance = balance + ? WHERE user_id = ?',
            [amount, originalTx[0].sender_id]
        );

        // Record refund transaction
        const [refund] = await connection.query(
            `INSERT INTO transactions 
            (sender_id, receiver_id, amount, status, transaction_type, description, completed_at) 
            VALUES (?, ?, ?, 'completed', 'refund', ?, NOW())`,
            [
                originalTx[0].receiver_id,
                originalTx[0].sender_id,
                amount,
                `Refund for transaction #${transaction_id}`
            ]
        );

        // Log the refund
        await connection.query(
            `INSERT INTO transaction_logs 
            (transaction_id, action, old_balance_sender, new_balance_sender, 
             old_balance_receiver, new_balance_receiver) 
            VALUES (?, 'refund', ?, ?, ?, ?)`,
            [
                refund.insertId,
                sender[0].balance,
                sender[0].balance - amount,
                receiver[0].balance,
                receiver[0].balance + amount
            ]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Refund processed successfully',
            refund_id: refund.insertId,
            amount: amount,
            original_transaction: transaction_id
        });

    } catch (error) {
        await connection.rollback();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        connection.release();
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT 
                user_id,
                username,
                full_name,
                email,
                user_type,
                balance,
                created_at
            FROM users 
            ORDER BY user_type, full_name
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user details with transaction history
app.get('/api/users/:userId', async (req, res) => {
    try {
        const [user] = await pool.query(
            'SELECT * FROM users WHERE user_id = ?',
            [req.params.userId]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get sent transactions
        const [sent] = await pool.query(`
            SELECT t.*, u.full_name as receiver_name 
            FROM transactions t
            JOIN users u ON t.receiver_id = u.user_id
            WHERE t.sender_id = ?
            ORDER BY t.created_at DESC
            LIMIT 10
        `, [req.params.userId]);

        // Get received transactions
        const [received] = await pool.query(`
            SELECT t.*, u.full_name as sender_name 
            FROM transactions t
            JOIN users u ON t.sender_id = u.user_id
            WHERE t.receiver_id = ?
            ORDER BY t.created_at DESC
            LIMIT 10
        `, [req.params.userId]);

        res.json({
            user: user[0],
            sent_transactions: sent,
            received_transactions: received
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction history with filters
app.get('/api/transactions', async (req, res) => {
    try {
        const { status, type, limit = 50 } = req.query;
        
        let query = `
            SELECT 
                t.*,
                sender.full_name as sender_name,
                sender.user_type as sender_type,
                receiver.full_name as receiver_name,
                receiver.user_type as receiver_type
            FROM transactions t
            JOIN users sender ON t.sender_id = sender.user_id
            JOIN users receiver ON t.receiver_id = receiver.user_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }
        
        if (type) {
            query += ' AND t.transaction_type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY t.created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const [transactions] = await pool.query(query, params);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction logs
app.get('/api/transaction-logs/:transactionId', async (req, res) => {
    try {
        const [logs] = await pool.query(
            'SELECT * FROM transaction_logs WHERE transaction_id = ? ORDER BY log_time',
            [req.params.transactionId]
        );
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get dashboard statistics
app.get('/api/stats', async (req, res) => {
    try {
        // Total transaction volume
        const [volume] = await pool.query(`
            SELECT 
                COUNT(*) as total_transactions,
                COALESCE(SUM(amount), 0) as total_volume,
                AVG(amount) as avg_transaction
            FROM transactions 
            WHERE status = 'completed'
        `);

        // Balance statistics
        const [balances] = await pool.query(`
            SELECT 
                user_type,
                COUNT(*) as user_count,
                COALESCE(SUM(balance), 0) as total_balance,
                COALESCE(AVG(balance), 0) as avg_balance
            FROM users
            GROUP BY user_type
        `);

        // Today's transactions
        const [today] = await pool.query(`
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(amount), 0) as volume
            FROM transactions 
            WHERE DATE(created_at) = CURDATE() 
            AND status = 'completed'
        `);

        // Failed transactions today
        const [failed] = await pool.query(`
            SELECT COUNT(*) as count
            FROM transactions 
            WHERE DATE(created_at) = CURDATE() 
            AND status = 'failed'
        `);

        res.json({
            total_volume: volume[0],
            balance_stats: balances,
            today: {
                transactions: today[0].count,
                volume: today[0].volume,
                failed: failed[0].count
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Task 5: Payment Simulation running at http://localhost:${port}`);
        console.log('\n💰 Payment System with Transactions:');
        console.log('   - Using MySQL TRANSACTIONS');
        console.log('   - COMMIT on successful payment');
        console.log('   - ROLLBACK on failure');
        console.log('\n📊 Test Accounts:');
        console.log('   Customers: John, Emma, Michael (balances: $1,200 - $8,200)');
        console.log('   Merchants: Amazon, Walmart, Apple (balances: $12,000 - $75,000)');
    });
});