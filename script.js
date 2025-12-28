document.addEventListener('DOMContentLoaded', () => {

    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const showForgotPasswordLink = document.getElementById('show-forgot-password');
    const showLoginFromFP = document.getElementById('show-login-from-fp');

    function toggleForms(formName) {
        document.querySelectorAll('.card-content').forEach(form => {
            form.classList.remove('active');
        });
        document.querySelector(`.card-content.${formName}-form`).classList.add('active');
    }

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms('register');
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms('login');
        });
    }

    if (showForgotPasswordLink) {
        showForgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms('forgot-password');
        });
    }

    if (showLoginFromFP) {
        showLoginFromFP.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms('login');
        });
    }

    const whyLink = document.getElementById('show-why-text');
    if (whyLink) {
        whyLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert("It's crucial to remember the entry you made as it is necessary to create a new password in case you forget the previous one.");
        });
    }

    window.togglePasswordVisibility = function(id) {
        const passwordInput = document.getElementById(id);
        const icon = passwordInput.nextElementSibling.querySelector('i');
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = "password";
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };
});

window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        setTimeout(() => {
            fetch('set_preloader_session.php');
            preloader.classList.add('fade-out');
        }, 2000);
    }
});

