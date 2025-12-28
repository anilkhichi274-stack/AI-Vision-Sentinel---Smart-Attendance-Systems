<?php
session_start();
require_once 'config_db.php';

// Check if the user has been verified to reset their password
if (!isset($_SESSION['reset_id'])) {
    header("Location: index.php");
    exit();
}

$errors = $_SESSION['reset_password_error'] ?? '';
unset($_SESSION['reset_password_error']);

// Handle password reset submission
if (isset($_POST['reset_password'])) {
    $id = $_SESSION['reset_id'];
    $new_password = $_POST['new_password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';

    if ($new_password !== $confirm_password) {
        $_SESSION['reset_password_error'] = 'Passwords do not match.';
        header("Location: reset_password.php");
        exit();
    }

    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE `author` SET password = ? WHERE id = ?");
    $stmt->bind_param("ss", $hashed_password, $id);

    if ($stmt->execute()) {
        // Password successfully updated, clear the session variable and redirect to login
        unset($_SESSION['reset_id']);
        $_SESSION['login_error'] = 'Password successfully reset. Please log in with your new password.';
        header("Location: index.php");
        exit();
    } else {
        $_SESSION['reset_password_error'] = 'Failed to update password. Please try again.';
        header("Location: reset_password.php");
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>

    <div class="container">
        <div class="card">
            <div class="card-content reset-password-form active">
                <h1 class="welcome-text">Set New Password</h1>
                <?= !empty($errors) ? "<p class='error-message'>$errors</p>" : ''; ?>
                <p class="subtitle">Enter and confirm your new password</p>
                <form id="reset-password-form" action="reset_password.php" method="post">
                    <div class="input-group password-group">
                        <label for="new-password">New Password</label>
                        <input type="password" id="new-password" name="new_password" required>
                        <span class="password-toggle" onclick="togglePasswordVisibility('new-password')">
                            <i class="fas fa-eye"></i>
                        </span>
                    </div>
                    <div class="input-group password-group">
                        <label for="confirm-password">Confirm Password</label>
                        <input type="password" id="confirm-password" name="confirm_password" required>
                        <span class="password-toggle" onclick="togglePasswordVisibility('confirm-password')">
                            <i class="fas fa-eye"></i>
                        </span>
                    </div>
                    <button type="submit" name="reset_password" class="btn login-btn">Reset Password</button>
                </form>
            </div>
        </div>
    </div>
    
    <script src="script.js"></script>
</body>
</html>