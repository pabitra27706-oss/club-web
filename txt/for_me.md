# Complete Admin & Maintenance Guide

## 📋 Table of Contents

1. [Daily Updates - Adding New Content](#1-daily-updates)
2. [Image Guidelines](#2-image-guidelines)
3. [Common Tasks](#3-common-tasks)
4. [Troubleshooting & Bug Fixes](#4-troubleshooting)
5. [JSON Editing Rules](#5-json-rules)
6. [Deployment Process](#6-deployment)
7. [Emergency Fixes](#7-emergency)

---

# 1. Daily Updates

## 📢 Adding New Update/Notice

**File:** `data/updates.json`

**Step 1:** Open the file and add NEW object at the **TOP** of the array (after the `[`)

```json
[
  {
    "id": "update-2025-07-20-001",
    "date": "2025-07-20",
    "title": {
      "bn": "আপনার বাংলা শিরোনাম",
      "en": "Your English Title"
    },
    "content": {
      "bn": "বাংলায় সম্পূর্ণ বিবরণ লিখুন...",
      "en": "Write full description in English..."
    },
    "category": "event",
    "image": null,
    "isPinned": false,
    "isActive": true
  },
  // ... existing updates below
]
```

**Important Fields:**

| Field | Value | Description |
|-------|-------|-------------|
| `id` | `"update-YYYY-MM-DD-001"` | Unique ID (date + number) |
| `date` | `"2025-07-20"` | Format: YYYY-MM-DD |
| `category` | `"event"` / `"program"` / `"library"` / `"general"` | Choose one |
| `image` | `null` or `"assets/images/updates/filename.jpg"` | Optional image |
| `isPinned` | `true` / `false` | Pin to top of list |
| `isActive` | `true` / `false` | Show or hide |

**With Image:**
```json
"image": "assets/images/updates/puja-meeting.jpg"
```

---

## 🏋️ Adding New Program

**File:** `data/programs.json`

**Add to array:**

```json
{
  "id": "yoga",
  "name": {
    "bn": "যোগ প্রশিক্ষণ",
    "en": "Yoga Training"
  },
  "icon": "🧘",
  "image": "assets/images/programs/yoga.jpg",
  "description": {
    "bn": "সকলের জন্য যোগাসন ও ধ্যান প্রশিক্ষণ...",
    "en": "Yoga and meditation training for all..."
  },
  "schedule": {
    "days": {
      "bn": "প্রতিদিন",
      "en": "Daily"
    },
    "time": {
      "bn": "সকাল ৬টা - ৭টা",
      "en": "6 AM - 7 AM"
    }
  },
  "ageGroup": {
    "bn": "১৮+ বছর",
    "en": "18+ years"
  },
  "location": {
    "bn": "ক্লাব হল",
    "en": "Club Hall"
  },
  "instructor": "যোগী রাম প্রসাদ",
  "status": "active",
  "enrollmentOpen": true,
  "order": 6
}
```

**Status Options:**
- `"active"` → Currently running (green badge)
- `"inactive"` → Temporarily stopped (gray badge)
- `"upcoming"` → Starting soon (yellow badge)

**Don't forget:** Add image to `assets/images/programs/yoga.jpg`

---

## 🎉 Adding New Event

**File:** `data/events.json`

```json
{
  "id": "new-year",
  "name": {
    "bn": "নববর্ষ উদযাপন",
    "en": "New Year Celebration"
  },
  "icon": "🎊",
  "image": "assets/images/events/new-year.jpg",
  "description": {
    "bn": "বাংলা নববর্ষ উদযাপন...",
    "en": "Bengali New Year celebration..."
  },
  "date": {
    "display": {
      "bn": "এপ্রিল ২০২৬",
      "en": "April 2026"
    },
    "iso": "2026-04"
  },
  "location": {
    "bn": "ক্লাব প্রাঙ্গণ",
    "en": "Club Premises"
  },
  "type": "annual",
  "isFlagship": false,
  "gallery": [
    "assets/images/events/new-year-1.jpg",
    "assets/images/events/new-year-2.jpg"
  ],
  "status": "upcoming",
  "order": 5
}
```

**Event Status:**
- `"upcoming"` → Future event
- `"ongoing"` → Currently happening
- `"completed"` → Past event

**isFlagship:** Set `true` for main event (gets special badge)

---

## 👥 Adding New Committee Member

**File:** `data/community.json`

**Add to Executive:**
```json
{
  "role": {
    "bn": "যুগ্ম সম্পাদক",
    "en": "Joint Secretary"
  },
  "name": "শ্রী বিকাশ রায়",
  "photo": "assets/images/common/joint-secretary.jpg",
  "phone": "+91 98300 44444",
  "order": 4
}
```

**Add to Subcommittee:**
```json
{
  "name": "শ্রী অমল সেন",
  "role": {
    "bn": "সদস্য",
    "en": "Member"
  }
}
```

---

## 📚 Activate Library

**File:** `data/library.json`

**Change these fields:**

```json
{
  "status": "open",
  "statusMessage": {
    "bn": "খোলা আছে",
    "en": "Open Now"
  },
  "openingNotice": {
    "bn": "পাঠাগার এখন সকলের জন্য উন্মুক্ত। সময়: সন্ধ্যা ৫টা - রাত ৮টা",
    "en": "Library is now open for all. Timings: 5 PM - 8 PM"
  }
}
```

**Status Options:**
- `"closed"` → Red badge
- `"open"` → Green badge
- `"opening-soon"` → Yellow badge

---

## 📞 Update Contact Information

**File:** `data/club-info.json`

```json
"contact": {
  "phone": "+91 98300 12345",
  "email": "info@yourclub.org",
  "address": {
    "bn": "নতুন ঠিকানা এখানে...",
    "en": "New address here..."
  },
  "mapEmbed": "YOUR_GOOGLE_MAPS_EMBED_URL"
}
```

**Get Google Maps Embed:**
1. Go to Google Maps
2. Search your location
3. Click Share → Embed a map
4. Copy the `src="..."` URL part

---

# 2. Image Guidelines

## 📐 Image Sizes

| Image Type | Recommended Size | Aspect Ratio |
|------------|------------------|--------------|
| Logo | 200x200 px | 1:1 (square) |
| Hero Image | 1920x1080 px | 16:9 |
| Program Card | 800x500 px | 16:10 |
| Event Banner | 1200x630 px | ~2:1 |
| Gallery Images | 800x800 px | 1:1 (square) |
| Committee Photo | 400x400 px | 1:1 (square) |
| Update Image | 800x450 px | 16:9 |
| PWA Icon 192 | 192x192 px | 1:1 |
| PWA Icon 512 | 512x512 px | 1:1 |

## 📝 Image Naming Rules

```
✅ CORRECT:
gym.jpg
durga-puja.jpg
president.jpg
update-2025-06-15.jpg

❌ WRONG:
Gym Photo.jpg          (no spaces)
দুর্গা-পূজা.jpg           (no Bengali)
PRESIDENT.JPG          (lowercase preferred)
my photo (1).jpg       (no special characters)
```

**Rules:**
- Lowercase only
- Use hyphens (-) not spaces
- English only
- No special characters
- Keep names short

## 🖼️ Image Formats

| Format | Use For | Quality |
|--------|---------|---------|
| `.jpg` / `.jpeg` | Photos, banners | 80-85% quality |
| `.png` | Logo, icons (transparency) | Max compression |
| `.webp` | Modern browsers (optional) | Best compression |

## 📁 Where to Put Images

```
assets/images/
├── common/        → Logo, hero, committee photos
├── programs/      → Training program images
├── events/        → Event banners and galleries
├── library/       → Library photos
└── updates/       → Update/notice images
```

## 🔄 Replacing Images

Just upload new image with **SAME FILENAME** - it will automatically update.

**Example:** Replace `gym.jpg` with new photo → Upload new file as `gym.jpg`

---

# 3. Common Tasks

## ✏️ Edit Club Name

**File:** `data/club-info.json`

```json
"name": {
  "bn": "নতুন ক্লাবের নাম",
  "en": "New Club Name"
}
```

---

## 🎨 Change Website Colors

**File:** `css/variables.css`

```css
:root {
  /* Primary Color - Change this */
  --color-primary: #1a5f7a;        /* Main color */
  --color-primary-light: #2e8b9a;  /* Lighter shade */
  --color-primary-dark: #0d4a5f;   /* Darker shade */
  
  /* Secondary Color */
  --color-secondary: #c23a22;      /* Accent color */
}
```

**Color Picker Tools:**
- [coolors.co](https://coolors.co)
- [color.adobe.com](https://color.adobe.com)

---

## 📊 Update Stats on Home Page

**File:** `data/club-info.json`

```json
"stats": [
  {
    "value": "90+",
    "label": {
      "bn": "বছরের ঐতিহ্য",
      "en": "Years of Heritage"
    }
  },
  {
    "value": "600+",
    "label": {
      "bn": "সক্রিয় সদস্য",
      "en": "Active Members"
    }
  }
]
```

---

## 🔗 Update Social Media Links

**File:** `data/club-info.json`

```json
"social": {
  "facebook": "https://facebook.com/yourclub",
  "instagram": "https://instagram.com/yourclub",
  "twitter": "https://twitter.com/yourclub",
  "youtube": "https://youtube.com/@yourclub"
}
```

---

## 📅 Change Opening Hours

**File:** `data/club-info.json`

```json
"hours": {
  "bn": "সোমবার - শনিবার: সন্ধ্যা ৫টা - রাত ৯টা",
  "en": "Monday - Saturday: 5 PM - 9 PM"
}
```

---

## 🗑️ Hide/Delete Content

**DON'T DELETE** - Just hide it:

**For Updates:**
```json
"isActive": false
```

**For Programs:**
```json
"status": "inactive"
```

**For Events:**
```json
"status": "completed"
```

---

## 📌 Pin Important Update

**File:** `data/updates.json`

```json
"isPinned": true
```

Pinned updates always appear at top.

---

# 4. Troubleshooting & Bug Fixes

## ❌ Common Errors & Solutions

### Error: Page Shows Blank/Empty

**Cause:** JSON syntax error

**Fix:**
1. Open the JSON file you recently edited
2. Check for:
   - Missing comma `,` between objects
   - Missing quotes `"` around text
   - Extra comma after last item
   - Missing brackets `[]` or `{}`

**Validate JSON:**
- Go to [jsonlint.com](https://jsonlint.com)
- Paste your JSON
- Click "Validate JSON"
- Fix any errors shown

---

### Error: Image Not Showing

**Check:**
1. File exists in correct folder?
2. Filename matches JSON exactly? (case-sensitive!)
3. File extension correct? (.jpg not .jpeg?)
4. File actually uploaded?

**Test:** Open image directly in browser:
```
https://yoursite.netlify.app/assets/images/programs/gym.jpg
```

---

### Error: Styling Looks Broken

**Cause:** CSS file not loading

**Fix:**
1. Check all CSS files exist
2. Check file path in HTML `<link>` tags
3. Clear browser cache: `Ctrl + Shift + R`

---

### Error: Mobile Menu Not Working

**Cause:** JavaScript error

**Fix:**
1. Open browser console: `F12` → Console tab
2. Look for red error messages
3. Usually a JSON syntax error breaks JS

---

### Error: Updates Not Showing

**Check:**
1. `"isActive": true` ?
2. Date format correct? `"2025-07-20"`
3. Added to TOP of array?
4. Valid JSON syntax?

---

### Error: Bengali Text Shows ????

**Cause:** File encoding issue

**Fix:**
1. Open JSON file in proper editor (VS Code, Notepad++)
2. Save as UTF-8 encoding
3. Or copy Bengali text fresh from a working source

---

## 🔧 JSON Syntax Quick Fixes

### Missing Comma
```json
❌ WRONG:
{
  "name": "Test"
  "value": 123
}

✅ CORRECT:
{
  "name": "Test",
  "value": 123
}
```

### Extra Comma (Trailing Comma)
```json
❌ WRONG:
{
  "items": [
    "one",
    "two",
  ]
}

✅ CORRECT:
{
  "items": [
    "one",
    "two"
  ]
}
```

### Missing Quotes
```json
❌ WRONG:
{
  name: "Test"
}

✅ CORRECT:
{
  "name": "Test"
}
```

### Wrong Quotes (Smart Quotes)
```json
❌ WRONG:
{
  "name": "Test"  ← These are curly quotes
}

✅ CORRECT:
{
  "name": "Test"  ← These are straight quotes
}
```

**Tip:** Always type quotes manually, don't copy from Word/WhatsApp.

---

# 5. JSON Rules

## ✅ JSON Checklist

Before saving any JSON file:

- [ ] All strings in double quotes `"text"`
- [ ] Comma after every item except last
- [ ] No trailing comma after last item
- [ ] Brackets match: `[]` for arrays, `{}` for objects
- [ ] No comments (JSON doesn't support comments)
- [ ] Date format: `"YYYY-MM-DD"`
- [ ] File saved as UTF-8

## 📝 JSON Structure Reference

**Array (list of items):**
```json
[
  { "item": 1 },
  { "item": 2 },
  { "item": 3 }
]
```

**Object (single item with properties):**
```json
{
  "name": "Value",
  "count": 123,
  "active": true,
  "items": ["a", "b", "c"]
}
```

**Bilingual Text Pattern:**
```json
"fieldName": {
  "bn": "বাংলা টেক্সট",
  "en": "English text"
}
```

---

# 6. Deployment Process

## 🚀 How to Publish Changes

### Method 1: GitHub Desktop (Easiest)

1. Open GitHub Desktop
2. You'll see changed files listed
3. Write summary: "Added new update" 
4. Click **"Commit to main"**
5. Click **"Push origin"**
6. Wait 1-2 minutes
7. Check your website!

### Method 2: GitHub Web

1. Go to your repository on github.com
2. Navigate to the file
3. Click pencil icon (Edit)
4. Make changes
5. Click **"Commit changes"**
6. Netlify auto-deploys

### Method 3: Command Line

```bash
git add .
git commit -m "Your message here"
git push
```

## ⏱️ Deployment Time

- Changes visible in: **1-2 minutes**
- Check Netlify dashboard for build status
- Green = Success, Red = Error

## 🔍 Check Deployment Status

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click your site
3. See "Production deploys"
4. Latest should be green ✓

---

# 7. Emergency Fixes

## 🆘 Website Completely Broken

**Quick Fix - Revert Last Change:**

1. Go to GitHub repository
2. Click "Commits"
3. Find last working commit
4. Click "Browse files" on that commit
5. Copy the correct version of broken file
6. Fix current file

**Or in Netlify:**

1. Go to Netlify dashboard
2. Deploys → Click previous successful deploy
3. Click "Publish deploy"
4. Site restored to previous version!

---

## 💾 Backup Reminder

**Before major changes:**
1. Download current JSON file
2. Save copy on your computer
3. Name it: `updates-backup-2025-07-20.json`

---

## 📞 Quick Reference Card

### Add Update
```
File: data/updates.json
Add: New object at TOP
Required: id, date, title, content, category, isActive
```

### Add Program
```
File: data/programs.json
Add: New object in array
Required: id, name, icon, image, description, schedule, status
Image: assets/images/programs/
```

### Add Event
```
File: data/events.json
Add: New object in array
Required: id, name, icon, image, description, date, status
Image: assets/images/events/
```

### Add Committee Member
```
File: data/community.json
Add: To executive[] or subcommittees[]
Required: role, name, photo (for executive)
Image: assets/images/common/
```

### Activate Library
```
File: data/library.json
Change: "status": "open"
```

### Change Contact
```
File: data/club-info.json
Edit: contact.phone, contact.email, contact.address
```

---

## 🔢 ID Formats

| Content | ID Format | Example |
|---------|-----------|---------|
| Update | `update-YYYY-MM-DD-NNN` | `update-2025-07-20-001` |
| Program | `short-name` | `yoga`, `cricket` |
| Event | `event-name` | `durga-puja`, `new-year` |

---

## ✅ Pre-Publish Checklist

Before pushing changes:

- [ ] JSON validated (no syntax errors)
- [ ] All images uploaded
- [ ] Image paths correct in JSON
- [ ] Bengali text displays properly
- [ ] English text provided
- [ ] Tested locally if possible
- [ ] Backup created

---

## 📱 Test On Mobile

After publishing:
1. Open website on your phone
2. Check all pages load
3. Check images display
4. Test mobile menu
5. Try "Add to Home Screen"

---

**Save this guide for future reference! 📖**

**Questions? Check error messages first, then review the relevant section above.**