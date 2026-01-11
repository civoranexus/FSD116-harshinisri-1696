// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const rememberMe = document.getElementById('rememberMe');
const secureSession = document.getElementById('secureSession');
const loginButton = document.getElementById('loginButton');
const roleTabs = document.querySelectorAll('.role-tab');
const roleDescription = document.getElementById('roleDescription');
const passwordStrength = document.querySelector('.strength-bar');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');
const closeError = document.getElementById('closeError');
const tryAgain = document.getElementById('tryAgain');
const modalClose = document.querySelector('.modal-close');

// Role descriptions
const roleDescriptions = {
    staff: "Access inventory management, order processing, and batch tracking",
    customer: "Browse plants, place orders, and track your purchases",
    admin: "Manage system settings, users, and view analytics reports"
};

// Role redirection URLs
const roleRedirects = {
    staff: '/staff/dashboard',
    customer: '/customer/dashboard',
    admin: '/admin/dashboard'
};

// Current selected role
let selectedRole = 'staff';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeLoginPage();
    setupEventListeners();
    checkRememberedUser();
});

function initializeLoginPage() {
    // Set initial role description
    updateRoleDescription('staff');
    
    // Check for URL parameters (for redirects)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectRole = urlParams.get('role');
    if (redirectRole && roleDescriptions[redirectRole]) {
        selectRoleTab(redirectRole);
    }
    
    // Check for error message in URL
    const error = urlParams.get('error');
    if (error) {
        showError(decodeURIComponent(error));
    }
}

function setupEventListeners() {
    // Role tab selection
    roleTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const role = tab.dataset.role;
            selectRoleTab(role);
        });
    });
    
    // Password visibility toggle
    togglePassword.addEventListener('click', togglePasswordVisibility);
    
    // Password strength indicator
    passwordInput.addEventListener('input', updatePasswordStrength);
    
    // Form submission
    loginForm.addEventListener('submit', handleLogin);
    
    // Modal controls
    closeError.addEventListener('click', () => hideModal(errorModal));
    tryAgain.addEventListener('click', () => {
        hideModal(errorModal);
        loginForm.reset();
        usernameInput.focus();
    });
    modalClose.addEventListener('click', () => hideModal(errorModal));
    
    // Close modal on background click
    errorModal.addEventListener('click', (e) => {
        if (e.target === errorModal) {
            hideModal(errorModal);
        }
    });
    
    // Social login buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', handleSocialLogin);
    });
    
    // Quick links
    document.querySelectorAll('.quick-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.href === '#') {
                e.preventDefault();
                // Handle internal quick actions
            }
        });
    });
}

function selectRoleTab(role) {
    // Update UI
    roleTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.role === role);
    });
    
    // Update role description
    updateRoleDescription(role);
    
    // Update selected role
    selectedRole = role;
    
    // Update form hints based on role
    updateFormHints(role);
}

function updateRoleDescription(role) {
    roleDescription.textContent = roleDescriptions[role];
}

function updateFormHints(role) {
    const usernameHint = document.querySelector('.input-hint');
    const usernameLabel = document.querySelector('label[for="username"] .icon');
    
    switch(role) {
        case 'staff':
            usernameHint.textContent = 'Use your staff ID or registered email';
            usernameLabel.textContent = '👨‍💼';
            break;
        case 'admin':
            usernameHint.textContent = 'Use your administrator email';
            usernameLabel.textContent = '👑';
            break;
        case 'customer':
            usernameHint.textContent = 'Use your registered email address';
            usernameLabel.textContent = '👤';
            break;
    }
}

function togglePasswordVisibility() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.querySelector('.icon').textContent = type === 'password' ? '👁️' : '🙈';
}

function updatePasswordStrength() {
    const password = passwordInput.value;
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    
    passwordStrength.style.width = `${strength}%`;
    
    // Update color based on strength
    if (strength < 50) {
        passwordStrength.style.backgroundColor = '#ff4444';
    } else if (strength < 75) {
        passwordStrength.style.backgroundColor = '#ffbb33';
    } else {
        passwordStrength.style.backgroundColor = '#00C851';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    // Prepare login data
    const loginData = {
        username: usernameInput.value.trim(),
        password: passwordInput.value,
        role: selectedRole,
        rememberMe: rememberMe.checked,
        secureSession: secureSession.checked
    };
    
    try {
        // Simulate API call (replace with actual API endpoint)
        const response = await simulateLogin(loginData);
        
        if (response.success) {
            // Save remember me preference
            if (loginData.rememberMe) {
                saveUserPreference(loginData.username);
            }
            
            // Redirect based on role
            window.location.href = roleRedirects[selectedRole];
        } else {
            throw new Error(response.message || 'Login failed');
        }
    } catch (error) {
        showError(error.message);
        setLoadingState(false);
    }
}

function validateForm() {
    let isValid = true;
    
    // Clear previous errors
    clearErrors();
    
    // Validate username
    if (!usernameInput.value.trim()) {
        showFieldError(usernameInput, 'Please enter your email or username');
        isValid = false;
    } else if (!isValidUsername(usernameInput.value.trim())) {
        showFieldError(usernameInput, 'Please enter a valid email or username');
        isValid = false;
    }
    
    // Validate password
    if (!passwordInput.value) {
        showFieldError(passwordInput, 'Please enter your password');
        isValid = false;
    } else if (passwordInput.value.length < 6) {
        showFieldError(passwordInput, 'Password must be at least 6 characters');
        isValid = false;
    }
    
    return isValid;
}

function isValidUsername(username) {
    // Check if it's an email or alphanumeric username
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    
    return emailRegex.test(username) || usernameRegex.test(username);
}

function showFieldError(input, message) {
    input.classList.add('error');
    input.parentElement.insertAdjacentHTML('afterend', 
        `<div class="error-message">${message}</div>`
    );
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.form-control.error').forEach(el => {
        el.classList.remove('error');
    });
}

async function simulateLogin(loginData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock validation (replace with actual API call)
    const mockUsers = {
        'staff@nursery.com': { password: 'staff123', role: 'staff' },
        'customer@email.com': { password: 'customer123', role: 'customer' },
        'admin@civorax.com': { password: 'admin123', role: 'admin' }
    };
    
    const user = mockUsers[loginData.username];
    
    if (!user) {
        return {
            success: false,
            message: 'User not found. Please check your credentials.'
        };
    }
    
    if (user.password !== loginData.password) {
        return {
            success: false,
            message: 'Incorrect password. Please try again.'
        };
    }
    
    if (user.role !== loginData.role) {
        return {
            success: false,
            message: `This account is not registered as ${loginData.role}. Please select the correct role.`
        };
    }
    
    // Mock successful login
    return {
        success: true,
        user: {
            username: loginData.username,
            role: user.role,
            token: 'mock-jwt-token-' + Date.now()
        }
    };
}

function handleSocialLogin(e) {
    const provider = e.currentTarget.classList.contains('google') ? 'google' : 'microsoft';
    
    // Show loading
    setLoadingState(true);
    
    // Simulate social login
    setTimeout(() => {
        alert(`Social login with ${provider} would be implemented here.\n\nFor demo purposes, please use the form above.`);
        setLoadingState(false);
    }, 1000);
}

function setLoadingState(isLoading) {
    if (isLoading) {
        loginButton.classList.add('loading');
        loginButton.disabled = true;
        usernameInput.disabled = true;
        passwordInput.disabled = true;
    } else {
        loginButton.classList.remove('loading');
        loginButton.disabled = false;
        usernameInput.disabled = false;
        passwordInput.disabled = false;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    showModal(errorModal);
}

function showModal(modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function saveUserPreference(username) {
    localStorage.setItem('rememberedUser', username);
    localStorage.setItem('rememberedRole', selectedRole);
}

function checkRememberedUser() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    const rememberedRole = localStorage.getItem('rememberedRole');
    
    if (rememberedUser) {
        usernameInput.value = rememberedUser;
        rememberMe.checked = true;
        
        if (rememberedRole && roleDescriptions[rememberedRole]) {
            selectRoleTab(rememberedRole);
        }
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl + Enter to submit form
    if (e.ctrlKey && e.key === 'Enter') {
        if (!loginButton.disabled) {
            loginForm.requestSubmit();
        }
    }
    
    // Escape to close modal
    if (e.key === 'Escape' && errorModal.style.display === 'flex') {
        hideModal(errorModal);
    }
});

// Auto-focus username on page load
window.addEventListener('load', () => {
    if (!usernameInput.value) {
        usernameInput.focus();
    }
});