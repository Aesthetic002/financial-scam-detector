/**
 * Background Service Worker
 * Handles extension lifecycle, API communication, and message routing
 */

const API_BASE_URL = 'http://localhost:8000';

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Financial Scam Detector installed');
  
  // Initialize storage
  chrome.storage.local.set({
    alertHistory: [],
    blockedSites: [],
    settings: {
      enableRealTimeProtection: true,
      enablePhishingDetection: true,
      enableUPIScamDetection: true,
      riskThreshold: 'medium', // low, medium, high
      showExplanations: true
    }
  });
});

// Message handler from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeEmail') {
    analyzeEmailPhishing(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'analyzeURL') {
    analyzeURLPhishing(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'analyzeWebpage') {
    analyzeWebpageContent(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'getRiskScore') {
    calculateRiskScore(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'logAlert') {
    logAlert(request.data);
    sendResponse({ success: true });
  }
  
  if (request.action === 'checkDomainAge') {
    checkDomainAge(request.domain)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

/**
 * Email Phishing Analysis
 * Sends email content to ML backend for NLP analysis
 */
async function analyzeEmailPhishing(emailData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Email analysis failed:', error);
    // Fallback to local rules if API unavailable
    return fallbackEmailAnalysis(emailData);
  }
}

/**
 * URL Phishing Analysis
 * Analyzes URL structure and queries ML backend
 */
async function analyzeURLPhishing(urlData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(urlData)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('URL analysis failed:', error);
    return fallbackURLAnalysis(urlData);
  }
}

/**
 * Webpage Content Analysis
 * Sends page text to ML backend for classification
 */
async function analyzeWebpageContent(pageData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/webpage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pageData)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Webpage analysis failed:', error);
    return { phishing_score: 0, is_phishing: false };
  }
}

/**
 * Risk Score Calculation
 * Combines all signals to produce final risk score
 */
async function calculateRiskScore(signals) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/risk-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signals)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Risk scoring failed:', error);
    return fallbackRiskScoring(signals);
  }
}

/**
 * Domain Age Check
 * Queries WHOIS data to check domain registration date
 */
async function checkDomainAge(domain) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/domain-age/${domain}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Domain age check failed:', error);
    return { age_days: -1, is_new: false };
  }
}

/**
 * Fallback Email Analysis (local rules when API unavailable)
 */
function fallbackEmailAnalysis(emailData) {
  const text = (emailData.subject + ' ' + emailData.body).toLowerCase();
  let score = 0;
  const reasons = [];
  
  // Urgency patterns
  const urgencyPatterns = [
    'urgent', 'immediate action', 'act now', 'within 24 hours',
    'account will be closed', 'suspended', 'verify immediately'
  ];
  
  urgencyPatterns.forEach(pattern => {
    if (text.includes(pattern)) {
      score += 0.2;
      reasons.push(`Contains urgency phrase: "${pattern}"`);
    }
  });
  
  // Bank/UPI impersonation
  const bankKeywords = ['bank', 'upi', 'paytm', 'gpay', 'phonepe', 'bhim'];
  bankKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 0.15;
      reasons.push(`Mentions financial service: ${keyword}`);
    }
  });
  
  return {
    phishing_score: Math.min(score, 1.0),
    is_phishing: score > 0.5,
    reasons: reasons
  };
}

/**
 * Fallback URL Analysis
 */
function fallbackURLAnalysis(urlData) {
  const url = urlData.url;
  let score = 0;
  const reasons = [];
  
  // Long URLs
  if (url.length > 75) {
    score += 0.2;
    reasons.push('Unusually long URL');
  }
  
  // IP address in URL
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
    score += 0.3;
    reasons.push('Contains IP address');
  }
  
  // Suspicious symbols
  if ((url.match(/@/g) || []).length > 0) {
    score += 0.25;
    reasons.push('Contains @ symbol');
  }
  
  return {
    phishing_score: Math.min(score, 1.0),
    is_phishing: score > 0.6,
    reasons: reasons
  };
}

/**
 * Fallback Risk Scoring
 */
function fallbackRiskScoring(signals) {
  let totalScore = 0;
  let weights = {
    websiteTrust: 0.25,
    urlPhishing: 0.2,
    financialIntent: 0.3,
    otpMisuse: 0.15,
    upiScam: 0.1
  };
  
  Object.keys(weights).forEach(key => {
    if (signals[key] !== undefined) {
      totalScore += signals[key] * weights[key];
    }
  });
  
  let riskLevel = 'low';
  if (totalScore > 0.7) riskLevel = 'high';
  else if (totalScore > 0.4) riskLevel = 'medium';
  
  return {
    risk_score: totalScore,
    risk_level: riskLevel,
    explanation: `Combined risk from multiple signals`
  };
}

/**
 * Log alert to storage
 */
function logAlert(alertData) {
  chrome.storage.local.get(['alertHistory'], (result) => {
    const history = result.alertHistory || [];
    history.unshift({
      ...alertData,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 alerts
    if (history.length > 100) {
      history.pop();
    }
    
    chrome.storage.local.set({ alertHistory: history });
  });
}

console.log('Financial Scam Detector background script loaded');
