/* ============================================
   GALLERY PAGE FUNCTIONALITY
   Sarberia Pally Seba Samity
   ============================================ */

// Gallery State
const galleryState = {
    data: null,
    filteredAlbums: [],
    activeCategory: 'all',
    activeYear: 'all',
    currentAlbum: null,
    lightbox: {
        isOpen: false,
        currentIndex: 0,
        mediaItems: []
    }
};

// ==========================================
// INITIALIZATION
// ==========================================

async function initGallery() {
    showLoading();
    
    try {
        // Load gallery data
        const response = await fetch('../data/gallery.json');
        galleryState.data = await response.json();
        
        // Initialize components
        renderCategoryFilters();
        renderYearFilters();
        applyFilters();
        
        // Setup event listeners
        setupFilterListeners();
        setupLightboxListeners();
        setupKeyboardNavigation();
        
        // Force remove sticky on mobile
        fixMobileFilters();
        
        hideLoading();
    } catch (error) {
        console.error('Error loading gallery data:', error);
        showError();
    }
}

// ==========================================
// MOBILE FIX: REMOVE STICKY FILTERS
// ==========================================

function fixMobileFilters() {
    const checkAndFix = () => {
        if (window.innerWidth <= 768) {
            const filterSection = document.querySelector('.gallery-filters');
            if (filterSection) {
                filterSection.style.position = 'static';
                filterSection.style.top = '0';
                filterSection.style.zIndex = '1';
            }
        }
    };
    
    // Run immediately
    checkAndFix();
    
    // Run on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(checkAndFix, 100);
    });
}

// ==========================================
// FILTER RENDERING
// ==========================================

function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    const categories = galleryState.data.categories;
    
    // Keep the "All" button, add category buttons
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.category = category.id;
        btn.dataset.bn = category.name.bn;
        btn.dataset.en = category.name.en;
        btn.textContent = getCurrentLanguage() === 'bn' ? category.name.bn : category.name.en;
        container.appendChild(btn);
    });
}

function renderYearFilters() {
    const select = document.getElementById('year-filter');
    const years = galleryState.data.years;
    
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    });
}

// ==========================================
// FILTER LOGIC
// ==========================================

function setupFilterListeners() {
    // Category filter buttons
    const categoryContainer = document.getElementById('category-filters');
    categoryContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            // Update active state
            categoryContainer.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Update state and filter
            galleryState.activeCategory = e.target.dataset.category;
            applyFilters();
        }
    });
    
    // Year filter select
    const yearSelect = document.getElementById('year-filter');
    yearSelect.addEventListener('change', () => {
        galleryState.activeYear = yearSelect.value;
        applyFilters();
    });
    
    // Reset button
    const resetBtn = document.getElementById('reset-filters');
    resetBtn.addEventListener('click', resetFilters);
}

function applyFilters() {
    const albums = galleryState.data.albums;
    
    // Filter albums
    galleryState.filteredAlbums = albums.filter(album => {
        const categoryMatch = galleryState.activeCategory === 'all' || 
                              album.category === galleryState.activeCategory;
        const yearMatch = galleryState.activeYear === 'all' || 
                          album.year.toString() === galleryState.activeYear;
        return categoryMatch && yearMatch;
    });
    
    // Render results
    renderAlbums();
    updateResultsCount();
    updateActiveFiltersDisplay();
}

function resetFilters() {
    // Reset state
    galleryState.activeCategory = 'all';
    galleryState.activeYear = 'all';
    
    // Reset UI
    document.querySelectorAll('#category-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === 'all');
    });
    document.getElementById('year-filter').value = 'all';
    
    // Apply filters
    applyFilters();
}

function updateResultsCount() {
    const container = document.getElementById('results-count');
    const count = galleryState.filteredAlbums.length;
    const lang = getCurrentLanguage();
    
    if (lang === 'bn') {
        container.innerHTML = `<strong>${count}</strong>টি অ্যালবাম পাওয়া গেছে`;
    } else {
        container.innerHTML = `Found <strong>${count}</strong> album${count !== 1 ? 's' : ''}`;
    }
}

function updateActiveFiltersDisplay() {
    const container = document.getElementById('active-filters');
    container.innerHTML = '';
    
    const lang = getCurrentLanguage();
    
    // Category filter tag
    if (galleryState.activeCategory !== 'all') {
        const category = galleryState.data.categories.find(c => c.id === galleryState.activeCategory);
        if (category) {
            const tag = createFilterTag(
                lang === 'bn' ? category.name.bn : category.name.en,
                () => {
                    galleryState.activeCategory = 'all';
                    document.querySelector('#category-filters .filter-btn[data-category="all"]').click();
                }
            );
            container.appendChild(tag);
        }
    }
    
    // Year filter tag
    if (galleryState.activeYear !== 'all') {
        const tag = createFilterTag(
            galleryState.activeYear,
            () => {
                galleryState.activeYear = 'all';
                document.getElementById('year-filter').value = 'all';
                applyFilters();
            }
        );
        container.appendChild(tag);
    }
}

function createFilterTag(text, onRemove) {
    const tag = document.createElement('span');
    tag.className = 'active-filter-tag';
    tag.innerHTML = `
        ${text}
        <span class="remove-filter">×</span>
    `;
    tag.querySelector('.remove-filter').addEventListener('click', onRemove);
    return tag;
}

// ==========================================
// ALBUM RENDERING
// ==========================================

function renderAlbums() {
    const grid = document.getElementById('gallery-albums-grid');
    const noResults = document.getElementById('no-results');
    const albumsSection = document.querySelector('.gallery-albums-section');
    const detailSection = document.getElementById('album-detail-section');
    
    // Show albums section, hide detail section
    albumsSection.style.display = 'block';
    detailSection.style.display = 'none';
    
    // Check for no results
    if (galleryState.filteredAlbums.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    const lang = getCurrentLanguage();
    
    grid.innerHTML = galleryState.filteredAlbums.map(album => {
        const category = galleryState.data.categories.find(c => c.id === album.category);
        const photoCount = album.images.length;
        const videoCount = album.videos ? album.videos.length : 0;
        
        return `
            <article class="album-card" data-album-id="${album.id}">
                <div class="album-card-image">
                    <img 
                        src="../${album.featuredImage}" 
                        alt="${lang === 'bn' ? album.title.bn : album.title.en}"
                        class="lazy-image"
                        loading="lazy"
                    >
                    <div class="album-card-overlay"></div>
                    <span class="album-card-category">
                        ${lang === 'bn' ? category.name.bn : category.name.en}
                    </span>
                    <span class="album-card-year">${album.year}</span>
                    <div class="album-card-meta">
                        <div class="album-media-count">
                            <span class="media-count-item">
                                <span>📷</span>
                                <span>${photoCount}</span>
                            </span>
                            ${videoCount > 0 ? `
                                <span class="media-count-item">
                                    <span>🎬</span>
                                    <span>${videoCount}</span>
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="album-card-content">
                    <h3 class="album-card-title">
                        ${lang === 'bn' ? album.title.bn : album.title.en}
                    </h3>
                    <p class="album-card-description">
                        ${lang === 'bn' ? album.description.bn : album.description.en}
                    </p>
                </div>
                <div class="album-card-footer">
                    <span class="album-card-date">${formatDate(album.date, lang)}</span>
                    <span class="album-card-view">
                        ${lang === 'bn' ? 'দেখুন' : 'View'}
                        <span>→</span>
                    </span>
                </div>
            </article>
        `;
    }).join('');
    
    // Setup lazy loading
    setupLazyLoading();
    
    // Add click listeners to album cards
    grid.querySelectorAll('.album-card').forEach(card => {
        card.addEventListener('click', () => {
            const albumId = card.dataset.albumId;
            openAlbumDetail(albumId);
        });
    });
}

// ==========================================
// ALBUM DETAIL VIEW
// ==========================================

function openAlbumDetail(albumId) {
    const album = galleryState.data.albums.find(a => a.id === albumId);
    if (!album) return;
    
    galleryState.currentAlbum = album;
    
    const albumsSection = document.querySelector('.gallery-albums-section');
    const detailSection = document.getElementById('album-detail-section');
    const filtersSection = document.querySelector('.gallery-filters');
    
    // Hide albums, show detail
    albumsSection.style.display = 'none';
    filtersSection.style.display = 'none';
    detailSection.style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const lang = getCurrentLanguage();
    const category = galleryState.data.categories.find(c => c.id === album.category);
    const photoCount = album.images.length;
    const videoCount = album.videos ? album.videos.length : 0;
    
    // Render header
    document.getElementById('album-detail-header').innerHTML = `
        <h1 class="album-detail-title">
            ${lang === 'bn' ? album.title.bn : album.title.en}
        </h1>
        <div class="album-detail-info">
            <span class="album-info-item">
                <span class="icon">📅</span>
                ${formatDate(album.date, lang)}
            </span>
            <span class="album-info-item">
                <span class="icon">📁</span>
                ${lang === 'bn' ? category.name.bn : category.name.en}
            </span>
            <span class="album-info-item">
                <span class="icon">📷</span>
                ${photoCount} ${lang === 'bn' ? 'টি ছবি' : 'Photos'}
            </span>
            ${videoCount > 0 ? `
                <span class="album-info-item">
                    <span class="icon">🎬</span>
                    ${videoCount} ${lang === 'bn' ? 'টি ভিডিও' : 'Videos'}
                </span>
            ` : ''}
        </div>
        <p class="album-detail-description">
            ${lang === 'bn' ? album.description.bn : album.description.en}
        </p>
    `;
    
    // Render featured image
    document.getElementById('album-featured-image').innerHTML = `
        <img 
            src="../${album.featuredImage}" 
            alt="${lang === 'bn' ? album.title.bn : album.title.en}"
            data-index="0"
            data-type="image"
        >
    `;
    
    // Prepare media items for lightbox
    galleryState.lightbox.mediaItems = [];
    
    // Add featured image
    galleryState.lightbox.mediaItems.push({
        type: 'image',
        src: album.featuredImage,
        caption: lang === 'bn' ? album.title.bn : album.title.en
    });
    
    // Render media grid
    let mediaHTML = '';
    
    // Add images
    album.images.forEach((image, index) => {
        galleryState.lightbox.mediaItems.push({
            type: 'image',
            src: image.src,
            caption: lang === 'bn' ? (image.caption?.bn || '') : (image.caption?.en || '')
        });
        
        mediaHTML += `
            <div class="media-item" data-index="${index + 1}" data-type="image">
                <img 
                    src="../${image.thumbnail || image.src}" 
                    alt="${lang === 'bn' ? (image.caption?.bn || '') : (image.caption?.en || '')}"
                    loading="lazy"
                >
                <div class="media-item-overlay">
                    <span class="media-item-icon">🔍</span>
                </div>
            </div>
        `;
    });
    
    // Add videos
    if (album.videos && album.videos.length > 0) {
        album.videos.forEach((video, index) => {
            galleryState.lightbox.mediaItems.push({
                type: 'video',
                src: video.src,
                caption: lang === 'bn' ? (video.caption?.bn || '') : (video.caption?.en || ''),
                duration: video.duration
            });
            
            mediaHTML += `
                <div class="media-item video" data-index="${album.images.length + index + 1}" data-type="video">
                    <img 
                        src="../${video.thumbnail}" 
                        alt="${lang === 'bn' ? (video.caption?.bn || '') : (video.caption?.en || '')}"
                        loading="lazy"
                    >
                    <div class="video-indicator"></div>
                    ${video.duration ? `<span class="video-duration">${video.duration}</span>` : ''}
                </div>
            `;
        });
    }
    
    document.getElementById('album-media-grid').innerHTML = mediaHTML;
    
    // Setup click listeners for lightbox
    setupMediaClickListeners();
    
    // Back button listener
    document.getElementById('album-back-btn').onclick = closeAlbumDetail;
}

function closeAlbumDetail() {
    const albumsSection = document.querySelector('.gallery-albums-section');
    const detailSection = document.getElementById('album-detail-section');
    const filtersSection = document.querySelector('.gallery-filters');
    
    // Show albums, hide detail
    albumsSection.style.display = 'block';
    filtersSection.style.display = 'block';
    detailSection.style.display = 'none';
    
    // Re-apply mobile fix
    fixMobileFilters();
    
    galleryState.currentAlbum = null;
}

function setupMediaClickListeners() {
    // Featured image
    const featuredImg = document.querySelector('#album-featured-image img');
    if (featuredImg) {
        featuredImg.addEventListener('click', () => {
            openLightbox(0);
        });
    }
    
    // Media grid items
    document.querySelectorAll('#album-media-grid .media-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            openLightbox(index);
        });
    });
}

// ==========================================
// LIGHTBOX
// ==========================================

function setupLightboxListeners() {
    const lightbox = document.getElementById('lightbox');
    const overlay = lightbox.querySelector('.lightbox-overlay');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    
    overlay.addEventListener('click', closeLightbox);
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', showPrevMedia);
    nextBtn.addEventListener('click', showNextMedia);
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (!galleryState.lightbox.isOpen) return;
        
        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                showPrevMedia();
                break;
            case 'ArrowRight':
                showNextMedia();
                break;
        }
    });
}

function openLightbox(index) {
    galleryState.lightbox.isOpen = true;
    galleryState.lightbox.currentIndex = index;
    
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    
    document.body.style.overflow = 'hidden';
    
    renderLightboxContent();
}

function closeLightbox() {
    galleryState.lightbox.isOpen = false;
    
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    
    document.body.style.overflow = '';
    
    // Pause any playing videos
    const video = lightbox.querySelector('video');
    if (video) {
        video.pause();
    }
}

function showPrevMedia() {
    const total = galleryState.lightbox.mediaItems.length;
    galleryState.lightbox.currentIndex = (galleryState.lightbox.currentIndex - 1 + total) % total;
    renderLightboxContent();
}

function showNextMedia() {
    const total = galleryState.lightbox.mediaItems.length;
    galleryState.lightbox.currentIndex = (galleryState.lightbox.currentIndex + 1) % total;
    renderLightboxContent();
}

function renderLightboxContent() {
    const { currentIndex, mediaItems } = galleryState.lightbox;
    const media = mediaItems[currentIndex];
    
    const content = document.getElementById('lightbox-content');
    const caption = document.getElementById('lightbox-caption');
    const counter = document.getElementById('lightbox-counter');
    
    if (media.type === 'image') {
        content.innerHTML = `<img src="../${media.src}" alt="${media.caption}">`;
    } else {
        content.innerHTML = `
            <video controls autoplay>
                <source src="../${media.src}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    }
    
    caption.textContent = media.caption;
    counter.textContent = `${currentIndex + 1} / ${mediaItems.length}`;
}

// ==========================================
// UTILITIES
// ==========================================

function getCurrentLanguage() {
    return document.documentElement.lang || 'bn';
}

function formatDate(dateString, lang) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    
    if (lang === 'bn') {
        return date.toLocaleDateString('bn-BD', options);
    }
    return date.toLocaleDateString('en-US', options);
}

function setupLazyLoading() {
    const images = document.querySelectorAll('.lazy-image');
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '50px' });
        
        images.forEach(img => observer.observe(img));
    } else {
        images.forEach(img => img.classList.add('loaded'));
    }
}

function showLoading() {
    const grid = document.getElementById('gallery-albums-grid');
    grid.innerHTML = `
        <div class="gallery-loading" style="grid-column: 1 / -1;">
            <div class="loading-spinner"></div>
            <p class="loading-text">Loading gallery...</p>
        </div>
    `;
}

function hideLoading() {
    // Loading will be replaced by content
}

function showError() {
    const grid = document.getElementById('gallery-albums-grid');
    grid.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1;">
            <div class="no-results-icon">⚠️</div>
            <h3>Error loading gallery</h3>
            <p>Please try refreshing the page</p>
        </div>
    `;
}

// ==========================================
// LANGUAGE CHANGE HANDLER
// ==========================================

// Listen for language changes
document.addEventListener('languageChanged', () => {
    if (galleryState.data) {
        renderCategoryFilters();
        applyFilters();
        
        if (galleryState.currentAlbum) {
            openAlbumDetail(galleryState.currentAlbum.id);
        }
    }
});

// ==========================================
// INITIALIZE ON PAGE LOAD
// ==========================================

// Auto-run when included
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof initGallery === 'function') {
            // Will be called from gallery.html
        }
    });
}