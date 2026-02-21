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
    }
}

function renderCommonElements() {
    // Update footer year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // Update any elements with data-bn and data-en attributes
    document.querySelectorAll('[data-bn][data-en]').forEach(el => {
        el.textContent = el.dataset[currentLang];
    });
}

function getUILabels() {
    return {
        readMore: currentLang === 'bn' ? 'বিস্তারিত পড়ুন' : 'Read More',
        viewAll: currentLang === 'bn' ? 'সকল দেখুন' : 'View All',
        viewAllPrograms: currentLang === 'bn' ? 'সকল কার্যক্রম দেখুন →' : 'View All Programs →',
        viewAllEvents: currentLang === 'bn' ? 'সকল অনুষ্ঠান দেখুন →' : 'View All Events →',
        viewAllUpdates: currentLang === 'bn' ? 'সকল আপডেট দেখুন →' : 'View All Updates →',
        enroll: currentLang === 'bn' ? 'ভর্তি হন' : 'Enroll Now',
        enrollClosed: currentLang === 'bn' ? 'ভর্তি বন্ধ' : 'Enrollment Closed',
        active: currentLang === 'bn' ? 'চলমান' : 'Active',
        inactive: currentLang === 'bn' ? 'বন্ধ' : 'Inactive',
        upcoming: currentLang === 'bn' ? 'শীঘ্রই' : 'Upcoming',
        closed: currentLang === 'bn' ? 'সাময়িকভাবে বন্ধ' : 'Temporarily Closed',
        open: currentLang === 'bn' ? 'খোলা' : 'Open',
        openingSoon: currentLang === 'bn' ? 'শীঘ্রই খুলছে' : 'Opening Soon',
        send: currentLang === 'bn' ? 'পাঠান' : 'Send',
        sending: currentLang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...',
        joinUs: currentLang === 'bn' ? 'যোগ দিন' : 'Join Us',
        joinNow: currentLang === 'bn' ? 'এখনই যোগাযোগ করুন' : 'Contact Now',
        gallery: currentLang === 'bn' ? 'গ্যালারি' : 'Gallery',
        flagship: currentLang === 'bn' ? 'প্রধান অনুষ্ঠান' : 'Flagship Event',
        pinned: currentLang === 'bn' ? 'পিন করা' : 'Pinned',
        filterAll: currentLang === 'bn' ? 'সকল' : 'All',
        filterEvent: currentLang === 'bn' ? 'অনুষ্ঠান' : 'Events',
        filterProgram: currentLang === 'bn' ? 'প্রশিক্ষণ' : 'Programs',
        filterLibrary: currentLang === 'bn' ? 'পাঠাগার' : 'Library',
        filterGeneral: currentLang === 'bn' ? 'সাধারণ' : 'General',
        phone: currentLang === 'bn' ? 'ফোন' : 'Phone',
        email: currentLang === 'bn' ? 'ইমেইল' : 'Email',
        address: currentLang === 'bn' ? 'ঠিকানা' : 'Address',
        openingHours: currentLang === 'bn' ? 'খোলার সময়' : 'Opening Hours',
        sendMessage: currentLang === 'bn' ? 'বার্তা পাঠান' : 'Send Message',
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
        noUpdates: currentLang === 'bn' ? 'কোনো আপডেট নেই' : 'No updates',
        age: currentLang === 'bn' ? 'বয়স' : 'Age',
        schedule: currentLang === 'bn' ? 'সময়সূচি' : 'Schedule',
        location: currentLang === 'bn' ? 'স্থান' : 'Location',
        instructor: currentLang === 'bn' ? 'প্রশিক্ষক' : 'Instructor',
        ourPrograms: currentLang === 'bn' ? 'আমাদের কার্যক্রম' : 'Our Programs',
        programsSubtitle: currentLang === 'bn' ? 'বিভিন্ন বয়সের জন্য প্রশিক্ষণ কর্মসূচি' : 'Training programs for all ages',
        upcomingEvents: currentLang === 'bn' ? 'আসন্ন অনুষ্ঠান' : 'Upcoming Events',
        eventsSubtitle: currentLang === 'bn' ? 'আমাদের বার্ষিক উৎসব ও প্রতিযোগিতা' : 'Our annual festivals and competitions',
        latestUpdates: currentLang === 'bn' ? 'সাম্প্রতিক আপডেট' : 'Latest Updates',
        ctaTitle: currentLang === 'bn' ? 'আমাদের সাথে যুক্ত হন' : 'Join With Us',
        ctaText: currentLang === 'bn' ? 'ক্লাবের সদস্য হয়ে খেলাধুলা ও সাংস্কৃতিক কর্মকাণ্ডে অংশগ্রহণ করুন' : 'Become a member and participate in sports and cultural activities',
        viewPrograms: currentLang === 'bn' ? 'প্রশিক্ষণ দেখুন' : 'View Programs',
        history: currentLang === 'bn' ? 'ইতিহাস' : 'History',
        missionVision: currentLang === 'bn' ? 'লক্ষ্য ও উদ্দেশ্য' : 'Mission & Vision',
        ourMission: currentLang === 'bn' ? 'আমাদের লক্ষ্য' : 'Our Mission',
        ourVision: currentLang === 'bn' ? 'আমাদের দৃষ্টিভঙ্গি' : 'Our Vision',
        ourFacilities: currentLang === 'bn' ? 'আমাদের সুবিধা' : 'Our Facilities',
        facilitiesSubtitle: currentLang === 'bn' ? 'ক্লাবে উপলব্ধ সুযোগ-সুবিধা' : 'Facilities available at the club',
        aboutLibrary: currentLang === 'bn' ? 'পাঠাগার সম্পর্কে' : 'About Library',
        bookCollection: currentLang === 'bn' ? 'বইয়ের সংগ্রহ' : 'Book Collection',
        booksAvailable: currentLang === 'bn' ? 'আমাদের পাঠাগারে বই রয়েছে' : 'Books available in our library',
        openingNotice: currentLang === 'bn' ? 'খোলার বিজ্ঞপ্তি' : 'Opening Notice',
        executiveCommittee: currentLang === 'bn' ? 'কার্যনির্বাহী সমিতি' : 'Executive Committee',
        subcommittees: currentLang === 'bn' ? 'উপকমিটি' : 'Sub-committees',
        contactInfo: currentLang === 'bn' ? 'যোগাযোগের তথ্য' : 'Contact Information',
        successMessage: currentLang === 'bn' ? 'আপনার বার্তা পাঠানো হয়েছে। শীঘ্রই আমরা যোগাযোগ করব।' : 'Your message has been sent. We will contact you soon.',
        allRights: currentLang === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত' : 'All rights reserved',
        links: currentLang === 'bn' ? 'লিংক' : 'Links',
        more: currentLang === 'bn' ? 'আরও' : 'More',
        home: currentLang === 'bn' ? 'হোম' : 'Home',
        about: currentLang === 'bn' ? 'আমাদের সম্পর্কে' : 'About Us',
        programs: currentLang === 'bn' ? 'প্রশিক্ষণ' : 'Programs',
        events: currentLang === 'bn' ? 'অনুষ্ঠান' : 'Events',
        library: currentLang === 'bn' ? 'পাঠাগার' : 'Library',
        updates: currentLang === 'bn' ? 'আপডেট' : 'Updates',
        committee: currentLang === 'bn' ? 'সমিতি' : 'Committee',
        contact: currentLang === 'bn' ? 'যোগাযোগ' : 'Contact'
    };
}