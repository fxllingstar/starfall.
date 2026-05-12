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
 
        // Form switching
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const showSignupBtn = document.getElementById('showSignup');
        const showLoginBtn = document.getElementById('showLogin');
 
        showSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.remove('active');
            signupForm.classList.add('active');
        });
 
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.classList.remove('active');
            loginForm.classList.add('active');
        });
 
        // Form submissions (placeholder functionality)
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Login submitted');
            // Add your login logic here
        });
 
        document.getElementById('signupFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupPasswordConfirm').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            console.log('Signup submitted');


    
        });