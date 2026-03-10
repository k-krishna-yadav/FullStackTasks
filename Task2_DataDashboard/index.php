<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Dashboard</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="dashboard">
        <h1>📊 Employee Management Dashboard</h1>
        
        <!-- Stats Cards -->
        <div class="stats-container">
            <?php
            $conn = new mysqli("localhost", "root", "", "company_db");
            
            // Total employees
            $result = $conn->query("SELECT COUNT(*) as total FROM employees");
            $total = $result->fetch_assoc()['total'];
            
            // Department counts
            $dept_result = $conn->query("SELECT department, COUNT(*) as count FROM employees GROUP BY department");
            ?>
            
            <div class="stat-card">
                <h3>Total Employees</h3>
                <p class="stat-number"><?php echo $total; ?></p>
            </div>
            
            <?php
            while($dept = $dept_result->fetch_assoc()) {
                echo "<div class='stat-card'>";
                echo "<h3>" . $dept['department'] . "</h3>";
                echo "<p class='stat-number'>" . $dept['count'] . "</p>";
                echo "</div>";
            }
            ?>
        </div>
        
        <!-- Filters and Sorting -->
        <div class="controls">
            <div class="filter-box">
                <label>Filter by Department:</label>
                <select id="deptFilter" onchange="applyFilters()">
                    <option value="all">All Departments</option>
                    <?php
                    $conn->query("SELECT * FROM employees"); // reset
                    $depts = $conn->query("SELECT DISTINCT department FROM employees");
                    while($dept = $depts->fetch_assoc()) {
                        echo "<option value='" . $dept['department'] . "'>" . $dept['department'] . "</option>";
                    }
                    ?>
                </select>
            </div>
            
            <div class="sort-box">
                <label>Sort by:</label>
                <select id="sortBy" onchange="applyFilters()">
                    <option value="name">Name</option>
                    <option value="hire_date">Hire Date</option>
                    <option value="department">Department</option>
                    <option value="salary">Salary</option>
                </select>
                
                <select id="sortOrder" onchange="applyFilters()">
                    <option value="ASC">Ascending</option>
                    <option value="DESC">Descending</option>
                </select>
            </div>
        </div>
        
        <!-- Employees Table -->
        <div id="employeeTable">
            <?php include 'get_employees.php'; ?>
        </div>
    </div>
    
    <script>
        function applyFilters() {
            const dept = document.getElementById('deptFilter').value;
            const sort = document.getElementById('sortBy').value;
            const order = document.getElementById('sortOrder').value;
            
            fetch(`get_employees.php?dept=${dept}&sort=${sort}&order=${order}`)
                .then(response => response.text())
                .then(data => {
                    document.getElementById('employeeTable').innerHTML = data;
                });
        }
        
        // Auto-refresh every 30 seconds
        setInterval(applyFilters, 30000);
    </script>
</body>
</html>