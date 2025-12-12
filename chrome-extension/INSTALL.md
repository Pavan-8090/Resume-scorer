# Chrome Extension Installation Guide

## Quick Start

### Step 1: Prepare Icons
1. Copy `frontend/public/logo.png` to `chrome-extension/icons/`
2. Resize to create:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)

Or use any image editing tool to create these icons.

### Step 2: Load Extension in Chrome

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `chrome-extension` folder from this project
6. Extension is now installed! ✅

### Step 3: Configure Backend

1. Click the extension icon in Chrome toolbar
2. Click **"⚙️ Settings"**
3. Enter your backend API URL:
   - Local: `http://localhost:5000`
   - Production: `https://your-backend.railway.app`
4. Click **"Save Settings"**

### Step 4: Test It!

1. Go to any LinkedIn profile: `https://www.linkedin.com/in/...`
2. You should see **"🔍 Analyze with ResumeScore"** button
3. Click it, enter job description, and analyze!

## Features

✅ **LinkedIn Integration**
- Visit any LinkedIn profile
- Click "Analyze with ResumeScore" button
- Get instant match score

✅ **Gmail Integration**  
- Open email with resume attachment
- Click "🔍 Analyze Resume" next to attachment
- View analysis in popup

✅ **Quick Analysis**
- One-click analysis
- Save job descriptions
- View detailed results

## Troubleshooting

**Extension not loading:**
- Make sure all files are in `chrome-extension/` folder
- Check browser console for errors
- Verify manifest.json is valid

**Button not appearing:**
- Refresh the LinkedIn/Gmail page
- Check if extension is enabled
- Verify content script is running

**Backend connection failed:**
- Check backend is running
- Verify API URL in settings
- Check CORS settings on backend

## Development

After making changes:
1. Go to `chrome://extensions/`
2. Click reload icon on extension card
3. Refresh the page you're testing on

## Next Steps

- Test on LinkedIn profiles
- Try Gmail attachments
- Save analyses to dashboard
- Customize settings

Enjoy analyzing resumes with one click! 🚀







