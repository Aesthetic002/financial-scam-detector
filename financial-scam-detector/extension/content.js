/**
 * Content Script - Main Entry Point
 * Runs on every webpage and coordinates all detection modules
 */

(function() {
  'use strict';
  
  let currentPageAnalysis = {
    url: window.location.href,
    domain: window.location.hostname,
    protocol: window.location.protocol,
    isAnalyzed: false,
    riskLevel: 'unknown',
    signals: {}
  };
  
  let analysisInProgress = false;
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  /**
   * Initialize all detection modules
   */
  async function initialize() {
    console.log('[Scam Detector] Initializing on:', window.location.href);
    
    // Avoid duplicate analysis
    if (analysisInProgress) return;
    analysisInProgress = true;
    
    try {
      // Step 1: Quick website security checks
      console.log('[Scam Detector] Step 1: Website security check...');
      const securityCheck = await WebsiteSecurityDetector.analyze();
      currentPageAnalysis.signals.websiteSecurity = securityCheck;
      console.log('[Scam Detector] Security check complete:', securityCheck);
      
      // Step 2: URL phishing detection
      console.log('[Scam Detector] Step 2: URL phishing detection...');
      const urlCheck = await URLPhishingDetector.analyze(window.location.href);
      currentPageAnalysis.signals.urlPhishing = urlCheck;
      console.log('[Scam Detector] URL check complete:', urlCheck);
      
      // Step 3: Financial intent detection (CRITICAL)
      console.log('[Scam Detector] Step 3: Financial intent detection...');
      const financialIntent = await FinancialIntentDetector.analyze();
      currentPageAnalysis.signals.financialIntent = financialIntent;
      console.log('[Scam Detector] Financial intent complete:', financialIntent);
      
      // Step 4: If financial intent detected, activate strict checks
      if (financialIntent.isFinancial) {
        console.log('[Scam Detector] Financial activity detected - activating enhanced protection');
        
        // OTP misuse detection
        console.log('[Scam Detector] Step 4: OTP misuse detection...');
        const otpCheck = await OTPMisuseDetector.analyze();
        currentPageAnalysis.signals.otpMisuse = otpCheck;
        console.log('[Scam Detector] OTP check complete:', otpCheck);
        
        // UPI scam detection
        console.log('[Scam Detector] Step 5: UPI scam detection...');
        const upiCheck = await UPIScamDetector.analyze();
        currentPageAnalysis.signals.upiScam = upiCheck;
        console.log('[Scam Detector] UPI check complete:', upiCheck);
      }
      
      // Step 6: Calculate overall risk score
      console.log('[Scam Detector] Step 6: Calculating risk score...');
      const riskScore = await RiskScoringEngine.calculate(currentPageAnalysis.signals);
      currentPageAnalysis.riskScore = riskScore;
      currentPageAnalysis.riskLevel = riskScore.risk_level;
      currentPageAnalysis.isAnalyzed = true;
      console.log('[Scam Detector] Analysis complete! Risk level:', riskScore.risk_level, 'Score:', riskScore.risk_score);
      
      // Step 6: Show alert if risk is medium or high
      if (riskScore.risk_level === 'medium' || riskScore.risk_level === 'high') {
        showRiskAlert(riskScore);
      }
      
      // Step 7: Monitor form submissions
      monitorFormSubmissions();
      
      // Step 8: Monitor dynamic content changes
      observePageChanges();
      
    } catch (error) {
      console.error('[Scam Detector] Analysis error:', error);
      console.error('[Scam Detector] Error stack:', error.stack);
    } finally {
      analysisInProgress = false;
    }
  }
  
  /**
   * Show risk alert to user
   */
  function showRiskAlert(riskScore) {
    // Remove existing alert if present
    const existingAlert = document.getElementById('scam-detector-alert');
    if (existingAlert) {
      existingAlert.remove();
    }
    
    // Create alert UI
    const alert = document.createElement('div');
    alert.id = 'scam-detector-alert';
    alert.className = `scam-alert risk-${riskScore.risk_level}`;
    
    const icon = riskScore.risk_level === 'high' ? '🚨' : '⚠️';
    const title = riskScore.risk_level === 'high' ? 'HIGH RISK' : 'CAUTION';
    
    alert.innerHTML = `
      <div class="alert-header">
        <span class="alert-icon">${icon}</span>
        <span class="alert-title">${title}</span>
        <button class="alert-close" id="alert-close-btn">×</button>
      </div>
      <div class="alert-body">
        <p class="alert-message">${riskScore.explanation}</p>
        <div class="alert-details">
          ${generateAlertDetails(riskScore)}
        </div>
      </div>
      <div class="alert-footer">
        <button class="btn-primary" id="alert-proceed-btn">I Understand</button>
        <button class="btn-secondary" id="alert-leave-btn">Leave This Site</button>
      </div>
    `;
    
    // Apply styles
    applyAlertStyles(alert);
    
    // Add to page
    document.body.appendChild(alert);
    
    // Event listeners
    document.getElementById('alert-close-btn').addEventListener('click', () => {
      alert.style.display = 'none';
    });
    
    document.getElementById('alert-proceed-btn').addEventListener('click', () => {
      alert.style.display = 'none';
    });
    
    document.getElementById('alert-leave-btn').addEventListener('click', () => {
      window.history.back();
    });
    
    // Log alert
    chrome.runtime.sendMessage({
      action: 'logAlert',
      data: {
        url: window.location.href,
        riskLevel: riskScore.risk_level,
        explanation: riskScore.explanation
      }
    });
  }
  
  /**
   * Generate detailed alert information
   */
  function generateAlertDetails(riskScore) {
    let details = '<ul>';
    
    if (riskScore.reasons && riskScore.reasons.length > 0) {
      riskScore.reasons.forEach(reason => {
        details += `<li>${reason}</li>`;
      });
    }
    
    details += '</ul>';
    return details;
  }
  
  /**
   * Apply inline styles to alert (avoids CSP issues)
   */
  function applyAlertStyles(alert) {
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;
    
    const header = alert.querySelector('.alert-header');
    header.style.cssText = `
      padding: 15px;
      background: ${alert.classList.contains('risk-high') ? '#dc3545' : '#ff9800'};
      color: white;
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    
    const body = alert.querySelector('.alert-body');
    body.style.cssText = `
      padding: 15px;
      color: #333;
    `;
    
    const footer = alert.querySelector('.alert-footer');
    footer.style.cssText = `
      padding: 15px;
      display: flex;
      gap: 10px;
      border-top: 1px solid #eee;
    `;
    
    const buttons = alert.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.style.cssText = `
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        flex: 1;
      `;
      
      if (btn.classList.contains('btn-primary')) {
        btn.style.background = '#007bff';
        btn.style.color = 'white';
      } else if (btn.classList.contains('btn-secondary')) {
        btn.style.background = '#6c757d';
        btn.style.color = 'white';
      } else if (btn.classList.contains('alert-close')) {
        btn.style.background = 'transparent';
        btn.style.color = 'white';
        btn.style.fontSize = '24px';
        btn.style.padding = '0';
        btn.style.width = '30px';
        btn.style.height = '30px';
      }
    });
  }
  
  /**
   * Monitor form submissions for risky actions
   */
  function monitorFormSubmissions() {
    document.addEventListener('submit', async (e) => {
      // If high risk and financial intent, block submission
      if (currentPageAnalysis.riskLevel === 'high' && 
          currentPageAnalysis.signals.financialIntent?.isFinancial) {
        
        // Check if user acknowledged the risk
        const alertVisible = document.getElementById('scam-detector-alert');
        if (alertVisible && alertVisible.style.display !== 'none') {
          e.preventDefault();
          
          const confirmed = confirm(
            '⚠️ SECURITY WARNING\n\n' +
            'This site has been flagged as HIGH RISK.\n' +
            'Submitting this form may compromise your financial information.\n\n' +
            'Do you really want to continue?'
          );
          
          if (!confirmed) {
            return false;
          }
        }
      }
    }, true);
  }
  
  /**
   * Observe page changes for dynamic content
   */
  function observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      // Re-check for financial intent if DOM changes significantly
      const hasSignificantChanges = mutations.some(mutation => 
        mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0
      );
      
      if (hasSignificantChanges) {
        debounce(() => {
          // Re-run financial intent detection
          FinancialIntentDetector.analyze().then(result => {
            if (result.isFinancial && !currentPageAnalysis.signals.financialIntent?.isFinancial) {
              console.log('[Scam Detector] Financial activity detected after page update');
              initialize(); // Re-run full analysis
            }
          });
        }, 2000)();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Debounce helper
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Message listener for popup requests
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAnalysisResults') {
      sendResponse({ analysis: currentPageAnalysis });
      return true; // Keep channel open for async response
    }
  });
  
  console.log('[Scam Detector] Content script loaded');
})();
