<?php
session_start();

$errors = [
    'login' => $_SESSION['login_error'] ?? '',
    'register' => $_SESSION['register_error'] ?? ''
];
$activeForm = $_SESSION['active_form'] ?? 'login';

$regSuccess = $_SESSION['register_success'] ?? '';
if (!empty($regSuccess)) {
    unset($_SESSION['register_success']);
    $activeForm = 'login';
}

function showError($error) {
    return !empty($error) ? "<p class='error-message'>$error</p>" : '';
}
function idActiveForm($formName, $activeForm) {
    return $formName === $activeForm ? 'active' : '';
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Attendance Interface</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>
    <?php if (!isset($_SESSION['preloader_shown'])): ?>
        <div class="preloader">
            <div class="preloader-text">Welcome to the new realm of Attendance Marking</div>
        </div>
    <?php endif; ?>
    <div class="container">
        <div class="card">
            <div class="card-content login-form <?= idActiveForm('login', $activeForm) ?>">
                <h1 class="welcome-text">Welcome!</h1>
                <?php if(!empty($regSuccess)): ?>
                    <p class="success-message"><?php echo $regSuccess; ?></p>
                <?php else: ?>
                    <?= showError($errors['login']); ?>
                <?php endif; ?>
                <p class="subtitle">Enter your college ID and password</p>
                <form id="login-form" action="login_register.php" method="post">
                    <div class="input-group">
                        <label for="college-id">College ID</label>
                        <input type="text" id="college-id" name="id" placeholder="Your College ID" required>
                    </div>
                    <div class="input-group password-group">
                        <label for="login-password">Password</label>
                        <input type="password" id="login-password" name="password" placeholder="Your Password" required>
                        <span class="password-toggle" onclick="togglePasswordVisibility('login-password')">
                            <i class="fas fa-eye"></i>
                        </span>
                    </div>
                    <a href="#" class="forgot-password" id="show-forgot-password">Forgot Password?</a>
                    <button type="submit" name="login" class="btn login-btn">Login</button>
                    <p class="register-link">New user? <a href="#" id="show-register">Register here</a></p>
                </form>
            </div>
            
            <div class="card-content register-form <?= idActiveForm('register', $activeForm) ?>">
                <h1 class="welcome-text">Register</h1>
                <?= showError($errors['register']); ?>
                <p class="subtitle">Create your new account</p>
                <form id="register-form" action="login_register.php" method="post">
                    <div class="input-group">
                        <label for="reg-name">Full Name</label>
                        <input type="text" id="reg-name" name="name" placeholder="Your Full Name" required>
                    </div>
                    <div class="input-group">
                        <label for="reg-college-id">College ID</label>
                        <input type="text" id="reg-college-id" name="college-id" placeholder="Your College ID" required>
                    </div>
                    <div class="input-group password-group">
                        <label for="reg-password">Password</label>
                        <input type="password" id="reg-password" name="password" placeholder="Create Password" required>
                        <span class="password-toggle" onclick="togglePasswordVisibility('reg-password')">
                            <i class="fas fa-eye"></i>
                        </span>
                    </div>
                    <div class="input-group">
                        <label for="fav-subject">Choose the subject you liked the most</label>
                        <input type="text" id="fav-subject" name="fav_subject" placeholder="e.g., Data Science" required>
                    </div>
                    <div class="input-group">
                        <a href="#" class="why-link" id="show-why-text">Why?</a>
                    </div>
                    <button type="submit" name="register" class="btn register-btn">Register</button>
                    <p class="register-link">Already have an account? <a href="#" id="show-login">Login here</a></p>
                </form>
            </div>

            <div class="card-content forgot-password-form <?= idActiveForm('forgot-password', $activeForm) ?>">
                <h1 class="welcome-text">Reset Password</h1>
                <?= showError($_SESSION['forgot_password_error'] ?? ''); ?>
                <p class="subtitle">Verify your identity to proceed</p>
                <form id="forgot-password-form" action="forgot_password.php" method="post">
                    <div class="input-group">
                        <label for="fp-college-id">College ID</label>
                        <input type="text" id="fp-college-id" name="id" placeholder="Your College ID" required>
                    </div>
                    <div class="input-group">
                        <label for="fp-fav-subject">Your Favorite Subject</label>
                        <input type="text" id="fp-fav-subject" name="fav_subject" placeholder="Your Favorite Subject" required>
                    </div>
                    <button type="submit" name="verify" class="btn login-btn">Verify</button>
                    <p class="register-link">Remember your password? <a href="#" id="show-login-from-fp">Login here</a></p>
                </form>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>