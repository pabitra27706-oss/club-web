/*
 * Data Loader Module
 * Fetches and caches JSON data
 */

const appData = {
  clubInfo: null,
  programs: null,
  events: null,
  library: null,
  updates: null,
  community: null,
  isLoaded: false
};

async function fetchJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    return null;
  }
}

async function loadAllData() {
  if (appData.isLoaded) {
    return appData;
  }
  
  try {
    const isInPages = window.location.pathname.includes('/pages/');
    const basePath = isInPages ? '../data/' : 'data/';
    
    const [clubInfo, programs, events, library, updates, community] = await Promise.all([
      fetchJSON(`${basePath}club-info.json`),
      fetchJSON(`${basePath}programs.json`),
      fetchJSON(`${basePath}events.json`),
      fetchJSON(`${basePath}library.json`),
      fetchJSON(`${basePath}updates.json`),
      fetchJSON(`${basePath}community.json`)
    ]);
    
    appData.clubInfo = clubInfo;
    appData.programs = programs || [];
    appData.events = events || [];
    appData.library = library;
    appData.updates = updates || [];
    appData.community = community;
    appData.isLoaded = true;
    
    return appData;
  } catch (error) {
    console.error('Error loading data:', error);
    return appData;
  }
}

function getClubInfo() {
  return appData.clubInfo;
}

function getPrograms() {
  return appData.programs.sort((a, b) => a.order - b.order);
}

function getActivePrograms() {
  return appData.programs.filter(p => p.status === 'active').sort((a, b) => a.order - b.order);
}

function getProgramById(id) {
  return appData.programs.find(p => p.id === id);
}

function getEvents() {
  return appData.events.sort((a, b) => a.order - b.order);
}

function getUpcomingEvents() {
  return appData.events.filter(e => e.status === 'upcoming').sort((a, b) => a.order - b.order);
}

function getFlagshipEvent() {
  return appData.events.find(e => e.isFlagship === true);
}

function getLibrary() {
  return appData.library;
}

function getUpdates() {
  return appData.updates.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getActiveUpdates() {
  return appData.updates
    .filter(u => u.isActive === true)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date) - new Date(a.date);
    });
}

function getLatestUpdates(count = 5) {
  return getActiveUpdates().slice(0, count);
}

function getUpdatesByCategory(category) {
  if (category === 'all') {
    return getActiveUpdates();
  }
  return appData.updates
    .filter(u => u.isActive && u.category === category)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getCommunity() {
  return appData.community;
}

function getExecutiveCommittee() {
  return appData.community.executive.sort((a, b) => a.order - b.order);
}

function getSubcommittees() {
  return appData.community.subcommittees;
}

function formatDateBengali(dateString) {
  const date = new Date(dateString);
  const lang = getLang();
  
  const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const day = date.getDate();
  const month = lang === 'bn' ? monthsBn[date.getMonth()] : monthsEn[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const lang = getLang();
  
  if (lang === 'bn') {
    if (diffDays === 0) return 'আজ';
    if (diffDays === 1) return 'গতকাল';
    if (diffDays < 7) return `${diffDays} দিন আগে`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} সপ্তাহ আগে`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} মাস আগে`;
    return `${Math.floor(diffDays / 365)} বছর আগে`;
  } else {
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
}