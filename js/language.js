/*
 * Language Module
 * Handles Bengali/English language switching
 */

let currentLang = 'bn';
const LANG_STORAGE_KEY = 'club-website-lang';

function initLanguage() {
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
    if (savedLang && (savedLang === 'bn' || savedLang === 'en')) {
        currentLang = savedLang;
    }
    
    document.documentElement.lang = currentLang;
    updateLangButtons();
    
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            setLanguage(lang);
        });
    });
    
    return currentLang;
}

function setLanguage(lang) {
    if (lang !== 'bn' && lang !== 'en') return;
    
    currentLang = lang;
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    updateLangButtons();
    reRenderPage();
    
    // Dispatch event for gallery and achievements pages
    document.dispatchEvent(new CustomEvent('languageChanged'));
}

function updateLangButtons() {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function getLang() {
    return currentLang;
}

function getText(textObj) {
    if (!textObj) return '';
    if (typeof textObj === 'string') return textObj;
    return textObj[currentLang] || textObj.bn || textObj.en || '';
}

function reRenderPage() {
    const path = window.location.pathname;
    
    // renderCommonElements is defined in renderer.js
    if (typeof renderCommonElements === 'function') {
        renderCommonElements();
    }
    
    if (path === '/' || path.endsWith('index.html') || path === '') {
        if (typeof renderHomePage === 'function') renderHomePage();
    } else if (path.includes('about')) {
        if (typeof renderAboutPage === 'function') renderAboutPage();
    } else if (path.includes('programs')) {
        if (typeof renderProgramsPage === 'function') renderProgramsPage();
    } else if (path.includes('events')) {
        if (typeof renderEventsPage === 'function') renderEventsPage();
    } else if (path.includes('library')) {
        if (typeof renderLibraryPage === 'function') renderLibraryPage();
    } else if (path.includes('updates')) {
        if (typeof renderUpdatesPage === 'function') renderUpdatesPage();
    } else if (path.includes('community')) {
        if (typeof renderCommunityPage === 'function') renderCommunityPage();
    } else if (path.includes('contact')) {
        if (typeof renderContactPage === 'function') renderContactPage();
    } else if (path.includes('gallery')) {
        if (typeof updateGalleryLanguage === 'function') updateGalleryLanguage();
    } else if (path.includes('achievements')) {
        if (typeof updateAchievementsLanguage === 'function') updateAchievementsLanguage();
    }
}