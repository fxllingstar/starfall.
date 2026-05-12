 const starsContainer = document.getElementById('stars');
        
        // Create regular twinkling stars
        for (let i = 0; i < 150; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 4 + 's';
            starsContainer.appendChild(star);
        }
 
        // Create shooting stars
        for (let i = 0; i < 3; i++) {
            const shootingStar = document.createElement('div');
            shootingStar.className = 'shooting-star';
            shootingStar.style.left = Math.random() * 100 + '%';
            shootingStar.style.top = Math.random() * 50 + '%';
            shootingStar.style.animationDelay = Math.random() * 3 + 's';
            shootingStar.style.animationDuration = (2 + Math.random() * 2) + 's';
            starsContainer.appendChild(shootingStar);
        }
 


      const API_URL = 'http://localhost:8000';


// Form submissions
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // AUDIT FIX: Include credentials to allow HttpOnly cookies
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();
        if (response.ok) {
            // AUDIT FIX: Store only non-sensitive ID, token is now in a secure cookie
            localStorage.setItem('starfall_user_id', result.user_id);
            alert('Login successful! Redirecting...');
            window.location.href = 'chat.html'; // Redirect to chat
        } else {
            alert(result.detail || 'Login failed :<');
        }
    } catch (err) {
        console.error("Login Error:", err);
    }
});

document.getElementById('signupFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupPasswordConfirm').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, email, password })
        });
        const result = await response.json();
        if (response.ok) {
            localStorage.setItem('starfall_user_id', result.user_id);
            alert('Account created! Welcome to Starfall.');
            window.location.href = 'chat.html';
        } else {
            alert(result.detail || 'Signup failed :<');
        }
    } catch (err) {
        console.error("Signup Error:", err);
    }
});