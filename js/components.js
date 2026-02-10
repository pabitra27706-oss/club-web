/**
 * =====================================================
 * UI COMPONENTS MODULE
 * =====================================================
 * Reusable component rendering functions.
 * =====================================================
 */

const Components = (function() {
  
  /**
   * Render a program card
   */
  function programCard(program) {
    const title = I18n.getText(program.title);
    const description = I18n.getText(program.shortDescription);
    const status = program.status || 'active';
    const statusText = I18n.translate(`status.${status}`);
    
    return `
      <article class="card" data-program="${program.slug}">
        <div class="card__image">
          <img 
            src="${program.image || CONFIG.placeholders.program}" 
            alt="${title}"
            loading="lazy"
          >
          ${program.icon ? `<span class="card__icon">${program.icon}</span>` : ''}
        </div>
        <div class="card__body">
          <div class="flex justify-between items-start mb-2">
            <h3 class="card__title">${title}</h3>
            <span class="badge badge--${status === 'active' ? 'open' : 'closed'}">
              <span class="badge__dot"></span>
              ${statusText}
            </span>
          </div>
          <p class="card__text">${description}</p>
          <a href="pages/programs.html#${program.slug}" class="btn btn--sm btn--outline">
            ${I18n.translate('ui.learnMore')}
          </a>
        </div>
      </article>
    `;
  }
  
  /**
   * Render an event card
   */
  function eventCard(event) {
    const title = I18n.getText(event.title);
    const description = I18n.getText(event.description);
    const status = event.status || 'upcoming';
    
    return `
      <article class="card" data-event="${event.slug}">
        <div class="card__image">
          <img 
            src="${event.image || CONFIG.placeholders.event}" 
            alt="${title}"
            loading="lazy"
          >
          ${event.flagship ? '<span class="badge badge--primary">Flagship</span>' : ''}
        </div>
        <div class="card__body">
          <h3 class="card__title">${title}</h3>
          <p class="card__text">${description}</p>
          <div class="card__meta text-sm text-muted">
            <span>${event.month || ''}</span>
            ${event.type ? `<span class="badge badge--${status}">${event.type}</span>` : ''}
          </div>
        </div>
      </article>
    `;
  }
  
  /**
   * Render an update card
   */
  function updateCard(update) {
    const title = I18n.getText(update.title);
    const summary = I18n.getText(update.summary);
    const date = new Date(update.date);
    const day = date.getDate();
    const month = date.toLocaleDateString(I18n.getCurrentLang() === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' });
    const priorityClass = update.priority === 'urgent' ? 'update-card--urgent' : 
                          update.priority === 'important' ? 'update-card--important' : '';
    
    return `
      <article class="update-card ${priorityClass}">
        <div class="update-card__date">
          <span class="update-card__day">${day}</span>
          <span class="update-card__month">${month}</span>
        </div>
        <div class="update-card__content">
          <h4 class="update-card__title">${title}</h4>
          <p class="update-card__summary">${summary}</p>
          <span class="update-card__type">${update.type}</span>
        </div>
      </article>
    `;
  }
  
  /**
   * Render a person card
   */
  function personCard(person) {
    const name = I18n.getText(person.name);
    const role = I18n.getText(person.role);
    
    return `
      <article class="person-card">
        <div class="person-card__image">
          <img 
            src="${person.photo || CONFIG.placeholders.person}" 
            alt="${name}"
            loading="lazy"
          >
        </div>
        <h4 class="person-card__name">${name}</h4>
        <p class="person-card__role">${role}</p>
        ${person.since ? `<p class="text-sm text-muted">${I18n.translate('misc.since')} ${person.since}</p>` : ''}
      </article>
    `;
  }
  
  /**
   * Render stats section
   */
  function statsSection(stats) {
    return `
      <div class="stats">
        <div class="stat">
          <span class="stat__number">${new Date().getFullYear() - 1937}</span>
          <span class="stat__label">${I18n.translate('misc.years')}</span>
        </div>
        <div class="stat">
          <span class="stat__number">${stats.memberCount || '500'}+</span>
          <span class="stat__label">${I18n.translate('misc.members')}</span>
        </div>
        <div class="stat">
          <span class="stat__number">${stats.programCount || '6'}</span>
          <span class="stat__label">${I18n.translate('misc.programs')}</span>
        </div>
        <div class="stat">
          <span class="stat__number">${stats.eventCount || '4'}</span>
          <span class="stat__label">${I18n.translate('misc.events')}</span>
        </div>
      </div>
    `;
  }
  
  /**
   * Render loading state
   */
  function loading() {
    return `
      <div class="loading">
        <div class="loading__spinner"></div>
      </div>
    `;
  }
  
  /**
   * Render empty state
   */
  function emptyState(message) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">📭</div>
        <h3 class="empty-state__title">${message || I18n.translate('ui.error')}</h3>
      </div>
    `;
  }
  
  /**
   * Render status badge
   */
  function statusBadge(status, text) {
    const badgeClass = status === 'open' ? 'badge--open' : 
                       status === 'closed' ? 'badge--closed' : 
                       'badge--upcoming';
    return `
      <span class="badge ${badgeClass}">
        <span class="badge__dot"></span>
        ${text || I18n.translate(`status.${status}`)}
      </span>
    `;
  }
  
  // Public API
  return {
    programCard,
    eventCard,
    updateCard,
    personCard,
    statsSection,
    loading,
    emptyState,
    statusBadge
  };
})();