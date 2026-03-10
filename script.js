// Client-side validation and login handling
document.addEventListener('DOMContentLoaded', function() {
    checkSession();
});

function validateAndLogin(event) {
    event.preventDefault();
    
    // Clear previous errors
    clearErrors();
    
    // Get values
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Validation
    let isValid = true;
    
    if (username.length < 3) {
        showError('usernameError', 'Username must be at least 3 characters');
        document.getElementById('username').classList.add('error');
        isValid = false;
    }
    
    if (password.length < 4) {
        showError('passwordError', 'Password must be at least 4 characters');
        document.getElementById('password').classList.add('error');
        isValid = false;
    }
    
    if (!isValid) {
        return false;
    }
    
    // Show loading
    document.getElementById('loginBtn').disabled = true;
    document.getElementById('spinner').style.display = 'inline';
    
    // Send login request
    login(username, password);
    
    return false;
}

async function login(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Redirect to dashboard
            window.location.href = '/dashboard';
        } else {
            showErrorMessage(data.message);
        }
    } catch (error) {
        showErrorMessage('Connection error. Make sure server is running.');
    } finally {
        // Hide loading
        document.getElementById('loginBtn').disabled = false;
        document.getElementById('spinner').style.display = 'none';
    }
}

function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

function showErrorMessage(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

function clearErrors() {
    document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.getElementById('errorMessage').style.display = 'none';
}

function fillCredentials(username, password) {
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
    clearErrors();
}

async function checkSession() {
    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();
        
        if (data.loggedIn) {
            window.location.href = '/dashboard';
        }
    } catch (error) {
        console.log('Not logged in');
    }
}