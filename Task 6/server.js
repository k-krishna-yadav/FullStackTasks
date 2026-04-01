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
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',        // Change to your MySQL username
    password: '',        // Change to your MySQL password
    database: 'logging_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// Initialize Database with Triggers and Views
async function initializeDatabase() {
    try {
        // Create database
        await pool.query('CREATE DATABASE IF NOT EXISTS logging_system');
        await pool.query('USE logging_system');

        // ============= CREATE TABLES =============
        
        // Employees table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS employees (
                employee_id INT PRIMARY KEY AUTO_INCREMENT,
                employee_code VARCHAR(20) UNIQUE NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                department VARCHAR(50),
                position VARCHAR(50),
                salary DECIMAL(10, 2),
                hire_date DATE DEFAULT (CURRENT_DATE),
                status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by VARCHAR(50)
            )
        `);

        // Products table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                product_id INT PRIMARY KEY AUTO_INCREMENT,
                product_code VARCHAR(20) UNIQUE NOT NULL,
                product_name VARCHAR(100) NOT NULL,
                category VARCHAR(50),
                price DECIMAL(10, 2) NOT NULL,
                cost DECIMAL(10, 2),
                quantity INT DEFAULT 0,
                reorder_level INT DEFAULT 10,
                supplier VARCHAR(100),
                status ENUM('active', 'discontinued') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Sales table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sales (
                sale_id INT PRIMARY KEY AUTO_INCREMENT,
                invoice_no VARCHAR(20) UNIQUE NOT NULL,
                product_id INT,
                employee_id INT,
                quantity INT NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                discount DECIMAL(10, 2) DEFAULT 0,
                total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price - discount) STORED,
                payment_method ENUM('cash', 'card', 'online') DEFAULT 'cash',
                sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (product_id) REFERENCES products(product_id),
                FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
            )
        `);

        // ============= CREATE AUDIT LOG TABLE =============
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_log (
                log_id INT PRIMARY KEY AUTO_INCREMENT,
                table_name VARCHAR(50) NOT NULL,
                operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
                record_id INT,
                old_data JSON,
                new_data JSON,
                changed_by VARCHAR(50),
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT
            )
        `);

        // ============= CREATE TRIGGERS =============

        // Trigger for employees INSERT
        await pool.query(`
            DROP TRIGGER IF EXISTS employees_insert_trigger
        `);
        
        await pool.query(`
            CREATE TRIGGER employees_insert_trigger
            AFTER INSERT ON employees
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_log (
                    table_name, 
                    operation_type, 
                    record_id, 
                    new_data, 
                    changed_by,
                    ip_address
                )
                VALUES (
                    'employees',
                    'INSERT',
                    NEW.employee_id,
                    JSON_OBJECT(
                        'employee_code', NEW.employee_code,
                        'name', CONCAT(NEW.first_name, ' ', NEW.last_name),
                        'email', NEW.email,
                        'department', NEW.department,
                        'position', NEW.position,
                        'salary', NEW.salary,
                        'status', NEW.status
                    ),
                    NEW.created_by,
                    USER()
                );
            END
        `);

        // Trigger for employees UPDATE
        await pool.query(`
            DROP TRIGGER IF EXISTS employees_update_trigger
        `);
        
        await pool.query(`
            CREATE TRIGGER employees_update_trigger
            AFTER UPDATE ON employees
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_log (
                    table_name, 
                    operation_type, 
                    record_id, 
                    old_data,
                    new_data, 
                    changed_by
                )
                VALUES (
                    'employees',
                    'UPDATE',
                    NEW.employee_id,
                    JSON_OBJECT(
                        'employee_code', OLD.employee_code,
                        'name', CONCAT(OLD.first_name, ' ', OLD.last_name),
                        'department', OLD.department,
                        'position', OLD.position,
                        'salary', OLD.salary,
                        'status', OLD.status
                    ),
                    JSON_OBJECT(
                        'employee_code', NEW.employee_code,
                        'name', CONCAT(NEW.first_name, ' ', NEW.last_name),
                        'department', NEW.department,
                        'position', NEW.position,
                        'salary', NEW.salary,
                        'status', NEW.status
                    ),
                    USER()
                );
            END
        `);

        // Trigger for products INSERT
        await pool.query(`
            DROP TRIGGER IF EXISTS products_insert_trigger
        `);
        
        await pool.query(`
            CREATE TRIGGER products_insert_trigger
            AFTER INSERT ON products
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_log (
                    table_name, 
                    operation_type, 
                    record_id, 
                    new_data
                )
                VALUES (
                    'products',
                    'INSERT',
                    NEW.product_id,
                    JSON_OBJECT(
                        'product_code', NEW.product_code,
                        'product_name', NEW.product_name,
                        'category', NEW.category,
                        'price', NEW.price,
                        'cost', NEW.cost,
                        'quantity', NEW.quantity,
                        'supplier', NEW.supplier,
                        'status', NEW.status
                    )
                );
            END
        `);

        // Trigger for products UPDATE
        await pool.query(`
            DROP TRIGGER IF EXISTS products_update_trigger
        `);
        
        await pool.query(`
            CREATE TRIGGER products_update_trigger
            AFTER UPDATE ON products
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_log (
                    table_name, 
                    operation_type, 
                    record_id, 
                    old_data,
                    new_data
                )
                VALUES (
                    'products',
                    'UPDATE',
                    NEW.product_id,
                    JSON_OBJECT(
                        'price', OLD.price,
                        'quantity', OLD.quantity,
                        'status', OLD.status
                    ),
                    JSON_OBJECT(
                        'price', NEW.price,
                        'quantity', NEW.quantity,
                        'status', NEW.status
                    )
                );
            END
        `);

        // Trigger for sales INSERT
        await pool.query(`
            DROP TRIGGER IF EXISTS sales_insert_trigger
        `);
        
        await pool.query(`
            CREATE TRIGGER sales_insert_trigger
            AFTER INSERT ON sales
            FOR EACH ROW
            BEGIN
                INSERT INTO audit_log (
                    table_name, 
                    operation_type, 
                    record_id, 
                    new_data
                )
                VALUES (
                    'sales',
                    'INSERT',
                    NEW.sale_id,
                    JSON_OBJECT(
                        'invoice_no', NEW.invoice_no,
                        'product_id', NEW.product_id,
                        'employee_id', NEW.employee_id,
                        'quantity', NEW.quantity,
                        'total_amount', NEW.total_amount,
                        'payment_method', NEW.payment_method
                    )
                );
                
                -- Update product quantity
                UPDATE products 
                SET quantity = quantity - NEW.quantity 
                WHERE product_id = NEW.product_id;
            END
        `);

        // ============= CREATE VIEWS =============

        // View 1: Daily Activity Summary
        await pool.query(`
            DROP VIEW IF EXISTS daily_activity_view
        `);
        
        await pool.query(`
            CREATE VIEW daily_activity_view AS
            SELECT 
                DATE(changed_at) as activity_date,
                table_name,
                operation_type,
                COUNT(*) as operation_count,
                COUNT(DISTINCT record_id) as unique_records_affected,
                GROUP_CONCAT(DISTINCT changed_by) as users_involved
            FROM audit_log
            GROUP BY DATE(changed_at), table_name, operation_type
            ORDER BY activity_date DESC, table_name, operation_type
        `);

        // View 2: Employee Activity Log (with joins)
        await pool.query(`
            DROP VIEW IF EXISTS employee_activity_view
        `);
        
        await pool.query(`
            CREATE VIEW employee_activity_view AS
            SELECT 
                a.log_id,
                a.table_name,
                a.operation_type,
                a.record_id,
                CASE 
                    WHEN a.table_name = 'employees' AND a.operation_type = 'INSERT' 
                        THEN JSON_UNQUOTE(JSON_EXTRACT(a.new_data, '$.name'))
                    WHEN a.table_name = 'employees' AND a.operation_type = 'UPDATE'
                        THEN JSON_UNQUOTE(JSON_EXTRACT(a.new_data, '$.name'))
                    ELSE CONCAT('Record ID: ', a.record_id)
                END as record_description,
                a.changed_at,
                a.changed_by,
                CASE 
                    WHEN a.old_data IS NOT NULL AND a.new_data IS NOT NULL THEN 'Modified'
                    WHEN a.old_data IS NULL AND a.new_data IS NOT NULL THEN 'Created'
                    ELSE 'Unknown'
                END as action_type,
                a.old_data,
                a.new_data
            FROM audit_log a
            ORDER BY a.changed_at DESC
        `);

        // View 3: Sales Performance View (with joins)
        await pool.query(`
            DROP VIEW IF EXISTS sales_performance_view
        `);
        
        await pool.query(`
            CREATE VIEW sales_performance_view AS
            SELECT 
                DATE(s.sale_date) as sale_date,
                COUNT(DISTINCT s.sale_id) as total_transactions,
                COUNT(DISTINCT s.employee_id) as active_employees,
                SUM(s.total_amount) as total_revenue,
                AVG(s.total_amount) as average_transaction_value,
                SUM(s.quantity) as total_items_sold,
                SUM(s.discount) as total_discounts,
                s.payment_method,
                p.category as product_category
            FROM sales s
            JOIN products p ON s.product_id = p.product_id
            GROUP BY DATE(s.sale_date), s.payment_method, p.category WITH ROLLUP
            ORDER BY sale_date DESC, payment_method, product_category
        `);

        // View 4: Inventory Change Log (using trigger data)
        await pool.query(`
            DROP VIEW IF EXISTS inventory_change_view
        `);
        
        await pool.query(`
            CREATE VIEW inventory_change_view AS
            SELECT 
                a.changed_at as change_time,
                a.table_name,
                a.operation_type,
                p.product_name,
                p.product_code,
                JSON_UNQUOTE(JSON_EXTRACT(a.old_data, '$.quantity')) as old_quantity,
                JSON_UNQUOTE(JSON_EXTRACT(a.new_data, '$.quantity')) as new_quantity,
                CASE 
                    WHEN JSON_UNQUOTE(JSON_EXTRACT(a.old_data, '$.quantity')) IS NOT NULL 
                         AND JSON_UNQUOTE(JSON_EXTRACT(a.new_data, '$.quantity')) IS NOT NULL
                    THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(a.new_data, '$.quantity')) AS SIGNED) - 
                         CAST(JSON_UNQUOTE(JSON_EXTRACT(a.old_data, '$.quantity')) AS SIGNED)
                    ELSE 0
                END as quantity_change,
                JSON_UNQUOTE(JSON_EXTRACT(a.old_data, '$.price')) as old_price,
                JSON_UNQUOTE(JSON_EXTRACT(a.new_data, '$.price')) as new_price
            FROM audit_log a
            LEFT JOIN products p ON a.record_id = p.product_id
            WHERE a.table_name = 'products'
            ORDER BY a.changed_at DESC
        `);

        // View 5: User Activity Summary
        await pool.query(`
            DROP VIEW IF EXISTS user_activity_summary
        `);
        
        await pool.query(`
            CREATE VIEW user_activity_summary AS
            SELECT 
                changed_by as username,
                COUNT(*) as total_actions,
                COUNT(CASE WHEN operation_type = 'INSERT' THEN 1 END) as inserts,
                COUNT(CASE WHEN operation_type = 'UPDATE' THEN 1 END) as updates,
                COUNT(CASE WHEN operation_type = 'DELETE' THEN 1 END) as deletes,
                MIN(DATE(changed_at)) as first_action_date,
                MAX(DATE(changed_at)) as last_action_date,
                COUNT(DISTINCT DATE(changed_at)) as active_days,
                COUNT(DISTINCT table_name) as tables_accessed
            FROM audit_log
            GROUP BY changed_by
            ORDER BY total_actions DESC
        `);

        console.log('✅ Tables, Triggers, and Views created successfully');

        // Insert sample data
        await insertSampleData();

    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Insert sample data to demonstrate triggers
async function insertSampleData() {
    try {
        // Check if data exists
        const [employees] = await pool.query('SELECT COUNT(*) as count FROM employees');
        
        if (employees[0].count === 0) {
            console.log('📝 Inserting sample data (triggers will fire)...');

            // Insert employees (will fire INSERT trigger)
            await pool.query(`
                INSERT INTO employees (employee_code, first_name, last_name, email, phone, department, position, salary, created_by) VALUES
                ('EMP001', 'John', 'Smith', 'john.smith@company.com', '555-0101', 'IT', 'Senior Developer', 85000, 'admin'),
                ('EMP002', 'Emma', 'Wilson', 'emma.wilson@company.com', '555-0102', 'Sales', 'Sales Manager', 75000, 'admin'),
                ('EMP003', 'Michael', 'Brown', 'michael.brown@company.com', '555-0103', 'IT', 'System Admin', 70000, 'admin'),
                ('EMP004', 'Sarah', 'Davis', 'sarah.davis@company.com', '555-0104', 'HR', 'HR Manager', 65000, 'admin'),
                ('EMP005', 'James', 'Johnson', 'james.johnson@company.com', '555-0105', 'Sales', 'Sales Rep', 55000, 'admin'),
                ('EMP006', 'Lisa', 'Anderson', 'lisa.anderson@company.com', '555-0106', 'IT', 'Junior Developer', 60000, 'admin'),
                ('EMP007', 'Robert', 'Taylor', 'robert.taylor@company.com', '555-0107', 'Marketing', 'Marketing Manager', 72000, 'admin'),
                ('EMP008', 'Maria', 'Garcia', 'maria.garcia@company.com', '555-0108', 'Sales', 'Sales Rep', 58000, 'admin')
            `);

            // Insert products (will fire INSERT trigger)
            await pool.query(`
                INSERT INTO products (product_code, product_name, category, price, cost, quantity, supplier) VALUES
                ('PROD001', 'Laptop Pro 15"', 'Electronics', 1299.99, 950.00, 50, 'TechSupply Inc'),
                ('PROD002', 'Wireless Mouse', 'Electronics', 29.99, 15.00, 200, 'TechSupply Inc'),
                ('PROD003', 'Mechanical Keyboard', 'Electronics', 89.99, 45.00, 75, 'KeyCorp'),
                ('PROD004', '27" Monitor 4K', 'Electronics', 349.99, 220.00, 30, 'DisplayTech'),
                ('PROD005', 'USB-C Hub', 'Accessories', 49.99, 25.00, 150, 'ConnectPro'),
                ('PROD006', 'Laptop Stand', 'Accessories', 39.99, 18.00, 80, 'ErgoPlus'),
                ('PROD007', 'Webcam HD 1080p', 'Electronics', 59.99, 32.00, 45, 'CamTech'),
                ('PROD008', 'Noise Cancelling Headphones', 'Audio', 199.99, 120.00, 60, 'AudioMax'),
                ('PROD009', 'External SSD 1TB', 'Storage', 129.99, 85.00, 40, 'StoragePro'),
                ('PROD010', 'Wireless Charger', 'Accessories', 24.99, 12.00, 120, 'ChargeTech')
            `);

            // Insert sales (will fire INSERT trigger and update product quantity)
            await pool.query(`
                INSERT INTO sales (invoice_no, product_id, employee_id, quantity, unit_price, discount, payment_method, notes) VALUES
                ('INV001', 1, 1, 2, 1299.99, 0, 'card', 'Corporate purchase'),
                ('INV002', 2, 3, 5, 29.99, 0, 'cash', 'Walk-in customer'),
                ('INV003', 3, 1, 1, 89.99, 10, 'card', 'Online order'),
                ('INV004', 4, 2, 3, 349.99, 50, 'online', 'Bulk order'),
                ('INV005', 5, 5, 10, 49.99, 0, 'card', 'Office supplies'),
                ('INV006', 6, 2, 4, 39.99, 0, 'cash', 'Retail customer'),
                ('INV007', 7, 1, 2, 59.99, 5, 'online', 'Remote work setup'),
                ('INV008', 8, 3, 1, 199.99, 0, 'card', 'Personal purchase'),
                ('INV009', 9, 1, 1, 129.99, 0, 'card', 'Storage upgrade'),
                ('INV010', 10, 2, 3, 24.99, 0, 'cash', 'Gift purchase')
            `);

            // Perform some updates to test UPDATE triggers
            await pool.query(`
                UPDATE employees SET salary = 90000, position = 'Lead Developer' WHERE employee_id = 1
            `);

            await pool.query(`
                UPDATE products SET price = 1399.99, quantity = 45 WHERE product_id = 1
            `);

            await pool.query(`
                UPDATE products SET quantity = 180 WHERE product_id = 2
            `);

            await pool.query(`
                UPDATE employees SET department = 'Engineering', position = 'Senior Engineer' WHERE employee_id = 3
            `);

            console.log('✅ Sample data inserted - Triggers automatically logged all changes');
        }

    } catch (error) {
        console.error('Error inserting sample data:', error);
    }
}

// ============= API ENDPOINTS =============

// Get all audit logs
app.get('/api/audit-logs', async (req, res) => {
    try {
        const { table, operation, limit = 100 } = req.query;
        
        let query = 'SELECT * FROM audit_log WHERE 1=1';
        const params = [];
        
        if (table) {
            query += ' AND table_name = ?';
            params.push(table);
        }
        
        if (operation) {
            query += ' AND operation_type = ?';
            params.push(operation);
        }
        
        query += ' ORDER BY changed_at DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const [logs] = await pool.query(query, params);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get daily activity view
app.get('/api/views/daily-activity', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const [activity] = await pool.query(`
            SELECT * FROM daily_activity_view 
            WHERE activity_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ORDER BY activity_date DESC
        `, [parseInt(days)]);
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get employee activity view
app.get('/api/views/employee-activity', async (req, res) => {
    try {
        const [activity] = await pool.query(`
            SELECT * FROM employee_activity_view 
            LIMIT 200
        `);
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sales performance view
app.get('/api/views/sales-performance', async (req, res) => {
    try {
        const [performance] = await pool.query(`
            SELECT * FROM sales_performance_view 
            WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ORDER BY sale_date DESC
        `);
        res.json(performance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get inventory changes view
app.get('/api/views/inventory-changes', async (req, res) => {
    try {
        const [changes] = await pool.query(`
            SELECT * FROM inventory_change_view 
            LIMIT 100
        `);
        res.json(changes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user activity summary
app.get('/api/views/user-activity', async (req, res) => {
    try {
        const [summary] = await pool.query(`
            SELECT * FROM user_activity_summary
        `);
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get statistics about triggers and views
app.get('/api/stats', async (req, res) => {
    try {
        const [totalLogs] = await pool.query('SELECT COUNT(*) as count FROM audit_log');
        const [logsToday] = await pool.query(`
            SELECT COUNT(*) as count FROM audit_log 
            WHERE DATE(changed_at) = CURDATE()
        `);
        const [operations] = await pool.query(`
            SELECT operation_type, COUNT(*) as count 
            FROM audit_log 
            GROUP BY operation_type
        `);
        const [tables] = await pool.query(`
            SELECT table_name, COUNT(*) as count 
            FROM audit_log 
            GROUP BY table_name
        `);
        
        res.json({
            total_logs: totalLogs[0].count,
            logs_today: logsToday[0].count,
            operations: operations,
            tables: tables
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manual insert to test trigger (for demo)
app.post('/api/test/insert', async (req, res) => {
    try {
        const { table } = req.body;
        
        if (table === 'employee') {
            const [result] = await pool.query(`
                INSERT INTO employees (employee_code, first_name, last_name, email, department, position, salary, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                `EMP${Math.floor(Math.random() * 1000)}`,
                'Test',
                'User',
                `test${Math.random()}@company.com`,
                'IT',
                'Tester',
                50000,
                'demo_user'
            ]);
            
            res.json({ 
                success: true, 
                message: 'Employee inserted - trigger fired!',
                id: result.insertId
            });
        }
        else if (table === 'product') {
            const [result] = await pool.query(`
                INSERT INTO products (product_code, product_name, category, price, quantity, supplier)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                `PROD${Math.floor(Math.random() * 1000)}`,
                'Test Product',
                'Accessories',
                49.99,
                100,
                'Test Supplier'
            ]);
            
            res.json({ 
                success: true, 
                message: 'Product inserted - trigger fired!',
                id: result.insertId
            });
        }
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
        console.log(`🚀 Task 6: Logging System running at http://localhost:${port}`);
        console.log('\n📋 Features:');
        console.log('   - ✅ AFTER INSERT triggers on all tables');
        console.log('   - ✅ AFTER UPDATE triggers on all tables');
        console.log('   - ✅ Views for daily activity reporting');
        console.log('   - ✅ Automatic audit logging');
        console.log('\n📊 Available Views:');
        console.log('   1. daily_activity_view - Activity summary by day');
        console.log('   2. employee_activity_view - Detailed employee actions');
        console.log('   3. sales_performance_view - Sales metrics with joins');
        console.log('   4. inventory_change_view - Product quantity changes');
        console.log('   5. user_activity_summary - User action statistics');
    });
});