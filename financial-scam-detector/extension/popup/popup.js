/**
 * Popup UI Script
 * Displays current page status and protection statistics
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) return;
  
  // Display current domain
  const url = new URL(tab.url);
  document.getElementById('current-domain').textContent = url.hostname;
  
  // Get stored data
  chrome.storage.local.get(['alertHistory', 'settings'], (result) => {
    const history = result.alertHistory || [];
    const settings = result.settings || {};
    
    // Update stats
    const blockedCount = history.filter(a => a.riskLevel === 'high').length;
    const scannedCount = history.length;
    
    document.getElementById('blocked-count').textContent = blockedCount;
    document.getElementById('scanned-count').textContent = scannedCount;
    
    // Display recent alerts
    displayRecentAlerts(history.slice(0, 5));
    
    // Update settings toggles
    document.getElementById('toggle-protection').checked = settings.enableRealTimeProtection !== false;
    document.getElementById('toggle-explanations').checked = settings.showExplanations !== false;
  });
  
  // Analyze current page
  analyzeCurrentPage(tab);
  
  // Settings event listeners
  document.getElementById('toggle-protection').addEventListener('change', (e) => {
    updateSetting('enableRealTimeProtection', e.target.checked);
  });
  
  document.getElementById('toggle-explanations').addEventListener('change', (e) => {
    updateSetting('showExplanations', e.target.checked);
  });
});

/**
 * Analyze current page and display results
 */
async function analyzeCurrentPage(tab) {
  try {
    // Send message to content script to get analysis results
    chrome.tabs.sendMessage(tab.id, { action: 'getAnalysisResults' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Could not get analysis results:', chrome.runtime.lastError);
        showAnalysisError();
        return;
      }
      
      if (response && response.analysis) {
        displayAnalysisResults(response.analysis);
      } else {
        showAnalysisError();
      }
    });
  } catch (error) {
    console.error('Analysis failed:', error);
    showAnalysisError();
  }
}

/**
 * Display analysis results
 */
function displayAnalysisResults(analysis) {
  const statusIndicator = document.getElementById('status-indicator');
  const statusDetails = document.getElementById('status-details');
  const riskBadge = document.getElementById('risk-badge');
  const riskScore = document.getElementById('risk-score');
  
  // Hide loading, show details
  statusIndicator.style.display = 'none';
  statusDetails.style.display = 'block';
  
  // Update risk level
  const riskLevel = analysis.riskLevel || 'low';
  riskBadge.textContent = `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk`;
  riskBadge.className = `risk-badge ${riskLevel}`;
  
  // Update risk score
  const score = analysis.riskScore?.risk_score || 0;
  riskScore.textContent = `Risk Score: ${(score * 100).toFixed(0)}%`;
  
  // Update badge color
  chrome.action.setBadgeText({ text: riskLevel === 'high' ? '!' : '' });
  chrome.action.setBadgeBackgroundColor({ 
    color: riskLevel === 'high' ? '#dc3545' : riskLevel === 'medium' ? '#ffc107' : '#28a745' 
  });
}

/**
 * Show analysis error
 */
function showAnalysisError() {
  const statusIndicator = document.getElementById('status-indicator');
  const statusDetails = document.getElementById('status-details');
  
  statusIndicator.innerHTML = '<span>⚠️ Could not analyze this page</span>';
  statusDetails.style.display = 'none';
}

/**
 * Display recent alerts
 */
function displayRecentAlerts(alerts) {
  const alertsList = document.getElementById('alerts-list');
  
  if (alerts.length === 0) {
    alertsList.innerHTML = '<p class="no-alerts">No alerts yet. You\'re protected! ✓</p>';
    return;
  }
  
  alertsList.innerHTML = '';
  
  alerts.forEach(alert => {
    const alertItem = document.createElement('div');
    alertItem.className = `alert-item ${alert.riskLevel}`;
    
    const time = new Date(alert.timestamp).toLocaleTimeString();
    const domain = new URL(alert.url).hostname;
    
    alertItem.innerHTML = `
      <div class="alert-time">${time}</div>
      <div class="alert-message">${alert.riskLevel.toUpperCase()} risk on ${domain}</div>
    `;
    
    alertsList.appendChild(alertItem);
  });
}

/**
 * Update setting
 */
function updateSetting(key, value) {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || {};
    settings[key] = value;
    chrome.storage.local.set({ settings });
  });
}
