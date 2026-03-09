// ============================================
// EVENT POP-UP BANNER SYSTEM
// Dynamically shows upcoming event pop-up
// ============================================

(function() {
  'use strict';
  
  // ---- Configuration ----
  const CONFIG = {
    DAYS_BEFORE: 60,
    DAYS_AFTER_END: 7,
    SHOW_DELAY: 400,
    CLOSE_ANIMATION_DURATION: 400,
    EVENTS_PATH: 'data/events.json'
  };
  
  // ---- Language Helper ----
  function getLang() {
    return localStorage.getItem('language') || document.documentElement.lang || 'bn';
  }
  
  // ---- Bengali Number Converter ----
  function toBengaliNumber(num) {
    const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(d => digits[parseInt(d)] || d).join('');
  }
  
  // ---- Find Active Event ----
  function findActiveEvent(events) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eligible = [];
    
    events.forEach(event => {
      if (!event.date || !event.date.startDate || !event.date.endDate) return;
      
      const start = new Date(event.date.startDate + 'T00:00:00');
      const end = new Date(event.date.endDate + 'T00:00:00');
      
      const showFrom = new Date(start);
      showFrom.setDate(showFrom.getDate() - CONFIG.DAYS_BEFORE);
      
      const showUntil = new Date(end);
      showUntil.setDate(showUntil.getDate() + CONFIG.DAYS_AFTER_END);
      
      if (today >= showFrom && today <= showUntil) {
        let status, daysCount;
        
        if (today < start) {
          status = 'upcoming';
          daysCount = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
        } else if (today >= start && today <= end) {
          status = 'ongoing';
          daysCount = 0;
        } else {
          status = 'concluded';
          daysCount = Math.ceil((today - end) / (1000 * 60 * 60 * 24));
        }
        
        eligible.push({
          ...event,
          _status: status,
          _daysCount: daysCount
        });
      }
    });
    
    if (eligible.length === 0) return null;
    
    // Flagship gets priority
    const flagship = eligible.find(e => e.isFlagship);
    if (flagship) return flagship;
    
    // Otherwise: ongoing > nearest upcoming > recently concluded
    eligible.sort((a, b) => {
      const priority = { ongoing: 0, upcoming: 1, concluded: 2 };
      if (priority[a._status] !== priority[b._status]) {
        return priority[a._status] - priority[b._status];
      }
      return a._daysCount - b._daysCount;
    });
    
    return eligible[0];
  }
  
  // ---- Build Countdown Text ----
  function getCountdownText(event) {
    const lang = getLang();
    
    switch (event._status) {
      case 'upcoming':
        if (lang === 'bn') {
          return `⏳ ${toBengaliNumber(event._daysCount)} দিন বাকি`;
        }
        return `⏳ ${event._daysCount} days left`;
        
      case 'ongoing':
        return lang === 'bn' ? '🎉 চলছে!' : '🎉 Happening Now!';
        
      case 'concluded':
        return lang === 'bn' ? '✅ সম্প্রতি সম্পন্ন' : '✅ Recently Concluded';
        
      default:
        return '';
    }
  }
  
  // ---- Create & Show Pop-Up ----
  function showPopup(event) {
    const lang = getLang();
    const countdownText = getCountdownText(event);
    
    const name = lang === 'bn' ? event.name.bn : event.name.en;
    const location = lang === 'bn' ? event.location.bn : event.location.en;
    const dateDisplay = lang === 'bn' ? event.date.display.bn : event.date.display.en;
    const description = lang === 'bn' ? event.description.bn : event.description.en;
    
    const hintClick = lang === 'bn' ?
      '👆 বিস্তারিত জানতে ব্যানারে ক্লিক করুন' :
      '👆 Click banner for details';
    const outsideHint = lang === 'bn' ?
      'বন্ধ করতে বাইরে ক্লিক করুন' :
      'Click outside to close';
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'event-popup-overlay';
    overlay.id = 'event-popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', name);
    
    overlay.innerHTML = `
            <div class="event-popup-banner" id="event-popup-banner">
                <div class="event-popup-image">
                    <img 
                        src="${event.image}" 
                        alt="${name}"
                        loading="eager"
                        onerror="this.parentElement.innerHTML='<div class=\\'event-popup-image-fallback\\'>${event.icon}</div>'"
                    >
                    <div class="event-popup-countdown ${event._status}">
                        ${countdownText}
                    </div>
                </div>
                <div class="event-popup-content">
                    <span class="event-popup-icon">${event.icon}</span>
                    <h2 class="event-popup-name">${name}</h2>
                    <p class="event-popup-date">
                        <span>📍 ${location}</span>
                        <span>•</span>
                        <span> ${dateDisplay}</span>
                    </p>
                    <div class="event-popup-divider"></div>
                    <p class="event-popup-description">${description}</p>
                    <p class="event-popup-hint">
                        <span class="click-banner">${hintClick}</span><br>
                        <span>${outsideHint}</span>
                    </p>
                </div>
            </div>
            <p class="event-popup-outside-hint">${outsideHint}</p>
        `;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Append to body
    document.body.appendChild(overlay);
    
    // Trigger entrance animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('active');
      });
    });
    
    // ---- Event Listeners ----
    
    const banner = document.getElementById('event-popup-banner');
    
    // Click ON banner → redirect to events page
    banner.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = 'pages/events.html';
    });
    
    // Click OUTSIDE banner → close popup, start hero animation
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closePopup(overlay);
      }
    });
    
    // ESC key → close popup
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closePopup(overlay);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }
  
  // ---- Close Pop-Up ----
  function closePopup(overlay) {
    overlay.classList.add('closing');
    overlay.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    setTimeout(() => {
      overlay.remove();
      
      // Start hero animation after popup is fully gone
      triggerHeroAnimation();
    }, CONFIG.CLOSE_ANIMATION_DURATION);
  }
  
  // ---- Trigger Hero Animation ----
  function triggerHeroAnimation() {
    if (typeof initHeroSequence === 'function') {
      initHeroSequence();
    } else {
      console.warn('initHeroSequence not found. Hero animation skipped.');
    }
  }
  
  // ---- Initialize ----
  async function init() {
    try {
      const response = await fetch(CONFIG.EVENTS_PATH);
      
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const events = await response.json();
      const activeEvent = findActiveEvent(events);
      
      if (activeEvent) {
        // Show popup (hero animation waits)
        setTimeout(() => {
          showPopup(activeEvent);
        }, CONFIG.SHOW_DELAY);
      } else {
        // No event in range → start hero animation directly
        triggerHeroAnimation();
      }
    } catch (error) {
      console.log('Event popup error:', error);
      // On any error, start hero animation
      triggerHeroAnimation();
    }
  }
  
  // ---- DOM Ready ----
  document.addEventListener('DOMContentLoaded', () => {
    // Small delay to let language/data scripts initialize first
    setTimeout(init, 300);
  });
  
})();