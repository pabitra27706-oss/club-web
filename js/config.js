/**
 * =====================================================
 * CONFIGURATION
 * =====================================================
 * Central configuration for the website.
 * Edit these values to customize for different clubs.
 * =====================================================
 */

const CONFIG = {
  // Site Information
  siteName: {
    bn: "Sarberia Pally Seba Samity",
    en: "Sarberia Pally Seba Samity"
  },
  
  // Default Language
  defaultLang: "bn", // "bn" for Bengali, "en" for English
  
  // Supported Languages
  languages: ["bn", "en"],
  
  // Data Paths (relative to root)
  dataPaths: {
    clubInfo: "./data/club-info.json",
    programs: "./data/programs.json",
    events: "./data/events.json",
    library: "./data/library.json",
    updates: "./data/updates.json",
    community: "./data/community.json"
  },
  
  // Number of updates to show on home page
  homeUpdatesCount: 3,
  
  // Date Format
  dateFormat: {
    bn: { day: 'numeric', month: 'long', year: 'numeric' },
    en: { day: 'numeric', month: 'short', year: 'numeric' }
  },
  
  // Image Placeholders
  placeholders: {
    program: "./assets/images/common/placeholder-program.jpg",
    event: "./assets/images/common/placeholder-event.jpg",
    person: "./assets/images/common/placeholder-person.jpg",
    gallery: "./assets/images/common/placeholder-gallery.jpg"
  },
  
  // Contact Form Endpoint (Formspree or similar)
  formEndpoint: "https://formspree.io/f/maqdnaov",
  
  // Social Media Links (populated from club-info.json)
  social: {}
};

// Freeze config to prevent accidental modification
Object.freeze(CONFIG);