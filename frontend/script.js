   // Generate starfield
        const starfield = document.getElementById('starfield');
        const numStars = 150;
 
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 3}s`;
            star.style.animationDuration = `${Math.random() * 2 + 2}s`;
            
            starfield.appendChild(star);
        }
 
        // Create occasional shooting stars
        function createShootingStar() {
            const shootingStar = document.createElement('div');
            shootingStar.className = 'shooting-star';
            shootingStar.style.left = `${Math.random() * 100}%`;
            shootingStar.style.top = `${Math.random() * 50}%`;
            shootingStar.style.width = `${Math.random() * 100 + 50}px`;
            
            starfield.appendChild(shootingStar);
            
            setTimeout(() => {
                shootingStar.remove();
            }, 2000);
        }
 
        // Create a shooting star every 3-8 seconds
        setInterval(() => {
            if (Math.random() > 0.5) {
                createShootingStar();
            }
        }, Math.random() * 5000 + 3000);
 
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });