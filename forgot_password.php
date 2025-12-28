<?php
session_start();
require_once 'config_db.php';

if (isset($_POST['verify'])) {
    $id = $_POST['id'] ?? '';
    $fav_subject = $_POST['fav_subject'] ?? '';

    unset($_SESSION['forgot_password_error']);

    $stmt = $conn->prepare("SELECT id FROM `users` WHERE id = ? AND fav_subject = ?");
    $stmt->bind_param("ss", $id, $fav_subject);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // if Verification is successful then to Store the ID in the session and redirect to the reset page.
        $_SESSION['reset_id'] = $id;
        header("Location: reset_password.php");
        exit();
    } else {
        $_SESSION['forgot_password_error'] = 'Verification failed. Incorrect ID or subject answer.';
        $_SESSION['active_form'] = 'forgot-password';
        header("Location: index.php");
        exit();
    }
}
?>