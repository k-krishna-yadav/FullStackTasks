const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Session setup
app.use(session({
    secret: 'your-secret-key-123',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 } // 30 minutes
}));

// Mock database (in real app, this would be a real database)
const users = [
    { id: 1, username: 'john', password: 'john123', email: 'john@example.com', name: 'John Smith' },
    { id: 2, username: 'emma', password: 'emma123', email: 'emma@example.com', name: 'Emma Wilson' },
    { id: 3, username: 'michael', password: 'mike123', email: 'michael@example.com', name: 'Michael Brown' },
    { id: 4, username: 'admin', password: 'admin123', email: 'admin@system.com', name: 'Administrator' }
];

// Login API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Find user
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email
        };
        
        res.json({
            success: true,
            message: 'Login successful!',
            user: req.session.user
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    }
});

// Check session
app.get('/api/check-session', (req, res) => {
    if (req.session.user) {
        res.json({
            loggedIn: true,
            user: req.session.user
        });
    } else {
        res.json({
            loggedIn: false
        });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Get all users (protected - admin only)
app.get('/api/users', (req, res) => {
    if (req.session.user && req.session.user.username === 'admin') {
        res.json(users.map(u => ({
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email
        })));
    } else {
        res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve dashboard (protected)
app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'dashboard.html'));
    } else {
        res.redirect('/');
    }
});

app.listen(port, () => {
    console.log(`🚀 Task 3: Login System running at http://localhost:${port}`);
    console.log(`📝 Test credentials:`);
    console.log(`   - Username: john, Password: john123`);
    console.log(`   - Username: emma, Password: emma123`);
    console.log(`   - Username: admin, Password: admin123`);
});