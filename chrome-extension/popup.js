// Popup script for ResumeScore Chrome Extension

const API_URL_KEY = 'resumescore_api_url';
const DEFAULT_API_URL = 'http://localhost:5000';

// DOM Elements
const analyzeBtn = document.getElementById('analyzeBtn');
const jobDescriptionTextarea = document.getElementById('jobDescription');
const analysisSection = document.getElementById('analysisSection');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const mainActions = document.getElementById('mainActions');
const settingsPanel = document.getElementById('settingsPanel');
const settingsBtn = document.getElementById('settingsBtn');
const saveSettingsBtn = document.getElementById('saveSettings');
const closeSettingsBtn = document.getElementById('closeSettings');
const apiUrlInput = document.getElementById('apiUrl');
const saveJobBtn = document.getElementById('saveJob');
const useSavedJobBtn = document.getElementById('useSavedJob');
const closeAnalysisBtn = document.getElementById('closeAnalysis');
const saveAnalysisBtn = document.getElementById('saveAnalysis');
const viewDetailsBtn = document.getElementById('viewDetails');
const retryBtn = document.getElementById('retryBtn');

let currentAnalysis = null;
let currentJobDescription = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await checkBackendStatus();
  setupEventListeners();
  await loadSavedJobDescription();
});

// Setup event listeners
function setupEventListeners() {
  analyzeBtn.addEventListener('click', handleAnalyze);
  settingsBtn.addEventListener('click', () => {
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
    mainActions.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
  });
  saveSettingsBtn.addEventListener('click', saveSettings);
  closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
    mainActions.style.display = 'block';
  });
  saveJobBtn.addEventListener('click', saveJobDescription);
  useSavedJobBtn.addEventListener('click', loadSavedJobDescription);
  closeAnalysisBtn.addEventListener('click', () => {
    analysisSection.style.display = 'none';
    mainActions.style.display = 'block';
    errorDiv.style.display = 'none';
  });
  saveAnalysisBtn.addEventListener('click', saveAnalysisToDashboard);
  viewDetailsBtn.addEventListener('click', viewFullReport);
  retryBtn.addEventListener('click', handleAnalyze);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to analyze
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!loadingDiv.style.display || loadingDiv.style.display === 'none') {
        handleAnalyze();
      }
    }
    // Escape to close panels
    if (e.key === 'Escape') {
      settingsPanel.style.display = 'none';
      if (analysisSection.style.display === 'block') {
        analysisSection.style.display = 'none';
        mainActions.style.display = 'block';
      }
    }
  });
  
  // Auto-focus job description on load
  jobDescriptionTextarea.focus();
}

// Load settings
async function loadSettings() {
  const result = await chrome.storage.sync.get([API_URL_KEY]);
  const apiUrl = result[API_URL_KEY] || DEFAULT_API_URL;
  apiUrlInput.value = apiUrl;
}

// Save settings
async function saveSettings() {
  const apiUrl = apiUrlInput.value.trim() || DEFAULT_API_URL;
  await chrome.storage.sync.set({ [API_URL_KEY]: apiUrl });
  alert('Settings saved!');
  settingsPanel.style.display = 'none';
  await checkBackendStatus();
}

// Check backend status
async function checkBackendStatus() {
  try {
    const result = await chrome.storage.sync.get([API_URL_KEY]);
    const apiUrl = result[API_URL_KEY] || DEFAULT_API_URL;
    const response = await fetch(`${apiUrl}/health`, { method: 'GET' });
    if (response.ok) {
      updateStatus('Connected', true);
    } else {
      updateStatus('Backend Error', false);
    }
  } catch (error) {
    updateStatus('Offline', false);
  }
}

// Update status indicator
function updateStatus(text, isOnline) {
  const statusText = document.getElementById('statusText');
  const statusDot = document.querySelector('.status-dot');
  statusText.textContent = text;
  statusDot.style.background = isOnline ? '#4ade80' : '#ef4444';
}

// Load saved job description
async function loadSavedJobDescription() {
  const result = await chrome.storage.sync.get(['saved_job_description']);
  if (result.saved_job_description) {
    jobDescriptionTextarea.value = result.saved_job_description;
  }
}

// Save job description
async function saveJobDescription() {
  const jobDesc = jobDescriptionTextarea.value.trim();
  if (!jobDesc) {
    alert('Please enter a job description first');
    return;
  }
  await chrome.storage.sync.set({ saved_job_description: jobDesc });
  alert('Job description saved!');
}

// Main analyze function
async function handleAnalyze() {
  const jobDescription = jobDescriptionTextarea.value.trim();
  if (!jobDescription) {
    showError('Please enter a job description first');
    jobDescriptionTextarea.focus();
    return;
  }

  if (jobDescription.length < 50) {
    showError('Job description is too short. Please provide at least 50 characters.');
    jobDescriptionTextarea.focus();
    return;
  }

  currentJobDescription = jobDescription;

  // Show loading
  loadingDiv.style.display = 'block';
  analysisSection.style.display = 'none';
  mainActions.style.display = 'none';
  errorDiv.style.display = 'none';
  analyzeBtn.disabled = true;

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      throw new Error('Could not access current tab. Please refresh and try again.');
    }
    
    // Get API URL
    const result = await chrome.storage.sync.get([API_URL_KEY]);
    const apiUrl = result[API_URL_KEY] || DEFAULT_API_URL;

    // Check backend connection
    try {
      const healthCheck = await fetch(`${apiUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      if (!healthCheck.ok) {
        throw new Error('Backend server is not responding. Please check your API URL in settings.');
      }
    } catch (healthError) {
      throw new Error(`Cannot connect to backend at ${apiUrl}. Please check:\n1. Backend is running\n2. API URL is correct in settings`);
    }

    // Extract resume data from current page
    const resumeData = await extractResumeData(tab.url);

    if (!resumeData || !resumeData.resumeText) {
      throw new Error('Could not extract resume data from this page.\n\nSupported pages:\n• LinkedIn profiles (linkedin.com/in/...)\n• Gmail with resume attachments\n\nPlease navigate to a supported page and try again.');
    }

    if (resumeData.resumeText.length < 50) {
      throw new Error('Extracted resume data is too short. Please ensure the page contains sufficient profile information.');
    }

    // Analyze resume
    const analysis = await analyzeResume(apiUrl, resumeData, jobDescription);
    
    if (!analysis || !analysis.matchScore) {
      throw new Error('Analysis failed. The backend may be experiencing issues. Please try again.');
    }
    
    // Display results
    displayAnalysis(analysis);
    currentAnalysis = analysis;

  } catch (error) {
    console.error('Analysis error:', error);
    showError(error.message || 'An unexpected error occurred. Please try again.');
  } finally {
    loadingDiv.style.display = 'none';
    analyzeBtn.disabled = false;
  }
}

// Extract resume data from page
async function extractResumeData(url) {
  try {
    if (url.includes('linkedin.com/in/')) {
      // Extract from LinkedIn profile
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractLinkedInProfile
      });
      const data = results[0].result;
      if (data && data.resumeText) {
        return data;
      }
      // Fallback: try alternative selectors
      const fallbackResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractLinkedInProfileFallback
      });
      return fallbackResults[0].result;
    } else if (url.includes('mail.google.com')) {
      // Extract from Gmail
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractGmailResume
      });
      return results[0].result;
    }
    return null;
  } catch (error) {
    console.error('Extraction error:', error);
    return null;
  }
}

// LinkedIn fallback extraction with multiple selector strategies
function extractLinkedInProfileFallback() {
  try {
    // Try multiple selectors for name
    const nameSelectors = [
      'h1.text-heading-xlarge',
      'h1.pv-text-details__left-panel',
      'h1[data-anonymize="person-name"]',
      'h1',
      '.pv-text-details__left-panel h1',
      '.ph5.pb5 h1'
    ];
    
    let name = 'Unknown Candidate';
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        name = element.textContent?.trim() || name;
        if (name !== 'Unknown Candidate') break;
      }
    }
    
    // Extract all text content as fallback
    const mainContent = document.querySelector('main') || 
                       document.querySelector('[role="main"]') ||
                       document.body;
    
    const allText = mainContent.innerText || mainContent.textContent || '';
    
    // Try to extract structured sections
    const sections = {
      experience: [],
      skills: [],
      education: []
    };
    
    // Look for experience section
    const expKeywords = ['experience', 'work', 'employment', 'career'];
    const expSection = Array.from(mainContent.querySelectorAll('section, div')).find(el => {
      const text = el.textContent?.toLowerCase() || '';
      return expKeywords.some(kw => text.includes(kw)) && 
             el.querySelector('ul, ol, .pvs-list');
    });
    
    if (expSection) {
      const items = expSection.querySelectorAll('li, .pvs-list__outer-container > *');
      items.forEach(item => {
        const text = item.textContent?.trim();
        if (text && text.length > 10) {
          sections.experience.push(text);
        }
      });
    }
    
    // Build resume text
    const resumeText = `
NAME: ${name}

PROFILE SUMMARY:
${allText.substring(0, 2000)}

EXPERIENCE:
${sections.experience.join('\n\n')}

FULL PROFILE TEXT:
${allText}
    `.trim();
    
    return {
      name,
      resumeText,
      source: 'linkedin-fallback',
      experience: sections.experience,
      skills: [],
      education: []
    };
  } catch (error) {
    console.error('LinkedIn fallback extraction error:', error);
    return null;
  }
}

// LinkedIn profile extraction (injected function) - Enhanced with multiple selectors
function extractLinkedInProfile() {
  try {
    // Try multiple selectors for name (LinkedIn changes DOM frequently)
    const nameSelectors = [
      'h1.text-heading-xlarge',
      'h1.pv-text-details__left-panel',
      'h1[data-anonymize="person-name"]',
      '.pv-text-details__left-panel h1',
      'h1.break-words',
      'h1'
    ];
    
    let name = 'Unknown Candidate';
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.trim()) {
        name = element.textContent.trim();
        break;
      }
    }
    
    // Extract experience with multiple selector strategies
    const experienceSelectors = [
      '#experience',
      '[data-section="experience"]',
      'section[aria-labelledby*="experience"]',
      '.experience-section'
    ];
    
    let experience = [];
    let experienceSection = null;
    
    for (const selector of experienceSelectors) {
      experienceSection = document.querySelector(selector);
      if (experienceSection) break;
    }
    
    if (experienceSection) {
      // Try multiple item selectors
      const itemSelectors = [
        '.pvs-list__outer-container > li',
        '.pvs-list__outer-container > div',
        'ul.pvs-list > li',
        '.experience-item'
      ];
      
      let items = [];
      for (const itemSel of itemSelectors) {
        items = experienceSection.querySelectorAll(itemSel);
        if (items.length > 0) break;
      }
      
      items.forEach(item => {
        // Try multiple title selectors
        const titleSelectors = [
          '.mr1.t-bold span[aria-hidden="true"]',
          '.t-bold span',
          '.experience-item-title',
          'h3'
        ];
        
        let title = '';
        for (const ts of titleSelectors) {
          const titleEl = item.querySelector(ts);
          if (titleEl?.textContent?.trim()) {
            title = titleEl.textContent.trim();
            break;
          }
        }
        
        // Try multiple company selectors
        const companySelectors = [
          '.t-14.t-normal span[aria-hidden="true"]',
          '.experience-item-company',
          '.pv-entity__secondary-title'
        ];
        
        let company = '';
        for (const cs of companySelectors) {
          const companyEl = item.querySelector(cs);
          if (companyEl?.textContent?.trim()) {
            company = companyEl.textContent.trim();
            break;
          }
        }
        
        // Try duration selectors
        const durationSelectors = [
          '.t-14.t-normal.t-black--light span[aria-hidden="true"]',
          '.pv-entity__bullet-item-v2',
          '.experience-item-duration'
        ];
        
        let duration = '';
        for (const ds of durationSelectors) {
          const durationEl = item.querySelector(ds);
          if (durationEl?.textContent?.trim()) {
            duration = durationEl.textContent.trim();
            break;
          }
        }
        
        if (title) {
          experience.push(`${title}${company ? ` at ${company}` : ''}${duration ? ` (${duration})` : ''}`);
        }
      });
    }

    // Extract skills with multiple selectors
    const skillsSelectors = [
      '#skills',
      '[data-section="skills"]',
      'section[aria-labelledby*="skills"]',
      '.skills-section'
    ];
    
    let skills = [];
    let skillsSection = null;
    
    for (const selector of skillsSelectors) {
      skillsSection = document.querySelector(selector);
      if (skillsSection) break;
    }
    
    if (skillsSection) {
      const skillItemSelectors = [
        '.pvs-list__outer-container .mr1.t-bold span[aria-hidden="true"]',
        '.pvs-list__outer-container span',
        '.skill-item',
        'button[data-control-name="skill_details"]'
      ];
      
      let skillItems = [];
      for (const sis of skillItemSelectors) {
        skillItems = skillsSection.querySelectorAll(sis);
        if (skillItems.length > 0) break;
      }
      
      skillItems.forEach(item => {
        const skill = item.textContent?.trim();
        if (skill && skill.length > 1 && skill.length < 50) {
          skills.push(skill);
        }
      });
    }

    // Extract education
    const educationSelectors = [
      '#education',
      '[data-section="education"]',
      'section[aria-labelledby*="education"]'
    ];
    
    let education = [];
    let educationSection = null;
    
    for (const selector of educationSelectors) {
      educationSection = document.querySelector(selector);
      if (educationSection) break;
    }
    
    if (educationSection) {
      const eduItemSelectors = [
        '.pvs-list__outer-container > li',
        '.pvs-list__outer-container > div',
        '.education-item'
      ];
      
      let eduItems = [];
      for (const eis of eduItemSelectors) {
        eduItems = educationSection.querySelectorAll(eis);
        if (eduItems.length > 0) break;
      }
      
      eduItems.forEach(item => {
        const schoolSelectors = [
          '.mr1.t-bold span[aria-hidden="true"]',
          '.education-item-school',
          'h3'
        ];
        
        let school = '';
        for (const ss of schoolSelectors) {
          const schoolEl = item.querySelector(ss);
          if (schoolEl?.textContent?.trim()) {
            school = schoolEl.textContent.trim();
            break;
          }
        }
        
        const degreeSelectors = [
          '.t-14.t-normal span[aria-hidden="true"]',
          '.education-item-degree'
        ];
        
        let degree = '';
        for (const ds of degreeSelectors) {
          const degreeEl = item.querySelector(ds);
          if (degreeEl?.textContent?.trim()) {
            degree = degreeEl.textContent.trim();
            break;
          }
        }
        
        if (school) {
          education.push(`${degree ? `${degree} from ` : ''}${school}`);
        }
      });
    }
    
    // Extract summary/about section
    const summarySelectors = [
      '#about',
      '[data-section="summary"]',
      '.pv-about-section',
      '.summary-section'
    ];
    
    let summary = '';
    for (const selector of summarySelectors) {
      const summaryEl = document.querySelector(selector);
      if (summaryEl?.textContent?.trim()) {
        summary = summaryEl.textContent.trim();
        break;
      }
    }

    // Build comprehensive resume text
    const resumeText = `
NAME: ${name}

${summary ? `SUMMARY:\n${summary}\n\n` : ''}EXPERIENCE:
${experience.length > 0 ? experience.join('\n\n') : 'Not specified'}

SKILLS:
${skills.length > 0 ? skills.join(', ') : 'Not specified'}

EDUCATION:
${education.length > 0 ? education.join('\n') : 'Not specified'}
    `.trim();

    return {
      name,
      resumeText,
      source: 'linkedin',
      experience,
      skills,
      education,
      summary
    };
  } catch (error) {
    console.error('LinkedIn extraction error:', error);
    return null;
  }
}

// Gmail resume extraction (injected function)
function extractGmailResume() {
  try {
    // Find email content
    const emailBody = document.querySelector('.a3s.aiL') || 
                     document.querySelector('[role="main"] .ii.gt') ||
                     document.querySelector('.Am.Al.editable');
    
    if (!emailBody) {
      return null;
    }
    
    // Extract text from email body
    const emailText = emailBody.innerText || emailBody.textContent || '';
    
    // Find attachments
    const attachments = document.querySelectorAll('[data-attachment-id], .aZo, .aZp');
    let resumeText = emailText;
    let hasResumeAttachment = false;
    
    attachments.forEach(attachment => {
      const fileName = attachment.textContent || attachment.getAttribute('title') || '';
      const isResume = /\.(pdf|docx?)$/i.test(fileName);
      
      if (isResume) {
        hasResumeAttachment = true;
        // Try to get attachment preview or link
        const link = attachment.closest('a') || attachment.querySelector('a');
        if (link) {
          resumeText += `\n\n[Resume Attachment: ${fileName}]`;
        }
      }
    });
    
    // Extract sender name
    const senderElement = document.querySelector('.gD') || 
                          document.querySelector('[email]') ||
                          document.querySelector('.go');
    const senderName = senderElement?.textContent?.trim() || 
                      senderElement?.getAttribute('name') || 
                      'Unknown Candidate';
    
    // Extract subject for context
    const subjectElement = document.querySelector('h2.hP') || 
                          document.querySelector('[data-thread-perm-id] h2');
    const subject = subjectElement?.textContent?.trim() || '';
    
    if (!hasResumeAttachment && emailText.length < 100) {
      return null; // Not enough content
    }
    
    // Build resume text
    const resumeData = `
NAME: ${senderName}
EMAIL SUBJECT: ${subject}

RESUME CONTENT:
${resumeText}

NOTE: This resume was extracted from Gmail. For best results, download the PDF/DOCX attachment and analyze it directly.
    `.trim();
    
    return {
      name: senderName,
      resumeText: resumeData,
      source: 'gmail',
      hasAttachment: hasResumeAttachment
    };
  } catch (error) {
    console.error('Gmail extraction error:', error);
    return null;
  }
}

// Analyze resume via API
async function analyzeResume(apiUrl, resumeData, jobDescription) {
  // Use the new text-based endpoint for Chrome extension
  const analysisResponse = await fetch(`${apiUrl}/api/resume/analyze-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resume_text: resumeData.resumeText,
      candidate_name: resumeData.name || 'Unknown Candidate',
      job_description: jobDescription
    })
  });

  if (!analysisResponse.ok) {
    const errorText = await analysisResponse.text();
    throw new Error(`Analysis failed: ${errorText}`);
  }

  const result = await analysisResponse.json();
  return result;
}

// Display analysis results
function displayAnalysis(analysis) {
  // Show analysis section
  analysisSection.style.display = 'block';
  mainActions.style.display = 'none';

  // Update score
  const score = analysis.matchScore || 0;
  document.getElementById('scoreValue').textContent = score;
  document.getElementById('scoreCircle').style.background = 
    score >= 80 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
    score >= 60 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

  // Update strengths
  const strengthsList = document.getElementById('strengthsList');
  strengthsList.innerHTML = '';
  (analysis.strengths || []).forEach(strength => {
    const li = document.createElement('li');
    li.textContent = strength;
    strengthsList.appendChild(li);
  });

  // Update weaknesses
  const weaknessesList = document.getElementById('weaknessesList');
  weaknessesList.innerHTML = '';
  (analysis.weaknesses || []).forEach(weakness => {
    const li = document.createElement('li');
    li.textContent = weakness;
    weaknessesList.appendChild(li);
  });

  // Update skills
  const skillsContainer = document.getElementById('skillsContainer');
  skillsContainer.innerHTML = '';
  (analysis.skillMatches || []).forEach(skill => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.textContent = skill;
    skillsContainer.appendChild(tag);
  });
}

// Show error
function showError(message) {
  errorDiv.style.display = 'block';
  const errorMsg = document.getElementById('errorMessage');
  errorMsg.textContent = message;
  errorMsg.style.whiteSpace = 'pre-line'; // Allow line breaks
  analysisSection.style.display = 'none';
  mainActions.style.display = 'block';
  
  // Auto-hide error after 10 seconds
  setTimeout(() => {
    if (errorDiv.style.display === 'block') {
      errorDiv.style.display = 'none';
    }
  }, 10000);
}

// Save analysis to dashboard
async function saveAnalysisToDashboard() {
  if (!currentAnalysis) {
    alert('No analysis to save. Please analyze a resume first.');
    return;
  }
  
  try {
    // Get existing analyses
    const result = await chrome.storage.local.get(['analyses']);
    const existingAnalyses = result.analyses || [];
    
    // Create analysis record
    const analysisRecord = {
      id: Date.now().toString(),
      candidateName: currentAnalysis.candidateName || 'Unknown',
      matchScore: currentAnalysis.matchScore || 0,
      strengths: currentAnalysis.strengths || [],
      weaknesses: currentAnalysis.weaknesses || [],
      skillMatches: currentAnalysis.skillMatches || [],
      jobDescription: currentJobDescription,
      timestamp: new Date().toISOString(),
      source: 'chrome-extension'
    };
    
    // Add to list
    existingAnalyses.unshift(analysisRecord); // Add to beginning
    
    // Keep only last 100 analyses
    const limitedAnalyses = existingAnalyses.slice(0, 100);
    
    // Save to storage
    await chrome.storage.local.set({ analyses: limitedAnalyses });
    
    // Show success message
    const saveBtn = document.getElementById('saveAnalysis');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✅ Saved!';
    saveBtn.disabled = true;
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 2000);
    
    // Also try to save to backend if available
    try {
      const apiResult = await chrome.storage.sync.get([API_URL_KEY]);
      const apiUrl = apiResult[API_URL_KEY] || DEFAULT_API_URL;
      
      // Create job post on backend
      const jobResponse = await fetch(`${apiUrl}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Extension Analysis - ${analysisRecord.candidateName}`,
          jobDescription: currentJobDescription
        })
      });
      
      if (jobResponse.ok) {
        const job = await jobResponse.json();
        console.log('Saved to backend:', job);
      }
    } catch (backendError) {
      console.log('Backend save failed (local save succeeded):', backendError);
    }
    
  } catch (error) {
    console.error('Save error:', error);
    alert('Failed to save analysis. Please try again.');
  }
}

// View full report
async function viewFullReport() {
  if (!currentAnalysis) {
    alert('No analysis to view. Please analyze a resume first.');
    return;
  }
  
  try {
    // Create a detailed report page
    const reportData = {
      analysis: currentAnalysis,
      jobDescription: currentJobDescription,
      timestamp: new Date().toISOString()
    };
    
    // Store report data temporarily
    await chrome.storage.local.set({ 
      currentReport: reportData 
    });
    
    // Open report page
    chrome.tabs.create({
      url: chrome.runtime.getURL('report.html')
    });
  } catch (error) {
    console.error('View report error:', error);
    // Fallback: open main website
    const result = await chrome.storage.sync.get([API_URL_KEY]);
    const apiUrl = result[API_URL_KEY] || DEFAULT_API_URL;
    const frontendUrl = apiUrl.replace(':5000', ':3000').replace('/api', '');
    
    chrome.tabs.create({
      url: frontendUrl || 'http://localhost:3000'
    });
  }
}

