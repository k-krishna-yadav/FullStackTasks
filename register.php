<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "student_db";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $dob = $_POST['dob'];
    $department = $_POST['department'];
    $phone = $_POST['phone'];
    
    $sql = "INSERT INTO students (name, email, dob, department, phone) 
            VALUES ('$name', '$email', '$dob', '$department', '$phone')";
    
    if ($conn->query($sql) === TRUE) {
        header("Location: index.html?success=1");
    } else {
        header("Location: index.html?error=1");
    }
}

$conn->close();
?>