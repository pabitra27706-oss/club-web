// ============================================
// HERO ANIMATION SYSTEM
// Big Club Name → Typing → Auto-Scroll
// ============================================

// ---- Global State ----
let heroAnimationStarted = false;
let userHasScrolled = false;
let scrollTrackingActive = false;

// ============================================
// GLOBAL ENTRY POINT (called by event-popup.js)
// ============================================
function initHeroSequence() {
    if (heroAnimationStarted) return;
    heroAnimationStarted = true;

    // Start tracking user scroll
    startScrollTracking();

    // Step 1: Fade in the big club name
    showClubName();
}

// ============================================
// STEP 1: SHOW BIG CLUB NAME
// ============================================
function showClubName() {
    const clubNameHero = document.getElementById('club-name-hero');

    if (clubNameHero) {
        clubNameHero.classList.add('visible');
    }

    // Step 2: Start typing after club name settles
    setTimeout(() => {
        initTypingAnimation();
    }, 1000);
}

// ============================================
// STEP 2: TYPING ANIMATION
// ============================================
function initTypingAnimation() {
    const lang = document.documentElement.lang || 'bn';

    const linesData = {
        bn: [
            { text: 'স্বাগতম', speed: 100 },
            { text: 'আমাদের অফিসিয়াল ওয়েবসাইটে', speed: 70 }
        ],
        en: [
            { text: 'Welcome to', speed: 80 },
            { text: 'Our Official Website', speed: 60 }
        ]
    };

    const currentLines = linesData[lang] || linesData['bn'];

    const lines = [
        {
            element: document.getElementById('typed-line-1'),
            text: currentLines[0].text,
            speed: currentLines[0].speed
        },
        {
            element: document.getElementById('typed-line-2'),
            text: currentLines[1].text,
            speed: currentLines[1].speed
        }
    ];

    const cursor = document.querySelector('.cursor');

    function typeText(element, text, speed) {
        return new Promise((resolve) => {
            if (!element) { resolve(); return; }

            element.classList.add('active');
            element.textContent = '';
            let charIndex = 0;

            const typeInterval = setInterval(() => {
                if (charIndex < text.length) {
                    element.textContent += text.charAt(charIndex);
                    charIndex++;
                } else {
                    clearInterval(typeInterval);
                    setTimeout(resolve, 400);
                }
            }, speed);
        });
    }

    async function startTyping() {
        if (cursor) cursor.classList.add('active');

        for (let i = 0; i < lines.length; i++) {
            await typeText(lines[i].element, lines[i].text, lines[i].speed);
        }

        // Step 3: Show subtitle and stats
        onTypingComplete();
    }

    startTyping();
}

// ============================================
// STEP 3: POST-TYPING REVEALS
// ============================================
function onTypingComplete() {
    const cursor = document.querySelector('.cursor');
    const subtitle = document.getElementById('welcome-subtitle');
    const stats = document.querySelector('.welcome-stats-mini');

    // Hide cursor
    setTimeout(() => {
        if (cursor) cursor.style.opacity = '0';

        // Show subtitle
        if (subtitle) subtitle.classList.add('visible');

        // Show stats with slight delay
        setTimeout(() => {
            if (stats) stats.classList.add('visible');

            // Step 4: Auto-scroll after everything is visible
            setTimeout(() => {
                autoScrollPastHero();
            }, 2000);

        }, 400);
    }, 500);
}

// ============================================
// STEP 4: AUTO-SCROLL PAST HERO
// ============================================
function autoScrollPastHero() {
    // Only auto-scroll if user hasn't manually scrolled
    if (userHasScrolled) return;

    const welcomeSection = document.querySelector('.welcome-section');
    if (!welcomeSection) return;

    const scrollTarget = welcomeSection.offsetTop + welcomeSection.offsetHeight;

    window.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
    });
}

// ============================================
// SCROLL TRACKING
// ============================================
function startScrollTracking() {
    if (scrollTrackingActive) return;
    scrollTrackingActive = true;

    const handler = () => {
        if (window.scrollY > 80) {
            userHasScrolled = true;
            window.removeEventListener('scroll', handler);
        }
    };

    window.addEventListener('scroll', handler, { passive: true });
}

// ============================================
// PARTICLES ANIMATION
// ============================================
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = Math.min(100, Math.floor((width * height) / 15000));

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.8;
            this.speedY = (Math.random() - 0.5) * 0.8;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > width) this.x = 0;
            if (this.x < 0) this.x = width;
            if (this.y > height) this.y = 0;
            if (this.y < 0) this.y = height;
        }

        draw() {
            ctx.fillStyle = `rgba(87, 197, 182, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = dx * dx + dy * dy;

                if (dist < 10000) { // 100px squared
                    const opacity = 0.15 * (1 - Math.sqrt(dist) / 100);
                    ctx.strokeStyle = `rgba(87, 197, 182, ${opacity})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();

    // Resize handler with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }, 200);
    });
}

// ============================================
// SCROLL REVEAL (Intersection Observer)
// ============================================
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.section, .home-stats, .home-cta');

    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scroll-reveal', 'revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        el.classList.add('scroll-reveal');
        observer.observe(el);
    });
}

// ============================================
// INITIALIZE ON DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Particles always start immediately
    initParticles();

    // Scroll reveal for sections
    initScrollReveal();

    // Fallback: if event-popup.js doesn't load or trigger hero
    setTimeout(() => {
        if (!heroAnimationStarted) {
            const popup = document.getElementById('event-popup-overlay');
            if (!popup) {
                console.log('Fallback: starting hero animation');
                initHeroSequence();
            }
        }
    }, 3000);
});