<?php
$conn = new mysqli("localhost", "root", "", "company_db");

$dept = isset($_GET['dept']) ? $_GET['dept'] : 'all';
$sort = isset($_GET['sort']) ? $_GET['sort'] : 'name';
$order = isset($_GET['order']) ? $_GET['order'] : 'ASC';

// Validate sort column to prevent SQL injection
$allowed_sorts = ['name', 'hire_date', 'department', 'salary'];
$sort = in_array($sort, $allowed_sorts) ? $sort : 'name';

// Build query
$sql = "SELECT * FROM employees";
if ($dept != 'all') {
    $dept = $conn->real_escape_string($dept);
    $sql .= " WHERE department = '$dept'";
}
$sql .= " ORDER BY $sort $order";

$result = $conn->query($sql);

if ($result->num_rows > 0) {
    echo "<table class='employee-table'>";
    echo "<thead>";
    echo "<tr>";
    echo "<th>ID</th>";
    echo "<th>Name</th>";
    echo "<th>Email</th>";
    echo "<th>Department</th>";
    echo "<th>Salary</th>";
    echo "<th>Hire Date</th>";
    echo "<th>Status</th>";
    echo "</tr>";
    echo "</thead>";
    echo "<tbody>";
    
    while($row = $result->fetch_assoc()) {
        $status_class = $row['status'] == 'Active' ? 'status-active' : 'status-inactive';
        echo "<tr>";
        echo "<td>" . $row['id'] . "</td>";
        echo "<td>" . $row['name'] . "</td>";
        echo "<td>" . $row['email'] . "</td>";
        echo "<td>" . $row['department'] . "</td>";
        echo "<td>$" . number_format($row['salary'], 2) . "</td>";
        echo "<td>" . date('M d, Y', strtotime($row['hire_date'])) . "</td>";
        echo "<td><span class='$status_class'>" . $row['status'] . "</span></td>";
        echo "</tr>";
    }
    
    echo "</tbody>";
    echo "</table>";
    
    // Summary
    echo "<div class='summary'>";
    echo "<p>Showing " . $result->num_rows . " employees</p>";
    
    // Department summary
    $summary_sql = "SELECT department, COUNT(*) as count, AVG(salary) as avg_salary 
                    FROM employees";
    if ($dept != 'all') {
        $summary_sql .= " WHERE department = '$dept'";
    }
    $summary_sql .= " GROUP BY department";
    
    $summary = $conn->query($summary_sql);
    
    echo "<div class='dept-summary'>";
    while($row = $summary->fetch_assoc()) {
        echo "<span class='dept-badge'>";
        echo $row['department'] . ": " . $row['count'] . " employees";
        echo " (Avg: $" . number_format($row['avg_salary'], 0) . ")";
        echo "</span>";
    }
    echo "</div>";
    echo "</div>";
    
} else {
    echo "<p class='no-data'>No employees found</p>";
}

$conn->close();
?>