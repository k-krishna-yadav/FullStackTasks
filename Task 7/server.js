const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Store feedback in memory (in real app, this would be a database)
let feedbacks = [];

// API to submit feedback
app.post('/api/feedback', (req, res) => {
    const feedback = {
        id: Date.now(),
        ...req.body,
        submitted_at: new Date().toISOString()
    };
    
    feedbacks.push(feedback);
    
    res.json({
        success: true,
        message: 'Feedback submitted successfully!',
        feedback: feedback
    });
});

// API to get all feedback
app.get('/api/feedback', (req, res) => {
    res.json(feedbacks);
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Task 7: Interactive Feedback Form running at http://localhost:${port}`);
    console.log('\n📝 Features:');
    console.log('   - ✅ Keypress validation');
    console.log('   - ✅ Mouse hover effects');
    console.log('   - ✅ Double-click submit');
    console.log('   - ✅ Reusable validation functions');
});