const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// API endpoint to get students data
app.get('/api/students', (req, res) => {
    const students = [
        { id: 1, name: 'John Smith', department: 'Computer Science', date: '2024-01-15' },
        { id: 2, name: 'Emma Wilson', department: 'Mathematics', date: '2024-01-20' },
        { id: 3, name: 'Michael Brown', department: 'Physics', date: '2024-02-01' },
        { id: 4, name: 'Sarah Davis', department: 'Computer Science', date: '2024-02-10' },
        { id: 5, name: 'James Johnson', department: 'Chemistry', date: '2024-02-15' },
        { id: 6, name: 'Lisa Anderson', department: 'Mathematics', date: '2024-02-20' },
        { id: 7, name: 'Robert Taylor', department: 'Physics', date: '2024-03-01' },
        { id: 8, name: 'Maria Garcia', department: 'Computer Science', date: '2024-03-05' },
        { id: 9, name: 'David Martinez', department: 'Chemistry', date: '2024-03-10' },
        { id: 10, name: 'Jennifer Lee', department: 'Mathematics', date: '2024-03-15' },
        { id: 11, name: 'Thomas White', department: 'Computer Science', date: '2024-03-20' },
        { id: 12, name: 'Patricia Moore', department: 'Physics', date: '2024-03-25' }
    ];
    res.json(students);
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📊 Open your browser and go to: http://localhost:${port}`);
});