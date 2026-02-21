/*
 * Renderer Module
 * Renders data to HTML with bilingual support
 */

function getBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
}

function renderHomePage() {
    const clubInfo = getClubInfo();
    const labels = getUILabels();
    if (!clubInfo) return;

    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    
    if (heroTitle) {
        heroTitle.textContent = getLang() === 'bn' 
            ? `${getText(clubInfo.name)}এ স্বাগতম`
            : `Welcome to ${getText(clubInfo.name)}`;
    }
    if (heroSubtitle) {
        heroSubtitle.textContent = getText(clubInfo.tagline);
    }

    // Update section titles
    const programsTitle = document.querySelector('.featured-programs .section-title');
    const programsSubtitle = document.querySelector('.featured-programs .section-subtitle');
    if (programsTitle) programsTitle.textContent = labels.ourPrograms;
    if (programsSubtitle) programsSubtitle.textContent = labels.programsSubtitle;

    const eventsTitle = document.querySelector('.section-light .section-title');
    const eventsSubtitle = document.querySelector('.section-light .section-subtitle');
    if (eventsTitle) eventsTitle.textContent = labels.upcomingEvents;
    if (eventsSubtitle) eventsSubtitle.textContent = labels.eventsSubtitle;

    // Update CTA
    const ctaTitle = document.querySelector('.home-cta-title');
    const ctaText = document.querySelector('.home-cta p');
    if (ctaTitle) ctaTitle.textContent = labels.ctaTitle;
    if (ctaText) ctaText.textContent = labels.ctaText;

    // Update buttons
    const viewProgramsBtn = document.querySelector('.featured-programs .btn-outline');
    const viewEventsBtn = document.querySelector('.section-light .btn-outline');
    const viewUpdatesBtn = document.querySelectorAll('.btn-outline')[2];
    const ctaBtn = document.querySelector('.home-cta .btn');
    
    if (viewProgramsBtn) viewProgramsBtn.textContent = labels.viewAllPrograms;
    if (viewEventsBtn) viewEventsBtn.textContent = labels.viewAllEvents;
    if (viewUpdatesBtn) viewUpdatesBtn.textContent = labels.viewAllUpdates;
    if (ctaBtn) ctaBtn.textContent = labels.joinNow;

    renderStats();
    renderFeaturedPrograms();
    renderUpcomingEvents();
    renderLatestUpdates();
    renderCommonElements();
}

function renderStats() {
    const statsGrid = document.getElementById('stats-grid');
    const clubInfo = getClubInfo();
    
    if (!statsGrid || !clubInfo) return;

    statsGrid.innerHTML = '';
    
    clubInfo.stats.forEach(stat => {
        const statItem = createElement('div', ['stat-item']);
        statItem.innerHTML = `
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${getText(stat.label)}</div>
        `;
        statsGrid.appendChild(statItem);
    });
}

function renderFeaturedPrograms() {
    const container = document.getElementById('featured-programs');
    if (!container) return;

    const programs = getActivePrograms().slice(0, 3);
    container.innerHTML = '';

    programs.forEach(program => {
        container.appendChild(createProgramCard(program));
    });
}

function createProgramCard(program) {
    const card = createElement('div', ['card', 'program-card']);
    const labels = getUILabels();
    const basePath = getBasePath();
    
    const statusClass = program.status === 'active' ? 'active' : 
                       program.status === 'upcoming' ? 'upcoming' : 'inactive';
    
    const statusText = program.status === 'active' ? labels.active : 
                      program.status === 'upcoming' ? labels.upcoming : labels.inactive;

    const contactLink = basePath ? 'contact.html' : 'pages/contact.html';

    card.innerHTML = `
        <div class="card-image">
            <img src="${basePath}${program.image}" alt="${getText(program.name)}" class="img-cover">
        </div>
        <div class="card-body">
            <div class="flex justify-between items-start mb-3">
                <h3 class="card-title">
                    ${program.icon} ${getText(program.name)}
                </h3>
                <span class="program-status ${statusClass}">${statusText}</span>
            </div>
            <p class="card-text">${getText(program.description)}</p>
            <div class="program-meta">
                <div class="program-meta-item">
                    <span class="program-meta-icon">📅</span>
                    <span>${getText(program.schedule.days)}</span>
                </div>
                <div class="program-meta-item">
                    <span class="program-meta-icon">⏰</span>
                    <span>${getText(program.schedule.time)}</span>
                </div>
                <div class="program-meta-item">
                    <span class="program-meta-icon">👥</span>
                    <span>${labels.age}: ${getText(program.ageGroup)}</span>
                </div>
                <div class="program-meta-item">
                    <span class="program-meta-icon">📍</span>
                    <span>${getText(program.location)}</span>
                </div>
            </div>
            ${program.enrollmentOpen ? 
                `<a href="${contactLink}" class="btn btn-primary btn-sm">${labels.enroll}</a>` : 
                `<button class="btn btn-outline btn-sm" disabled>${labels.enrollClosed}</button>`
            }
        </div>
    `;
    
    return card;
}

function renderUpcomingEvents() {
    const container = document.getElementById('upcoming-events');
    if (!container) return;

    const events = getUpcomingEvents().slice(0, 4);
    container.innerHTML = '';

    events.forEach(event => {
        const timelineItem = createElement('div', ['timeline-item']);
        timelineItem.innerHTML = `
            <div class="timeline-date">${getText(event.date.display)}</div>
            <h3 class="timeline-title">${event.icon} ${getText(event.name)}</h3>
            <p class="timeline-description">${truncateText(getText(event.description), 120)}</p>
        `;
        container.appendChild(timelineItem);
    });
}

function renderLatestUpdates() {
    const container = document.getElementById('latest-updates');
    if (!container) return;

    const updates = getLatestUpdates(5);
    const labels = getUILabels();
    container.innerHTML = '';

    if (updates.length === 0) {
        container.innerHTML = `<p class="text-center text-muted">${labels.noUpdates}</p>`;
        return;
    }

    updates.forEach(update => {
        const updateItem = createElement('div', ['update-item']);
        
        const categoryIcon = {
            'event': '🎉',
            'program': '🏋️',
            'library': '📚',
            'general': 'ℹ️'
        }[update.category] || 'ℹ️';

        updateItem.innerHTML = `
            <div class="update-date">${categoryIcon} ${formatDateBengali(update.date)}</div>
            <div class="update-title">${getText(update.title)}</div>
        `;
        container.appendChild(updateItem);
    });
}

function renderAboutPage() {
    const clubInfo = getClubInfo();
    const labels = getUILabels();
    if (!clubInfo) return;

    // Update page titles
    const historyTitle = document.querySelector('.section-title');
    if (historyTitle) historyTitle.textContent = labels.history;

    const missionVisionTitle = document.querySelector('.section-light .section-title');
    if (missionVisionTitle) missionVisionTitle.textContent = labels.missionVision;

    const facilitiesTitle = document.querySelectorAll('.section-title')[2];
    const facilitiesSubtitle = document.querySelector('.section-subtitle');
    if (facilitiesTitle) facilitiesTitle.textContent = labels.ourFacilities;
    if (facilitiesSubtitle) facilitiesSubtitle.textContent = labels.facilitiesSubtitle;

    // Update mission/vision card titles
    const missionCardTitle = document.querySelector('.mission-card h3');
    const visionCardTitle = document.querySelector('.vision-card h3');
    if (missionCardTitle) missionCardTitle.textContent = labels.ourMission;
    if (visionCardTitle) visionCardTitle.textContent = labels.ourVision;

    const historyContent = document.getElementById('history-content');
    if (historyContent) {
        historyContent.textContent = getText(clubInfo.history);
    }

    const missionContent = document.getElementById('mission-content');
    if (missionContent) {
        missionContent.textContent = getText(clubInfo.mission);
    }

    const visionContent = document.getElementById('vision-content');
    if (visionContent) {
        visionContent.textContent = getText(clubInfo.vision);
    }

    renderFacilities();
    renderCommonElements();
}

function renderFacilities() {
    const facilitiesGrid = document.getElementById('facilities-grid');
    const clubInfo = getClubInfo();
    
    if (!facilitiesGrid || !clubInfo) return;

    facilitiesGrid.innerHTML = '';

    clubInfo.facilities.forEach(facility => {
        const facilityItem = createElement('div', ['facility-item']);
        facilityItem.innerHTML = `
            <div class="facility-icon">${facility.icon}</div>
            <h3 class="facility-name">${getText(facility.name)}</h3>
            <p class="text-sm text-muted">${getText(facility.description)}</p>
        `;
        facilitiesGrid.appendChild(facilityItem);
    });
}

function renderProgramsPage() {
    const programsGrid = document.getElementById('programs-grid');
    if (!programsGrid) return;

    const programs = getPrograms();
    programsGrid.innerHTML = '';

    programs.forEach(program => {
        programsGrid.appendChild(createProgramCard(program));
    });

    renderCommonElements();
}

function renderEventsPage() {
    const eventsContainer = document.getElementById('events-container');
    if (!eventsContainer) return;

    const events = getEvents();
    const labels = getUILabels();
    const basePath = getBasePath();
    
    eventsContainer.innerHTML = '';

    events.forEach(event => {
        const eventCard = createElement('div', ['event-card-large', 'mb-8']);
        
        const galleryHTML = event.gallery && event.gallery.length > 0 ? `
            <div class="event-gallery">
                <h3 class="event-gallery-title">${labels.gallery}</h3>
                <div class="gallery-grid">
                    ${event.gallery.map(img => `
                        <div class="gallery-item">
                            <img src="${basePath}${img}" alt="${getText(event.name)}" class="img-cover">
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        eventCard.innerHTML = `
            <div class="card-image">
                <img src="${basePath}${event.image}" alt="${getText(event.name)}" class="img-cover">
                ${event.isFlagship ? `<div class="event-badge">${labels.flagship}</div>` : ''}
            </div>
            <div class="card-body card-body-lg">
                <h2 class="card-title">${event.icon} ${getText(event.name)}</h2>
                <p class="card-text">${getText(event.description)}</p>
                <div class="card-meta">
                    <div class="card-meta-item">
                        <span>📅</span>
                        <span>${getText(event.date.display)}</span>
                    </div>
                    <div class="card-meta-item">
                        <span>📍</span>
                        <span>${getText(event.location)}</span>
                    </div>
                </div>
                ${galleryHTML}
            </div>
        `;
        
        eventsContainer.appendChild(eventCard);
    });

    renderCommonElements();
}

function renderLibraryPage() {
    const library = getLibrary();
    const labels = getUILabels();
    if (!library) return;

    const libraryName = document.getElementById('library-name');
    if (libraryName) {
        libraryName.textContent = getText(library.name);
    }

    const statusBanner = document.getElementById('library-status-banner');
    if (statusBanner) {
        const statusClass = library.status === 'closed' ? 'status-banner-closed' :
                          library.status === 'open' ? 'status-banner-open' :
                          'status-banner-upcoming';
        
        const statusIcon = library.status === 'closed' ? '🔴' :
                          library.status === 'open' ? '✅' : '🟡';

        statusBanner.innerHTML = `
            <div class="status-banner ${statusClass}">
                <div class="status-banner-icon">${statusIcon}</div>
                <div class="status-banner-content">
                    <div class="status-banner-title">${getText(library.statusMessage)}</div>
                </div>
            </div>
        `;
    }

    // Update page section titles
    const aboutTitle = document.querySelector('.section .section-title');
    if (aboutTitle) aboutTitle.textContent = labels.aboutLibrary;

    const bookCollectionTitle = document.querySelector('.about-history h3');
    if (bookCollectionTitle) bookCollectionTitle.textContent = labels.bookCollection;

    const openingNoticeTitle = document.querySelector('.section-light .alert-title');
    if (openingNoticeTitle) openingNoticeTitle.textContent = labels.openingNotice;

    const description = document.getElementById('library-description');
    if (description) {
        description.textContent = getText(library.description);
    }

    const totalBooks = document.getElementById('total-books');
    if (totalBooks) {
        totalBooks.textContent = library.totalBooks + '+';
    }

    const categoriesContainer = document.getElementById('library-categories');
    if (categoriesContainer) {
        categoriesContainer.innerHTML = '';
        library.categories.forEach(category => {
            const categoryItem = createElement('div', ['library-category']);
            categoryItem.innerHTML = `
                <div class="library-category-icon">${category.icon}</div>
                <div class="library-category-name">${getText(category.name)}</div>
            `;
            categoriesContainer.appendChild(categoryItem);
        });
    }

    const openingNotice = document.getElementById('opening-notice');
    if (openingNotice && library.openingNotice) {
        openingNotice.textContent = getText(library.openingNotice);
    }

    renderCommonElements();
}

function renderUpdatesPage() {
    const updatesList = document.getElementById('updates-list');
    const labels = getUILabels();
    if (!updatesList) return;

    // Update filter buttons
    updateFilterLabels();

    const updates = getActiveUpdates();
    updatesList.innerHTML = '';

    if (updates.length === 0) {
        updatesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3 class="empty-state-title">${labels.noUpdates}</h3>
            </div>
        `;
        return;
    }

    updates.forEach(update => {
        updatesList.appendChild(createUpdateCard(update));
    });

    // Initialize filter functionality
    initUpdatesFilter();

    renderCommonElements();
}

function updateFilterLabels() {
    const labels = getUILabels();
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        const category = btn.dataset.category;
        switch(category) {
            case 'all':
                btn.textContent = labels.filterAll;
                break;
            case 'event':
                btn.textContent = labels.filterEvent;
                break;
            case 'program':
                btn.textContent = labels.filterProgram;
                break;
            case 'library':
                btn.textContent = labels.filterLibrary;
                break;
            case 'general':
                btn.textContent = labels.filterGeneral;
                break;
        }
    });
}

function createUpdateCard(update) {
    const card = createElement('div', ['update-card', update.category]);
    const labels = getUILabels();
    const basePath = getBasePath();
    
    if (update.isPinned) card.classList.add('pinned');

    const categoryLabels = {
        'event': labels.filterEvent,
        'program': labels.filterProgram,
        'library': labels.filterLibrary,
        'general': labels.filterGeneral
    };

    const imageHTML = update.image ? `
        <img src="${basePath}${update.image}" alt="${getText(update.title)}" class="img-responsive rounded-lg mb-4">
    ` : '';

    card.innerHTML = `
        <div class="update-header">
            <div>
                <div class="text-sm text-muted mb-2">${formatDateBengali(update.date)}</div>
                ${update.isPinned ? `<span class="badge badge-accent mr-2">📌 ${labels.pinned}</span>` : ''}
                <span class="update-category-badge badge badge-${update.category}-light">
                    ${categoryLabels[update.category]}
                </span>
            </div>
        </div>
        <h3 class="mb-3">${getText(update.title)}</h3>
        ${imageHTML}
        <p>${getText(update.content)}</p>
    `;

    return card;
}

function renderCommunityPage() {
    const labels = getUILabels();

    // Update section titles
    const execTitle = document.querySelector('.committee-title');
    if (execTitle) execTitle.textContent = labels.executiveCommittee;

    const subcommTitle = document.querySelector('.section-light .section-title');
    if (subcommTitle) subcommTitle.textContent = labels.subcommittees;

    renderExecutiveCommittee();
    renderSubcommittees();
    renderCommonElements();
}

function renderExecutiveCommittee() {
    const container = document.getElementById('executive-committee');
    if (!container) return;

    const executive = getExecutiveCommittee();
    const basePath = getBasePath();
    
    container.innerHTML = '';

    executive.forEach(member => {
        const memberCard = createElement('div', ['committee-member']);
        memberCard.innerHTML = `
            <div class="member-photo">
                <img src="${basePath}${member.photo}" alt="${member.name}" class="img-cover">
            </div>
            <div class="member-role">${getText(member.role)}</div>
            <div class="member-name">${member.name}</div>
            ${member.phone ? `<div class="member-contact">📞 ${member.phone}</div>` : ''}
        `;
        container.appendChild(memberCard);
    });
}

function renderSubcommittees() {
    const container = document.getElementById('subcommittees-container');
    if (!container) return;

    const subcommittees = getSubcommittees();
    container.innerHTML = '';

    subcommittees.forEach(subcommittee => {
        const section = createElement('div', ['mb-12']);
        
        const membersList = subcommittee.members.map(member => `
            <li class="flex justify-between items-center py-2 border-b border-gray-200">
                <span>${member.name}</span>
                <span class="text-sm text-muted">${getText(member.role)}</span>
            </li>
        `).join('');

        section.innerHTML = `
            <h3 class="text-xl font-semibold mb-4">${getText(subcommittee.name)}</h3>
            <div class="card">
                <div class="card-body">
                    <ul class="list">
                        ${membersList}
                    </ul>
                </div>
            </div>
        `;
        
        container.appendChild(section);
    });
}

function renderContactPage() {
    const clubInfo = getClubInfo();
    const labels = getUILabels();
    if (!clubInfo) return;

    // Update section title
    const infoTitle = document.querySelector('h2');
    if (infoTitle) infoTitle.textContent = labels.contactInfo;

    const formTitle = document.querySelector('.contact-form-wrapper h2');
    if (formTitle) formTitle.textContent = labels.sendMessage;

    const hoursTitle = document.querySelector('.card h3');
    if (hoursTitle) hoursTitle.textContent = `⏰ ${labels.openingHours}`;

    const contactContainer = document.getElementById('contact-info-container');
    if (contactContainer) {
        contactContainer.innerHTML = `
            <div class="contact-info-item">
                <div class="contact-info-icon">📍</div>
                <div>
                    <div class="contact-info-label">${labels.address}</div>
                    <div class="contact-info-value">${getText(clubInfo.contact.address)}</div>
                </div>
            </div>
            <div class="contact-info-item">
                <div class="contact-info-icon">📞</div>
                <div>
                    <div class="contact-info-label">${labels.phone}</div>
                    <div class="contact-info-value">${clubInfo.contact.phone}</div>
                </div>
            </div>
            <div class="contact-info-item">
                <div class="contact-info-icon">✉️</div>
                <div>
                    <div class="contact-info-label">${labels.email}</div>
                    <div class="contact-info-value">${clubInfo.contact.email}</div>
                </div>
            </div>
        `;
    }

    const openingHours = document.getElementById('opening-hours');
    if (openingHours) {
        openingHours.textContent = getText(clubInfo.hours);
    }

    const mapContainer = document.getElementById('contact-map');
    if (mapContainer && clubInfo.contact.mapEmbed) {
        mapContainer.innerHTML = `
            <iframe 
                src="${clubInfo.contact.mapEmbed}" 
                width="100%" 
                height="100%" 
                style="border:0;" 
                allowfullscreen="" 
                loading="lazy">
            </iframe>
        `;
    }

    // Update form labels
    updateContactFormLabels();

    // Initialize contact form
    initContactForm();

    renderCommonElements();
}

function updateContactFormLabels() {
    const labels = getUILabels();
    
    const nameLabel = document.querySelector('label[for="name"]');
    if (nameLabel) nameLabel.innerHTML = `${labels.name} <span class="text-error">*</span>`;
    
    const phoneLabel = document.querySelector('label[for="phone"]');
    if (phoneLabel) phoneLabel.innerHTML = `${labels.phoneNumber} <span class="text-error">*</span>`;
    
    const emailLabel = document.querySelector('label[for="email"]');
    if (emailLabel) emailLabel.textContent = labels.emailOptional;
    
    const subjectLabel = document.querySelector('label[for="subject"]');
    if (subjectLabel) subjectLabel.innerHTML = `${labels.subject} <span class="text-error">*</span>`;
    
    const messageLabel = document.querySelector('label[for="message"]');
    if (messageLabel) messageLabel.innerHTML = `${labels.message} <span class="text-error">*</span>`;
    
    const submitBtn = document.querySelector('#contact-form button[type="submit"]');
    if (submitBtn) submitBtn.textContent = labels.send;

    // Update select options
    const subjectSelect = document.getElementById('subject');
    if (subjectSelect) {
        subjectSelect.innerHTML = `
            <option value="">${labels.selectOption}</option>
            <option value="membership">${labels.membership}</option>
            <option value="program">${labels.aboutProgram}</option>
            <option value="event">${labels.aboutEvent}</option>
            <option value="other">${labels.other}</option>
        `;
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

// ============================================
// UPDATED: Fixed Footer Links with Proper Translations
// ============================================
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

    // Mobile CTA
    const mobileCta = document.querySelector('.nav-mobile-cta .btn');
    if (mobileCta) mobileCta.innerHTML = labels.contact;

    // ===== FIXED FOOTER LINKS =====
    const footerLinks = document.querySelectorAll('.footer-links a');
    
    // First column (Links) - Home, About, Programs, Events
    if (footerLinks[0]) footerLinks[0].textContent = labels.home;
    if (footerLinks[1]) footerLinks[1].textContent = labels.about;
    if (footerLinks[2]) footerLinks[2].textContent = labels.programs;
    if (footerLinks[3]) footerLinks[3].textContent = labels.events;
    
    // Second column (More) - Library, Updates, Committee, Achievements, Gallery, Contact
    // Index 4-9 based on your HTML structure
    if (footerLinks[4]) footerLinks[4].textContent = labels.library;        // Library
    if (footerLinks[5]) footerLinks[5].textContent = labels.updates;        // Updates
    if (footerLinks[6]) footerLinks[6].textContent = labels.committee;      // Committee
    if (footerLinks[7]) footerLinks[7].textContent = labels.achievements;   // Sharad Samman
    if (footerLinks[8]) footerLinks[8].textContent = labels.gallery;        // Gallery
    if (footerLinks[9]) footerLinks[9].textContent = labels.contact;        // Contact
}

function renderSocialLinks() {
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