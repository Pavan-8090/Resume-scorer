# ResumeScore Chrome Extension

One-click resume analysis from LinkedIn, Gmail, and job boards.

## Installation

### Development Mode

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. Extension is now installed!

## Features

- ✅ **LinkedIn Integration**: Analyze profiles with one click
- ✅ **Gmail Integration**: Analyze resume attachments from emails
- ✅ **Quick Analysis**: Get match scores instantly
- ✅ **Save Results**: Store analyses in dashboard
- ✅ **Custom Job Descriptions**: Save and reuse job descriptions

## Usage

### LinkedIn Profiles

1. Visit any LinkedIn profile
2. Click "Analyze with ResumeScore" button (appears on profile)
3. Enter or select job description
4. Click "Analyze Current Page"
5. View results in popup

### Gmail

1. Open email with resume attachment (PDF/DOCX)
2. Click "🔍 Analyze Resume" button next to attachment
3. Enter job description
4. View analysis results

## Configuration

1. Click extension icon
2. Click "⚙️ Settings"
3. Set your backend API URL (default: `http://localhost:5000`)
4. Save settings

## Backend Setup

Make sure your FastAPI backend is running and accessible at the configured URL.

The extension will automatically check backend status and show connection status.

## Development

### File Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── popup.css           # Popup styles
├── content.js          # Injected into web pages
├── content.css         # Content script styles
├── background.js       # Background service worker
└── icons/              # Extension icons
```

### Testing

1. Make changes to files
2. Go to `chrome://extensions/`
3. Click reload icon on extension card
4. Test on LinkedIn/Gmail

## Permissions

- `activeTab`: Access current tab content
- `storage`: Save settings and analyses
- `scripting`: Inject content scripts
- `host_permissions`: Access LinkedIn and Gmail

## Troubleshooting

**Button not appearing on LinkedIn:**
- Refresh the page
- Check browser console for errors
- Verify extension is enabled

**Backend connection failed:**
- Check backend is running
- Verify API URL in settings
- Check CORS settings on backend

**Analysis not working:**
- Ensure job description is entered
- Check backend logs for errors
- Verify resume data was extracted correctly

## Future Enhancements

- [ ] Batch analysis for multiple profiles
- [ ] Comparison mode (2-3 candidates)
- [ ] More job board integrations
- [ ] Keyboard shortcuts
- [ ] Auto-sync with dashboard













