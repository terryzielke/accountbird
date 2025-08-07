<?php
// Default database credentials
$host = 'localhost';
$db   = 'local';
$user = 'root';
$pass = 'root';
$charset = 'utf8mb4';

// Is this the production server or local?
$url = substr( strtolower( $_SERVER['SERVER_NAME'] ), -5); 

if($url != 'local'){
    $host = 'localhost';
    $db   = 'local';
    $user = 'root';
    $pass = 'root';
    $charset = 'utf8mb4';
}
else{
    $host = 'localhost';
    $db   = 'local';
    $user = 'root';
    $pass = 'root';
    $charset = 'utf8mb4';
}

// Create connection
$conn = new mysqli($host, $user, $pass, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if the admins table exists
$checkTableQuery = "SHOW TABLES LIKE 'admins'";
$result = $conn->query($checkTableQuery);

if ($result->num_rows == 0) {
    // Table does not exist, run initilization file
    require_once 'admin/init.php';
} else {
    $database_connection = true;
}

$conn->close();
?>