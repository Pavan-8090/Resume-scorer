// Background service worker for ResumeScore Extension

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    // Open extension popup (this will be handled by the popup itself)
    chrome.action.openPopup();
  }

  if (request.action === 'analyzeGmailAttachment') {
    // Handle Gmail attachment analysis
    handleGmailAttachment(request.url)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === 'checkBackend') {
    // Check backend status
    checkBackendStatus()
      .then(status => sendResponse({ status }))
      .catch(error => sendResponse({ status: 'error', error: error.message }));
    return true;
  }
});

// Check backend status
async function checkBackendStatus() {
  try {
    const result = await chrome.storage.sync.get(['resumescore_api_url']);
    const apiUrl = result.resumescore_api_url || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/health`);
    return response.ok ? 'online' : 'offline';
  } catch (error) {
    return 'offline';
  }
}

// Handle Gmail attachment
async function handleGmailAttachment(url) {
  try {
    // Fetch attachment
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Convert to base64 for storage
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        resolve({
          data: reader.result,
          filename: url.split('/').pop() || 'resume.pdf'
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to fetch attachment: ${error.message}`);
  }
}

// Install/Update handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First time install
    chrome.storage.sync.set({
      resumescore_api_url: 'http://localhost:5000'
    });
    
    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup.html')
    });
  }
});

// Periodic backend health check
setInterval(async () => {
  const status = await checkBackendStatus();
  chrome.storage.local.set({ backend_status: status });
}, 60000); // Check every minute

















