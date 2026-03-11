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

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',        // Change this to your MySQL username
    password: '',        // Change this to your MySQL password
    database: 'order_management'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('✅ Connected to MySQL database');
    
    // Create database and tables if not exists
    initializeDatabase();
});

// Initialize Database
function initializeDatabase() {
    // Create database if not exists
    db.query('CREATE DATABASE IF NOT EXISTS order_management', (err) => {
        if (err) console.error('Error creating database:', err);
        
        // Use the database
        db.query('USE order_management', (err) => {
            if (err) console.error('Error using database:', err);
            
            // Create Customers table
            const createCustomers = `
                CREATE TABLE IF NOT EXISTS customers (
                    customer_id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    phone VARCHAR(20),
                    address TEXT,
                    city VARCHAR(50),
                    registration_date DATE DEFAULT (CURRENT_DATE)
                )
            `;
            
            // Create Products table
            const createProducts = `
                CREATE TABLE IF NOT EXISTS products (
                    product_id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    price DECIMAL(10, 2) NOT NULL,
                    category VARCHAR(50),
                    stock_quantity INT DEFAULT 0
                )
            `;
            
            // Create Orders table
            const createOrders = `
                CREATE TABLE IF NOT EXISTS orders (
                    order_id INT PRIMARY KEY AUTO_INCREMENT,
                    customer_id INT,
                    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    total_amount DECIMAL(10, 2),
                    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
                )
            `;
            
            // Create Order Items table (for many-to-many relationship)
            const createOrderItems = `
                CREATE TABLE IF NOT EXISTS order_items (
                    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
                    order_id INT,
                    product_id INT,
                    quantity INT NOT NULL,
                    price DECIMAL(10, 2) NOT NULL,
                    FOREIGN KEY (order_id) REFERENCES orders(order_id),
                    FOREIGN KEY (product_id) REFERENCES products(product_id)
                )
            `;
            
            // Execute table creation
            db.query(createCustomers, (err) => {
                if (err) console.error('Error creating customers table:', err);
                else console.log('✅ Customers table ready');
            });
            
            db.query(createProducts, (err) => {
                if (err) console.error('Error creating products table:', err);
                else {
                    console.log('✅ Products table ready');
                    insertSampleProducts();
                }
            });
            
            db.query(createOrders, (err) => {
                if (err) console.error('Error creating orders table:', err);
                else console.log('✅ Orders table ready');
            });
            
            db.query(createOrderItems, (err) => {
                if (err) console.error('Error creating order_items table:', err);
                else {
                    console.log('✅ Order Items table ready');
                    insertSampleCustomers();
                    insertSampleOrders();
                }
            });
        });
    });
}

// Insert sample products
function insertSampleProducts() {
    const products = [
        ['Laptop Pro', 'High performance laptop', 999.99, 'Electronics', 50],
        ['Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 'Electronics', 100],
        ['Mechanical Keyboard', 'RGB mechanical keyboard', 89.99, 'Electronics', 75],
        ['27" Monitor', '4K UHD Monitor', 349.99, 'Electronics', 30],
        ['USB-C Hub', '7-in-1 USB-C hub', 49.99, 'Accessories', 150],
        ['Laptop Stand', 'Adjustable aluminum stand', 39.99, 'Accessories', 80],
        ['Webcam HD', '1080p HD webcam', 59.99, 'Electronics', 45],
        ['Noise Cancelling Headphones', 'Wireless ANC headphones', 199.99, 'Audio', 60],
        ['External SSD', '1TB portable SSD', 129.99, 'Storage', 40],
        ['Wireless Charger', '15W fast wireless charger', 24.99, 'Accessories', 120]
    ];
    
    const sql = 'INSERT IGNORE INTO products (name, description, price, category, stock_quantity) VALUES ?';
    db.query(sql, [products], (err) => {
        if (err) console.error('Error inserting products:', err);
        else console.log('✅ Sample products inserted');
    });
}

// Insert sample customers
function insertSampleCustomers() {
    const customers = [
        ['John Smith', 'john@email.com', '555-0101', '123 Main St', 'New York', '2024-01-15'],
        ['Emma Wilson', 'emma@email.com', '555-0102', '456 Oak Ave', 'Los Angeles', '2024-01-20'],
        ['Michael Brown', 'michael@email.com', '555-0103', '789 Pine Rd', 'Chicago', '2024-02-01'],
        ['Sarah Davis', 'sarah@email.com', '555-0104', '321 Elm St', 'Houston', '2024-02-10'],
        ['James Johnson', 'james@email.com', '555-0105', '654 Maple Dr', 'Phoenix', '2024-02-15'],
        ['Lisa Anderson', 'lisa@email.com', '555-0106', '987 Cedar Ln', 'Philadelphia', '2024-02-20'],
        ['Robert Taylor', 'robert@email.com', '555-0107', '147 Birch St', 'San Antonio', '2024-03-01'],
        ['Maria Garcia', 'maria@email.com', '555-0108', '258 Spruce Way', 'San Diego', '2024-03-05'],
        ['David Martinez', 'david@email.com', '555-0109', '369 Willow Ave', 'Dallas', '2024-03-10'],
        ['Jennifer Lee', 'jennifer@email.com', '555-0110', '741 Ash Blvd', 'San Jose', '2024-03-15']
    ];
    
    const sql = 'INSERT IGNORE INTO customers (name, email, phone, address, city, registration_date) VALUES ?';
    db.query(sql, [customers], (err) => {
        if (err) console.error('Error inserting customers:', err);
        else console.log('✅ Sample customers inserted');
    });
}

// Insert sample orders
function insertSampleOrders() {
    // First check if orders exist
    db.query('SELECT COUNT(*) as count FROM orders', (err, result) => {
        if (err) return;
        if (result[0].count > 0) return;
        
        // Create sample orders
        const orders = [
            [1, '2024-02-15 10:30:00', 1259.97, 'delivered'],
            [1, '2024-03-01 14:20:00', 89.99, 'shipped'],
            [2, '2024-02-20 09:15:00', 229.98, 'delivered'],
            [3, '2024-02-25 16:45:00', 1049.98, 'delivered'],
            [4, '2024-03-05 11:30:00', 349.99, 'processing'],
            [5, '2024-03-08 13:20:00', 159.98, 'pending'],
            [2, '2024-03-10 15:10:00', 199.99, 'shipped'],
            [6, '2024-03-12 10:00:00', 449.97, 'processing'],
            [7, '2024-03-14 12:30:00', 89.99, 'pending'],
            [8, '2024-03-15 09:45:00', 224.98, 'delivered']
        ];
        
        const orderSql = 'INSERT INTO orders (customer_id, order_date, total_amount, status) VALUES ?';
        db.query(orderSql, [orders], (err) => {
            if (err) console.error('Error inserting orders:', err);
            else {
                console.log('✅ Sample orders inserted');
                insertSampleOrderItems();
            }
        });
    });
}

// Insert sample order items
function insertSampleOrderItems() {
    const orderItems = [
        [1, 1, 1, 999.99],
        [1, 2, 2, 29.99],
        [2, 3, 1, 89.99],
        [3, 7, 1, 59.99],
        [3, 9, 1, 129.99],
        [4, 4, 2, 349.99],
        [4, 5, 1, 49.99],
        [5, 8, 1, 199.99],
        [6, 2, 5, 29.99],
        [7, 10, 2, 24.99],
        [8, 6, 3, 39.99],
        [9, 3, 1, 89.99],
        [10, 7, 2, 59.99],
        [10, 2, 3, 29.99]
    ];
    
    const sql = 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?';
    db.query(sql, [orderItems], (err) => {
        if (err) console.error('Error inserting order items:', err);
        else console.log('✅ Sample order items inserted');
    });
}

// ============= API ENDPOINTS =============

// 1. Get all customers with order stats (using JOIN)
app.get('/api/customers', (req, res) => {
    const sql = `
        SELECT 
            c.*,
            COUNT(o.order_id) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_spent,
            MAX(o.order_date) as last_order_date
        FROM customers c
        LEFT JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id
        ORDER BY total_spent DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// 2. Get customer order history (using JOIN)
app.get('/api/customers/:customerId/orders', (req, res) => {
    const sql = `
        SELECT 
            o.order_id,
            o.order_date,
            o.total_amount,
            o.status,
            COUNT(oi.order_item_id) as total_items,
            GROUP_CONCAT(p.name SEPARATOR ', ') as products
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE o.customer_id = ?
        GROUP BY o.order_id
        ORDER BY o.order_date DESC
    `;
    
    db.query(sql, [req.params.customerId], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// 3. Get order details with products (JOIN with multiple tables)
app.get('/api/orders/:orderId', (req, res) => {
    const sql = `
        SELECT 
            o.*,
            c.name as customer_name,
            c.email as customer_email,
            oi.quantity,
            oi.price as item_price,
            p.name as product_name,
            p.product_id
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE o.order_id = ?
    `;
    
    db.query(sql, [req.params.orderId], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// 4. Get highest value order (using ORDER BY and LIMIT)
app.get('/api/insights/highest-order', (req, res) => {
    const sql = `
        SELECT 
            o.order_id,
            o.total_amount,
            o.order_date,
            c.name as customer_name,
            c.customer_id,
            COUNT(oi.order_item_id) as item_count
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        JOIN order_items oi ON o.order_id = oi.order_id
        GROUP BY o.order_id
        ORDER BY o.total_amount DESC
        LIMIT 1
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results[0] || {});
    });
});

// 5. Get most active customer (using subquery)
app.get('/api/insights/most-active-customer', (req, res) => {
    const sql = `
        SELECT 
            c.*,
            COUNT(o.order_id) as order_count,
            SUM(o.total_amount) as total_spent,
            (SELECT COUNT(*) FROM orders o2 WHERE o2.customer_id = c.customer_id) as order_count_subquery
        FROM customers c
        JOIN orders o ON c.customer_id = o.customer_id
        GROUP BY c.customer_id
        ORDER BY order_count DESC, total_spent DESC
        LIMIT 1
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results[0] || {});
    });
});

// 6. Get products with sales stats (using JOIN and subquery)
app.get('/api/products', (req, res) => {
    const sql = `
        SELECT 
            p.*,
            COALESCE(SUM(oi.quantity), 0) as total_sold,
            COALESCE(COUNT(DISTINCT o.order_id), 0) as times_ordered,
            COALESCE(SUM(oi.quantity * oi.price), 0) as revenue,
            (SELECT AVG(price) FROM products WHERE category = p.category) as avg_category_price
        FROM products p
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.order_id
        GROUP BY p.product_id
        ORDER BY revenue DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// 7. Get order summary by status
app.get('/api/orders/summary', (req, res) => {
    const sql = `
        SELECT 
            status,
            COUNT(*) as order_count,
            SUM(total_amount) as total_value,
            AVG(total_amount) as average_value
        FROM orders
        GROUP BY status
        ORDER BY 
            CASE status
                WHEN 'pending' THEN 1
                WHEN 'processing' THEN 2
                WHEN 'shipped' THEN 3
                WHEN 'delivered' THEN 4
                WHEN 'cancelled' THEN 5
            END
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Task 4: Order Management running at http://localhost:${port}`);
    console.log('\n📊 Database Insights:');
    console.log('   - Using JOIN queries between Customers, Orders, Products');
    console.log('   - Subquery for most active customer');
    console.log('   - ORDER BY for highest value order');
    console.log('\n💡 Test API endpoints:');
    console.log('   GET  /api/customers');
    console.log('   GET  /api/products');
    console.log('   GET  /api/orders/summary');
    console.log('   GET  /api/insights/highest-order');
    console.log('   GET  /api/insights/most-active-customer');
});