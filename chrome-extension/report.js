// Report page script

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get report data from storage
    const result = await chrome.storage.local.get(['currentReport']);
    const reportData = result.currentReport;
    
    if (!reportData || !reportData.analysis) {
      document.body.innerHTML = '<div style="padding: 40px; text-align: center;"><h1>No report data found</h1><p>Please analyze a resume first.</p></div>';
      return;
    }
    
    const { analysis, jobDescription, timestamp } = reportData;
    
    // Display data
    document.getElementById('score').textContent = `${analysis.matchScore || 0}%`;
    document.getElementById('candidateName').textContent = analysis.candidateName || 'Unknown Candidate';
    document.getElementById('jobDescription').textContent = jobDescription || 'No job description provided';
    
    // Strengths
    const strengthsList = document.getElementById('strengths');
    if (analysis.strengths && analysis.strengths.length > 0) {
      analysis.strengths.forEach(strength => {
        const li = document.createElement('li');
        li.textContent = strength;
        strengthsList.appendChild(li);
      });
    } else {
      strengthsList.innerHTML = '<li>No strengths identified</li>';
    }
    
    // Weaknesses
    const weaknessesList = document.getElementById('weaknesses');
    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
      analysis.weaknesses.forEach(weakness => {
        const li = document.createElement('li');
        li.textContent = weakness;
        weaknessesList.appendChild(li);
      });
    } else {
      weaknessesList.innerHTML = '<li>No weaknesses identified</li>';
    }
    
    // Skills
    const skillsContainer = document.getElementById('skills');
    if (analysis.skillMatches && analysis.skillMatches.length > 0) {
      analysis.skillMatches.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.textContent = skill;
        skillsContainer.appendChild(tag);
      });
    } else {
      skillsContainer.innerHTML = '<span>No matched skills</span>';
    }
    
    // Timestamp
    if (timestamp) {
      const date = new Date(timestamp);
      document.getElementById('timestamp').textContent = `Generated on ${date.toLocaleString()}`;
    }
    
    // Update score color
    const score = analysis.matchScore || 0;
    const scoreEl = document.getElementById('score');
    if (score >= 80) {
      scoreEl.style.color = '#10b981';
    } else if (score >= 60) {
      scoreEl.style.color = '#f59e0b';
    } else {
      scoreEl.style.color = '#ef4444';
    }
    
  } catch (error) {
    console.error('Report error:', error);
    document.body.innerHTML = `<div style="padding: 40px; text-align: center;"><h1>Error</h1><p>${error.message}</p></div>`;
  }
});







