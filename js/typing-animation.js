// ============================================
// ADVANCED TYPING ANIMATION
// ============================================

function initTypingAnimation() {
    const lines = [
        {
            element: document.getElementById('typed-line-1'),
            text: 'WELCOME TO',
            speed: 100
        },
        {
            element: document.getElementById('typed-line-2'),
            text: 'Our Official Website',
            speed: 80
        },
        {
            element: document.getElementById('typed-line-3'),
            text: 'Sarberia Pally Seba Samity - Since 1938',
            speed: 60
        }
    ];

    const cursor = document.querySelector('.cursor');
    let currentLine = 0;

    function typeText(element, text, speed) {
        return new Promise((resolve) => {
            element.classList.add('active');
            let charIndex = 0;

            const typeInterval = setInterval(() => {
                if (charIndex < text.length) {
                    element.textContent += text.charAt(charIndex);
                    charIndex++;
                } else {
                    clearInterval(typeInterval);
                    setTimeout(resolve, 500); // Pause before next line
                }
            }, speed);
        });
    }

    async function startTyping() {
        cursor.classList.add('active');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            await typeText(line.element, line.text, line.speed);
        }

        // Show subtitle and stats after typing complete
        setTimeout(() => {
            cursor.style.display = 'none';
            document.getElementById('welcome-subtitle')?.classList.add('visible');
            document.querySelector('.welcome-stats-mini')?.classList.add('visible');
        }, 500);
    }

    // Start typing after page load
    setTimeout(startTyping, 500);
}

// ============================================
// PARTICLES ANIMATION
// ============================================

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 100;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Wrap around edges
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }

        draw() {
            ctx.fillStyle = `rgba(87, 197, 182, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((particle) => {
            particle.update();
            particle.draw();
        });

        // Draw connections
        particles.forEach((a, i) => {
            particles.slice(i + 1).forEach((b) => {
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    ctx.strokeStyle = `rgba(87, 197, 182, ${0.2 * (1 - distance / 100)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            });
        });

        requestAnimationFrame(animate);
    }

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initTypingAnimation();
    initParticles();
});