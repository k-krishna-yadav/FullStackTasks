<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "student_db";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "SELECT * FROM students ORDER BY id DESC";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    echo "<table>";
    echo "<tr><th>Name</th><th>Email</th><th>DOB</th><th>Department</th><th>Phone</th></tr>";
    
    while($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['name'] . "</td>";
        echo "<td>" . $row['email'] . "</td>";
        echo "<td>" . $row['dob'] . "</td>";
        echo "<td>" . $row['department'] . "</td>";
        echo "<td>" . $row['phone'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='text-align: center; color: #666;'>No students registered yet.</p>";
}

$conn->close();
?>