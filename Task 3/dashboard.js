// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    startSessionTimer();
});

async function checkAuth() {
    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();
        
        if (!data.loggedIn) {
            window.location.href = '/';
            return;
        }
        
        // Update UI with user data
        document.getElementById('userName').textContent = data.user.name;
        document.getElementById('profileUsername').textContent = data.user.username;
        document.getElementById('profileEmail').textContent = data.user.email;
        document.getElementById('profileId').textContent = data.user.id;
        document.getElementById('userInfo').textContent = `Logged in as @${data.user.username}`;
        
        // Show admin panel for admin user
        if (data.user.username === 'admin') {
            document.getElementById('adminPanel').style.display = 'block';
            loadAllUsers();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/';
    }
}

async function loadAllUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';
        
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <h4>${user.name}</h4>
                <p>@${user.username}</p>
                <p>📧 ${user.email}</p>
                <p>🆔 ID: ${user.id}</p>
            `;
            usersList.appendChild(userCard);
        });
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

function startSessionTimer() {
    let minutes = 30;
    let seconds = 0;
    
    const timer = setInterval(() => {
        if (seconds === 0) {
            if (minutes === 0) {
                clearInterval(timer);
                logout();
                return;
            }
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        
        document.getElementById('sessionTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}