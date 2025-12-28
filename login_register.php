<?php
session_start();
require_once 'config_db.php';

// ---------------- REGISTER ----------------
if (isset($_POST['register'])) {
    //  To clear any previous session messages to ensure a clean state
    unset($_SESSION['login_error']);
    unset($_SESSION['register_error']);

    $name = $_POST['name'];
    $id = $_POST['college-id'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $fav_subject = $_POST['fav_subject'] ?? ''; // New security question answer

    // To check if the ID already exists
    $stmt = $conn->prepare("SELECT id FROM `author` WHERE id = ?");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $_SESSION['register_error'] = 'ID is already registered.';
        $_SESSION['active_form'] = 'register';
    } else {
        // To use prepared statements for security to prevent SQL injection
        $stmt = $conn->prepare("INSERT INTO `author` (name, id, password, fav_subject) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $name, $id, $password, $fav_subject);

        if ($stmt->execute()) {
            $_SESSION['register_success'] = 'Registration successful. Please log in.';
            $_SESSION['active_form'] = 'login';
        } else {
            $_SESSION['register_error'] = 'Registration failed. Please try again.';
            $_SESSION['active_form'] = 'register';
        }
    }
    
    header("Location: index.php");
    exit();
}

// ---------------- LOGIN ----------------
if (isset($_POST['login'])) {
    // To clear any previous session messages
    unset($_SESSION['login_error']);
    unset($_SESSION['register_success']);
    unset($_SESSION['register_error']);
    unset($_SESSION['forgot_password_error']);

    $id = $_POST['id'];
    $password = $_POST['password'];

    // To use prepared statements for security
    $stmt = $conn->prepare("SELECT * FROM `author` WHERE id = ?");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // To use password_verify() to securely compare the password
        if (password_verify($password, $user['password'])) {
            //To regenerate session ID for security
            session_regenerate_id(true);
            
            // to set all session variables for consistency across all pages
            $_SESSION['user_id'] = $user['id'];        // For dashboard.php
            $_SESSION['user_name'] = $user['name'];    // For dashboard.php
            $_SESSION['id'] = $user['id'];             // For interact.php (backward compatibility)
            $_SESSION['name'] = $user['name'];         // For interact.php (backward compatibility)
            $_SESSION['logged_in'] = true;             // Additional security check
            $_SESSION['login_time'] = time();          // For session timeout
            
            // to Close database connection
            $stmt->close();
            $conn->close();
            
            // to Redirect to interaction page after successful login
            header("Location: interface.php");
            exit();
        }
    }
    
    // If user was not found or password is incorrect
    $_SESSION['login_error'] = 'Incorrect ID or password.';
    $_SESSION['active_form'] = 'login';
    
    header("Location: index.php");
    exit();
}
?>