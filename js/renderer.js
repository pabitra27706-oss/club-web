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

    // Update club name
    const clubNameElements = document.querySelectorAll('#club-name');
    clubNameElements.forEach(el => {
        el.textContent = getText(clubInfo.name);
    });

    // Footer club name
    const footerClubName = document.getElementById('footer-club-name');
    if (footerClubName) {
        footerClubName.textContent = getText(clubInfo.name);
    }

    // Footer about text
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

    renderSocialLinks();
    renderFooterContact();
}

function updateNavigationLabels() {
    const labels = getUILabels();
    
    // Desktop nav
    const navLinks = document.querySelectorAll('.nav-desktop .nav-link');
    const navLabels = [labels.home, labels.about, labels.programs, labels.events, labels.library, labels.updates, labels.committee];
    navLinks.forEach((link, index) => {
        if (navLabels[index]) {
            link.textContent = navLabels[index];
        }
    });

    // Desktop CTA button
    const headerCta = document.querySelector('.header-cta');
    if (headerCta) headerCta.textContent = labels.contact;

    // Mobile nav
    const mobileLinks = document.querySelectorAll('.nav-mobile-link');
    const mobileLabels = [
        `🏠 ${labels.home}`,
        `📖 ${labels.about}`,
        `🏋️ ${labels.programs}`,
        `🎉 ${labels.events}`,
        `📚 ${labels.library}`,
        `📢 ${labels.updates}`,
        `👥 ${labels.committee}`
    ];
    mobileLinks.forEach((link, index) => {
        if (mobileLabels[index]) {
            link.textContent = mobileLabels[index];
        }
    });

    // Mobile CTA
    const mobileCta = document.querySelector('.nav-mobile-cta .btn');
    if (mobileCta) mobileCta.textContent = labels.contact;

    // Footer links
    const footerLinks = document.querySelectorAll('.footer-links a');
    const footerLabels = [labels.home, labels.about, labels.programs, labels.events, labels.library, labels.updates, labels.committee, labels.contact];
    footerLinks.forEach((link, index) => {
        if (footerLabels[index]) {
            link.textContent = footerLabels[index];
        }
    });
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

function renderSocialLinks() {
    const clubInfo = getClubInfo();
    const socialContainer = document.getElementById('social-links');
    
    if (!socialContainer || !clubInfo) return;

    const socialLinks = [];
    
    if (clubInfo.social.facebook) {
        socialLinks.push(`<a href="${clubInfo.social.facebook}" class="social-link" target="_blank" rel="noopener" aria-label="Facebook">f</a>`);
    }
    if (clubInfo.social.instagram) {
        socialLinks.push(`<a href="${clubInfo.social.instagram}" class="social-link" target="_blank" rel="noopener" aria-label="Instagram">📷</a>`);
    }
    if (clubInfo.social.youtube) {
        socialLinks.push(`<a href="${clubInfo.social.youtube}" class="social-link" target="_blank" rel="noopener" aria-label="YouTube">▶️</a>`);
    }

    socialContainer.innerHTML = socialLinks.join('');
}