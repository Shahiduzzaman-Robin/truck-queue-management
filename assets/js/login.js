// Login functionality
const API_BASE = 'http://localhost:3000/api';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const messageBox = document.getElementById('messageBox');
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');

    // Show loading state
    loginText.style.display = 'none';
    loginSpinner.style.display = 'inline-block';
    messageBox.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            messageBox.textContent = '✅ Login successful! Redirecting...';
            messageBox.className = 'success';
            messageBox.style.display = 'block';
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            messageBox.textContent = `❌ ${data.message}`;
            messageBox.className = 'error';
            messageBox.style.display = 'block';
            loginText.style.display = 'inline';
            loginSpinner.style.display = 'none';
        }
    } catch (error) {
        console.error('Login error:', error);
        messageBox.textContent = `❌ Connection failed: ${error.message}`;
        messageBox.className = 'error';
        messageBox.style.display = 'block';
        loginText.style.display = 'inline';
        loginSpinner.style.display = 'none';
    }
});
