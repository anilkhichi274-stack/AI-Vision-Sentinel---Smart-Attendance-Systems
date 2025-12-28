<?php
// Database connection parameters
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "mark_db";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    // We use a simplified error message for security in a live environment
    die("Database connection failed.");
}

// Set character set
$conn->set_charset("utf8mb4");

// PYTHON_SERVER configuration REMOVED from config_db.php
// define('PYTHON_SERVER', 'http://localhost:5000'); // <--- यह लाइन हटा दी गई है
?>