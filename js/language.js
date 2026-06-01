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
    
    renderCommonElements();
    
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

function renderCommonElements() {
    const clubInfo = getClubInfo();
    const labels = getUILabels();
    if (!clubInfo) return;

    // Update footer year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // Update club name
    const clubNameElements = document.querySelectorAll('#club-name, .footer-logo-text');
    clubNameElements.forEach(el => {
        if (el.id === 'club-name') {
            el.textContent = getText(clubInfo.name);
        }
    });

    // Update footer about text
    const footerAbout = document.querySelector('.footer-about');
    if (footerAbout) {
        footerAbout.textContent = getText(clubInfo.tagline);
    }

    // Update footer section titles
    const footerTitles = document.querySelectorAll('.footer-section-title');
    if (footerTitles.length >= 3) {
        footerTitles[0].textContent = labels.links;
        footerTitles[1].textContent = labels.more;
        footerTitles[2].textContent = labels.contact;
    }

    // Update navigation links
    updateNavigationLabels();
    
    // Update any elements with data-bn and data-en attributes
    document.querySelectorAll('[data-bn][data-en]').forEach(el => {
        el.textContent = el.dataset[currentLang];
    });

    // Render social links and contact info
    renderSocialLinks();
    renderFooterContact();
}

function updateNavigationLabels() {
    const labels = getUILabels();
    
    // Desktop nav
    const navLinks = document.querySelectorAll('.nav-desktop .nav-link');
    if (navLinks.length >= 7) {
        navLinks[0].textContent = labels.home;
        navLinks[1].textContent = labels.about;
        navLinks[2].textContent = labels.programs;
        navLinks[3].textContent = labels.events;
        navLinks[4].textContent = labels.library;
        navLinks[5].textContent = labels.updates;
        navLinks[6].textContent = labels.committee;
    }

    // Desktop nav special items (with emoji)
    const achievementsLink = document.querySelector('.nav-desktop a[href*="achievements"]');
    if (achievementsLink) {
        achievementsLink.innerHTML = `🏆 ${labels.achievements}`;
    }
    
    const galleryBtn = document.querySelector('.nav-desktop .header-cta');
    if (galleryBtn && galleryBtn.textContent.includes('GALLERY')) {
        galleryBtn.textContent = labels.gallery;
    }

    // Desktop CTA button
    const contactBtn = document.querySelector('.nav-desktop .header-cta:last-child');
    if (contactBtn && !contactBtn.textContent.includes('GALLERY')) {
        contactBtn.textContent = labels.contact;
    }

    // Mobile nav
    const mobileLinks = document.querySelectorAll('.nav-mobile-link');
    if (mobileLinks.length >= 9) {
        mobileLinks[0].innerHTML = `🏠 ${labels.home}`;
        mobileLinks[1].innerHTML = `📖 ${labels.about}`;
        mobileLinks[2].innerHTML = `🏋️ ${labels.programs}`;
        mobileLinks[3].innerHTML = `🎉 ${labels.events}`;
        mobileLinks[4].innerHTML = `📚 ${labels.library}`;
        mobileLinks[5].innerHTML = `📢 ${labels.updates}`;
        mobileLinks[6].innerHTML = `👥 ${labels.committee}`;
        mobileLinks[7].innerHTML = `🏆 ${labels.achievements}`;
        mobileLinks[8].innerHTML = `🖼️ ${labels.gallery}`;
    }

    // Mobile CTA — FIXED: target only the contact CTA
    const mobileContactCta = document.querySelector('#contact-mobile-cta .btn');
    if (mobileContactCta) {
        mobileContactCta.innerHTML = labels.contact;
    }

    // Footer links — FIXED: indices shifted to include Membership
    const footerLinks = document.querySelectorAll('.footer-links a');
    
    // First column (Links)
    if (footerLinks[0]) footerLinks[0].textContent = labels.home;
    if (footerLinks[1]) footerLinks[1].textContent = labels.about;
    if (footerLinks[2]) footerLinks[2].textContent = labels.programs;
    if (footerLinks[3]) footerLinks[3].textContent = labels.events;
    
    // Second column (More) - Library, Updates, Committee, Achievements, Gallery, Membership, Contact
    if (footerLinks[4]) footerLinks[4].textContent = labels.library;
    if (footerLinks[5]) footerLinks[5].textContent = labels.updates;
    if (footerLinks[6]) footerLinks[6].textContent = labels.committee;
    if (footerLinks[7]) footerLinks[7].textContent = labels.achievements;
    if (footerLinks[8]) footerLinks[8].textContent = labels.gallery;
    // Membership link — always English, no language toggle
    if (footerLinks[9]) footerLinks[9].textContent = 'Membership';
    if (footerLinks[10]) footerLinks[10].textContent = labels.contact;
}

function renderSocialLinks() {
    // (unchanged)
    const clubInfo = getClubInfo();
    const socialContainer = document.getElementById('social-links');
    
    if (!socialContainer || !clubInfo) return;

    const socialLinks = [];
    
    if (clubInfo.social?.facebook) {
        socialLinks.push(`
            <a href="${clubInfo.social.facebook}" class="social-link" target="_blank" rel="noopener" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
            </a>
        `);
    }
    
    if (clubInfo.social?.instagram) {
        socialLinks.push(`
            <a href="${clubInfo.social.instagram}" class="social-link" target="_blank" rel="noopener" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                </svg>
            </a>
        `);
    }
    
    if (clubInfo.social?.youtube) {
        socialLinks.push(`
            <a href="${clubInfo.social.youtube}" class="social-link" target="_blank" rel="noopener" aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
            </a>
        `);
    }

    socialContainer.innerHTML = socialLinks.join('');
}

function renderFooterContact() {
    // (unchanged)
    const clubInfo = getClubInfo();
    const footerContact = document.getElementById('footer-contact');
    
    if (!footerContact || !clubInfo) return;

    footerContact.innerHTML = `
        <div class="footer-contact-item">
            <div class="footer-contact-icon">📍</div>
            <div>${getText(clubInfo.contact.address)}</div>
        </div>
        <div class="footer-contact-item">
            <div class="footer-contact-icon">📞</div>
            <div>${clubInfo.contact.phone}</div>
        </div>
        <div class="footer-contact-item">
            <div class="footer-contact-icon">✉️</div>
            <div>${clubInfo.contact.email}</div>
        </div>
    `;
}

function getUILabels() {
    // (unchanged, original large object)
    return {
        // Navigation
        home: currentLang === 'bn' ? 'হোম' : 'Home',
        about: currentLang === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us',
        programs: currentLang === 'bn' ? 'প্রশিক্ষণ' : 'Programs',
        events: currentLang === 'bn' ? 'অনুষ্ঠান' : 'Events',
        library: currentLang === 'bn' ? 'পাঠাগার' : 'Library',
        updates: currentLang === 'bn' ? 'আপডেট' : 'Updates',
        committee: currentLang === 'bn' ? 'সমিতি' : 'Committee',
        achievements: currentLang === 'bn' ? 'শারদ সম্মান' : 'Sharad Samman',
        gallery: currentLang === 'bn' ? 'গ্যালারি' : 'Gallery',
        contact: currentLang === 'bn' ? 'যোগাযোগ' : 'Contact',
        
        // Footer
        links: currentLang === 'bn' ? 'লিংক' : 'Links',
        more: currentLang === 'bn' ? 'আরও' : 'More',
        
        // Gallery page
        memories: currentLang === 'bn' ? 'আমাদের স্মৃতির সংগ্রহ' : 'Collection of Our Memories',
        
        // Achievements page
        durgaPujaAchievements: currentLang === 'bn' ? 'দুর্গা পূজায় আমাদের অর্জনসমূহ' : 'Our Achievements in Durga Puja',
        
        // Home page sections
        ourPrograms: currentLang === 'bn' ? 'আমাদের কার্যক্রম' : 'Our Programs',
        programsSubtitle: currentLang === 'bn' ? 'বিভিন্ন বয়সের জন্য প্রশিক্ষণ কর্মসূচি' : 'Training programs for all ages',
        upcomingEvents: currentLang === 'bn' ? 'আসন্ন অনুষ্ঠান' : 'Upcoming Events',
        eventsSubtitle: currentLang === 'bn' ? 'আমাদের বার্ষিক উৎসব ও প্রতিযোগিতা' : 'Our annual festivals and competitions',
        latestUpdates: currentLang === 'bn' ? 'সাম্প্রতিক আপডেট' : 'Latest Updates',
        sharadSammanTitle: currentLang === 'bn' ? 'শারদ সম্মান' : 'Sharad Samman',
        sharadSammanSubtitle: currentLang === 'bn' ? 'দুর্গা পূজায় আমাদের অর্জনসমূহ' : 'Our Achievements in Durga Puja',
        galleryTitle: currentLang === 'bn' ? 'গ্যালারি' : 'Gallery',
        gallerySubtitle: currentLang === 'bn' ? 'আমাদের স্মৃতির সংগ্রহ' : 'Collection of Our Memories',
        
        // Buttons
        viewAll: currentLang === 'bn' ? 'সকল দেখুন' : 'View All',
        viewAllPrograms: currentLang === 'bn' ? 'সকল কার্যক্রম দেখুন →' : 'View All Programs →',
        viewAllEvents: currentLang === 'bn' ? 'সকল অনুষ্ঠান দেখুন →' : 'View All Events →',
        viewAllUpdates: currentLang === 'bn' ? 'সকল আপডেট দেখুন →' : 'View All Updates →',
        viewAllAchievements: currentLang === 'bn' ? 'সকল সম্মাননা দেখুন' : 'View All Achievements',
        viewFullGallery: currentLang === 'bn' ? 'সম্পূর্ণ গ্যালারি দেখুন' : 'View Full Gallery',
        enroll: currentLang === 'bn' ? 'ভর্তি হন' : 'Enroll Now',
        joinNow: currentLang === 'bn' ? 'এখনই যোগাযোগ করুন' : 'Contact Now',
        
        // CTA
        ctaTitle: currentLang === 'bn' ? 'আমাদের সাথে যুক্ত হন' : 'Join With Us',
        ctaText: currentLang === 'bn' ? 'ক্লাবের সদস্য হয়ে খেলাধুলা ও সাংস্কৃতিক কর্মকাণ্ডে অংশগ্রহণ করুন' : 'Become a member and participate in sports and cultural activities',
        
        // Status
        active: currentLang === 'bn' ? 'চলমান' : 'Active',
        upcoming: currentLang === 'bn' ? 'শীঘ্রই' : 'Upcoming',
        inactive: currentLang === 'bn' ? 'বন্ধ' : 'Inactive',
        noUpdates: currentLang === 'bn' ? 'কোনো আপডেট নেই' : 'No updates',
        
        // Age
        age: currentLang === 'bn' ? 'বয়স' : 'Age',
        
        // Filter
        filterAll: currentLang === 'bn' ? 'সকল' : 'All',
        filterEvent: currentLang === 'bn' ? 'অনুষ্ঠান' : 'Events',
        filterProgram: currentLang === 'bn' ? 'প্রশিক্ষণ' : 'Programs',
        filterLibrary: currentLang === 'bn' ? 'পাঠাগার' : 'Library',
        filterGeneral: currentLang === 'bn' ? 'সাধারণ' : 'General',
        
        // Contact form
        send: currentLang === 'bn' ? 'পাঠান' : 'Send',
        sending: currentLang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...',
        name: currentLang === 'bn' ? 'নাম' : 'Name',
        phoneNumber: currentLang === 'bn' ? 'ফোন নম্বর' : 'Phone Number',
        emailOptional: currentLang === 'bn' ? 'ইমেইল (ঐচ্ছিক)' : 'Email (Optional)',
        subject: currentLang === 'bn' ? 'বিষয়' : 'Subject',
        message: currentLang === 'bn' ? 'বার্তা' : 'Message',
        selectOption: currentLang === 'bn' ? 'নির্বাচন করুন' : 'Select Option',
        membership: currentLang === 'bn' ? 'সদস্যপদ' : 'Membership',
        aboutProgram: currentLang === 'bn' ? 'প্রশিক্ষণ সম্পর্কে' : 'About Programs',
        aboutEvent: currentLang === 'bn' ? 'অনুষ্ঠান সম্পর্কে' : 'About Events',
        other: currentLang === 'bn' ? 'অন্যান্য' : 'Other',
        
        // Contact info
        phone: currentLang === 'bn' ? 'ফোন' : 'Phone',
        email: currentLang === 'bn' ? 'ইমেইল' : 'Email',
        address: currentLang === 'bn' ? 'ঠিকানা' : 'Address',
        openingHours: currentLang === 'bn' ? 'খোলার সময়' : 'Opening Hours',
        contactInfo: currentLang === 'bn' ? 'যোগাযোগের তথ্য' : 'Contact Information',
        sendMessage: currentLang === 'bn' ? 'বার্তা পাঠান' : 'Send Message',
        
        // About page
        history: currentLang === 'bn' ? 'ইতিহাস' : 'History',
        missionVision: currentLang === 'bn' ? 'লক্ষ্য ও উদ্দেশ্য' : 'Mission & Vision',
        ourMission: currentLang === 'bn' ? 'আমাদের লক্ষ্য' : 'Our Mission',
        ourVision: currentLang === 'bn' ? 'আমাদের দৃষ্টিভঙ্গি' : 'Our Vision',
        ourFacilities: currentLang === 'bn' ? 'আমাদের সুবিধা' : 'Our Facilities',
        facilitiesSubtitle: currentLang === 'bn' ? 'ক্লাবে উপলব্ধ সুযোগ-সুবিধা' : 'Facilities available at the club',
        
        // Library page
        aboutLibrary: currentLang === 'bn' ? 'পাঠাগার সম্পর্কে' : 'About Library',
        bookCollection: currentLang === 'bn' ? 'বইয়ের সংগ্রহ' : 'Book Collection',
        openingNotice: currentLang === 'bn' ? 'খোলার বিজ্ঞপ্তি' : 'Opening Notice',
        
        // Community page
        executiveCommittee: currentLang === 'bn' ? 'কার্যনির্বাহী সমিতি' : 'Executive Committee',
        subcommittees: currentLang === 'bn' ? 'উপকমিটি' : 'Sub-committees',
        
        // Events
        flagship: currentLang === 'bn' ? 'প্রধান অনুষ্ঠান' : 'Flagship Event',
        pinned: currentLang === 'bn' ? 'পিন করা' : 'Pinned',
        
        // Copyright
        allRights: currentLang === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত' : 'All rights reserved'
    };
}