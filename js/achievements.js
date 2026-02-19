/* ============================================
   ACHIEVEMENTS PAGE - SIMPLE IMAGE ALBUM
   শারদ সম্মান
   ============================================ */

// State
const achievementsState = {
    data: [],
    currentIndex: 0
};

// ==========================================
// INITIALIZATION
// ==========================================

async function initAchievements() {
    await loadAchievementsData();
    renderAchievements();
    setupLightbox();
}

// ==========================================
// LOAD DATA
// ==========================================

async function loadAchievementsData() {
    try {
        const response = await fetch('../data/achievements.json');
        const data = await response.json();
        achievementsState.data = data.images;
    } catch (error) {
        console.error('Error loading achievements:', error);
        showError();
    }
}

// ==========================================
// RENDER IMAGES
// ==========================================

function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    
    const lang = getCurrentLanguage();
    const images = achievementsState.data;
    
    if (images.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <p>${lang === 'bn' ? 'কোনো তথ্য পাওয়া যায়নি' : 'No data found'}</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = images.map((item, index) => `
        <div class="achievement-item" data-index="${index}">
            <img 
                src="../${item.image}" 
                alt="${lang === 'bn' ? item.title.bn : item.title.en}" 
                loading="lazy"
                onerror="this.src='../assets/images/common/placeholder.jpg'"
            >
            <div class="achievement-overlay">
                <span class="achievement-year">${item.year}</span>
                <p class="achievement-title">${lang === 'bn' ? item.title.bn : item.title.en}</p>
            </div>
        </div>
    `).join('');
    
    // Add click listeners
    grid.querySelectorAll('.achievement-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            openLightbox(index);
        });
    });
}

// ==========================================
// LIGHTBOX
// ==========================================

function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    
    const overlay = lightbox.querySelector('.lightbox-overlay');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    
    // Click events
    overlay.addEventListener('click', closeLightbox);
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', showPrev);
    nextBtn.addEventListener('click', showNext);
    
    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);
    
    // Touch swipe
    setupTouchSwipe(lightbox);
}

function handleKeyboard(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox.classList.contains('active')) return;
    
    switch (e.key) {
        case 'Escape':
            closeLightbox();
            break;
        case 'ArrowLeft':
            showPrev();
            break;
        case 'ArrowRight':
            showNext();
            break;
    }
}

function setupTouchSwipe(lightbox) {
    let touchStartX = 0;
    
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    lightbox.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                showNext();
            } else {
                showPrev();
            }
        }
    }, { passive: true });
}

function openLightbox(index) {
    achievementsState.currentIndex = index;
    updateLightboxContent();
    
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function showPrev() {
    const total = achievementsState.data.length;
    achievementsState.currentIndex = (achievementsState.currentIndex - 1 + total) % total;
    updateLightboxContent();
}

function showNext() {
    const total = achievementsState.data.length;
    achievementsState.currentIndex = (achievementsState.currentIndex + 1) % total;
    updateLightboxContent();
}

function updateLightboxContent() {
    const item = achievementsState.data[achievementsState.currentIndex];
    if (!item) return;
    
    const lang = getCurrentLanguage();
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');
    
    img.src = '../' + item.image;
    img.alt = lang === 'bn' ? item.title.bn : item.title.en;
    
    caption.innerHTML = `
        <span class="caption-year">${item.year}</span>
        <span class="caption-title">${lang === 'bn' ? item.title.bn : item.title.en}</span>
    `;
}

// ==========================================
// UTILITIES
// ==========================================

function getCurrentLanguage() {
    return document.documentElement.lang || 'bn';
}

function showError() {
    const grid = document.getElementById('achievements-grid');
    if (grid) {
        grid.innerHTML = `
            <div class="no-data">
                <p>⚠️ Error loading data</p>
            </div>
        `;
    }
}

// ==========================================
// LANGUAGE CHANGE SUPPORT
// ==========================================

document.addEventListener('languageChanged', () => {
    if (achievementsState.data.length > 0) {
        renderAchievements();
        
        // Update lightbox if open
        const lightbox = document.getElementById('lightbox');
        if (lightbox && lightbox.classList.contains('active')) {
            updateLightboxContent();
        }
    }
});