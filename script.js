// Global variable to store students data
let students = [];

// Fetch students from API
async function fetchStudents() {
    try {
        const response = await fetch('/api/students');
        students = await response.json();
        loadStudents();
    } catch (error) {
        console.error('Error fetching students:', error);
        document.getElementById('studentBody').innerHTML = 
            '<tr><td colspan="4" class="loading">Error loading data. Make sure server is running on port 3000</td></tr>';
    }
}

// Load students and populate filters
function loadStudents() {
    displayStudents(students);
    populateDepartmentFilter();
    updateDepartmentStats();
}

// Display students in table
function displayStudents(data) {
    const tbody = document.getElementById('studentBody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">No records found</td></tr>';
        return;
    }
    
    data.forEach(student => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td><span class="department-badge">${student.department}</span></td>
            <td>${formatDate(student.date)}</td>
        `;
    });
}

// Format date to readable format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Get unique departments
function getDepartments() {
    return [...new Set(students.map(s => s.department))];
}

// Populate department filter dropdown
function populateDepartmentFilter() {
    const select = document.getElementById('departmentFilter');
    const departments = getDepartments();
    
    select.innerHTML = '<option value="all">All Departments</option>';
    
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        select.appendChild(option);
    });
}

// Update department statistics
function updateDepartmentStats() {
    const departments = getDepartments();
    const statsContainer = document.getElementById('stats');
    statsContainer.innerHTML = '';
    
    // Total students card
    const totalCard = document.createElement('div');
    totalCard.className = 'stat-card';
    totalCard.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    totalCard.innerHTML = `
        Total Students
        <span>${students.length}</span>
    `;
    statsContainer.appendChild(totalCard);
    
    // Department wise cards
    departments.forEach((dept, index) => {
        const count = students.filter(s => s.department === dept).length;
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        const colors = [
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        ];
        
        card.style.background = colors[index % colors.length];
        card.innerHTML = `
            ${dept}
            <span>${count} ${count === 1 ? 'Student' : 'Students'}</span>
        `;
        statsContainer.appendChild(card);
    });
}

// Sort students
function sortStudents(studentsToSort, sortBy, sortOrder) {
    return [...studentsToSort].sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === 'name') {
            comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'date') {
            comparison = new Date(a.date) - new Date(b.date);
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
    });
}

// Filter students by department
function filterStudents() {
    const department = document.getElementById('departmentFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    const sortOrder = document.getElementById('sortOrder').value;
    
    let filteredStudents = department === 'all' 
        ? students 
        : students.filter(s => s.department === department);
    
    filteredStudents = sortStudents(filteredStudents, sortBy, sortOrder);
    displayStudents(filteredStudents);
}

// Event listeners
document.getElementById('sortBy').addEventListener('change', filterStudents);
document.getElementById('sortOrder').addEventListener('change', filterStudents);
document.getElementById('departmentFilter').addEventListener('change', filterStudents);

// Initialize on page load
window.onload = function() {
    fetchStudents();
};