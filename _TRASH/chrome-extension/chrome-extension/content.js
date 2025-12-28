// Content script - Injected into LinkedIn and Gmail pages

(function() {
  'use strict';

  // Check if we're on LinkedIn
  if (window.location.href.includes('linkedin.com/in/')) {
    initLinkedInIntegration();
  }

  // Check if we're on Gmail
  if (window.location.href.includes('mail.google.com')) {
    initGmailIntegration();
  }

  // LinkedIn Integration
  function initLinkedInIntegration() {
    // Wait for page to load
    setTimeout(() => {
      addLinkedInAnalyzeButton();
    }, 2000);

    // Re-add button on navigation (LinkedIn uses SPA)
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.resumescore-analyze-btn')) {
        addLinkedInAnalyzeButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function addLinkedInAnalyzeButton() {
    // Check if button already exists
    if (document.querySelector('.resumescore-analyze-btn')) {
      return;
    }

    // Find profile header area
    const profileHeader = document.querySelector('.ph5.pb5') || 
                          document.querySelector('.pv-top-card-v2-ctas') ||
                          document.querySelector('.pvs-header__container');

    if (!profileHeader) return;

    // Create analyze button
    const analyzeBtn = document.createElement('button');
    analyzeBtn.className = 'resumescore-analyze-btn';
    analyzeBtn.innerHTML = `
      <span style="margin-right: 6px;">🔍</span>
      Analyze with ResumeScore
    `;
    analyzeBtn.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 24px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    `;

    analyzeBtn.addEventListener('mouseenter', () => {
      analyzeBtn.style.transform = 'translateY(-2px)';
      analyzeBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    analyzeBtn.addEventListener('mouseleave', () => {
      analyzeBtn.style.transform = 'translateY(0)';
      analyzeBtn.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
    });

    analyzeBtn.addEventListener('click', () => {
      // Open extension popup
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });

    // Insert button
    if (profileHeader.querySelector('.pvs-header__actions')) {
      profileHeader.querySelector('.pvs-header__actions').appendChild(analyzeBtn);
    } else {
      profileHeader.appendChild(analyzeBtn);
    }
  }

  // Gmail Integration
  function initGmailIntegration() {
    // Wait for Gmail to load
    setTimeout(() => {
      addGmailAnalyzeButtons();
    }, 3000);

    // Re-add buttons when new emails load
    const observer = new MutationObserver(() => {
      addGmailAnalyzeButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function addGmailAnalyzeButtons() {
    // Find email threads and individual emails
    const emailThreads = document.querySelectorAll('[data-thread-id], .nH.if, .aDP');
    const emailView = document.querySelector('[role="main"]');
    
    // Add button to email view
    if (emailView && !emailView.querySelector('.resumescore-gmail-main-btn')) {
      const emailHeader = emailView.querySelector('.ha') || 
                         emailView.querySelector('.hP') ||
                         emailView.querySelector('.gD');
      
      if (emailHeader) {
        const analyzeBtn = document.createElement('button');
        analyzeBtn.className = 'resumescore-gmail-main-btn';
        analyzeBtn.innerHTML = '🔍 Analyze Resume with ResumeScore';
        analyzeBtn.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          margin: 8px 0;
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          transition: all 0.2s;
        `;

        analyzeBtn.addEventListener('mouseenter', () => {
          analyzeBtn.style.transform = 'translateY(-2px)';
          analyzeBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        });

        analyzeBtn.addEventListener('mouseleave', () => {
          analyzeBtn.style.transform = 'translateY(0)';
          analyzeBtn.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
        });

        analyzeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          chrome.runtime.sendMessage({ action: 'openPopup' });
        });

        emailHeader.parentElement.insertBefore(analyzeBtn, emailHeader.nextSibling);
      }
    }
    
    // Add buttons to attachments
    emailThreads.forEach(thread => {
      // Find attachments with multiple selectors
      const attachments = thread.querySelectorAll(
        '[data-attachment-id], .aZo, .aZp, [data-attachment], .aVW, .aZo.aZo'
      );
      
      attachments.forEach(attachment => {
        // Check if button already exists
        if (attachment.querySelector('.resumescore-gmail-btn') || 
            attachment.closest('.resumescore-gmail-btn')) {
          return;
        }

        const fileName = attachment.textContent || 
                        attachment.getAttribute('title') || 
                        attachment.getAttribute('data-attachment-name') || '';
        const isResume = /\.(pdf|docx?)$/i.test(fileName);

        if (isResume) {
          const analyzeBtn = document.createElement('button');
          analyzeBtn.className = 'resumescore-gmail-btn';
          analyzeBtn.innerHTML = '🔍 Analyze';
          analyzeBtn.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            margin-left: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          `;

          analyzeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            chrome.runtime.sendMessage({ action: 'openPopup' });
          });

          // Insert button near attachment
          const parent = attachment.parentElement || attachment.closest('.aZo, .aZp');
          if (parent) {
            parent.appendChild(analyzeBtn);
          } else {
            attachment.after(analyzeBtn);
          }
        }
      });
    });
  }

})();

