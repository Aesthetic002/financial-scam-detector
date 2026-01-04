/**
 * Website Security Detector
 * Checks HTTPS, SSL certificate, domain age, and lookalike domains
 */

const WebsiteSecurityDetector = {
  
  /**
   * Main analysis function
   */
  async analyze() {
    console.log('[Security Detector] Starting website security analysis');
    const results = {
      score: 1.0, // Start with perfect score, deduct for issues
      issues: [],
      details: {}
    };
    
    try {
      // Check 1: HTTPS
      console.log('[Security Detector] Check 1: HTTPS');
      const httpsCheck = this.checkHTTPS();
      results.details.https = httpsCheck;
      if (!httpsCheck.isSecure) {
        results.score -= 0.4;
        results.issues.push('Website does not use HTTPS encryption');
      }
      
      // Check 2: SSL Certificate (if HTTPS)
      if (httpsCheck.isSecure) {
        console.log('[Security Detector] Check 2: SSL Certificate');
        const sslCheck = await this.checkSSLCertificate();
        results.details.ssl = sslCheck;
        if (sslCheck.hasIssues) {
          results.score -= 0.3;
          results.issues.push(...sslCheck.issues);
        }
      }
      
      // Check 3: Domain age
      console.log('[Security Detector] Check 3: Domain age');
      const domainAge = await this.checkDomainAge();
      results.details.domainAge = domainAge;
      if (domainAge.isNew) {
        results.score -= 0.2;
        results.issues.push(`Domain is only ${domainAge.age_days} days old (newly registered)`);
      }
      
      // Check 4: Lookalike domain detection
      console.log('[Security Detector] Check 4: Lookalike domain');
      const lookalike = this.checkLookAlikeDomain();
      results.details.lookalike = lookalike;
      if (lookalike.isLookAlike) {
        results.score -= 0.5;
        results.issues.push(`Domain resembles legitimate site: ${lookalike.matchedDomain} (${lookalike.reason})`);
      }
      
      // Check 5: Brand name mismatch
      console.log('[Security Detector] Check 5: Brand mismatch');
      const brandMismatch = this.checkBrandMismatch();
      results.details.brandMismatch = brandMismatch;
      if (brandMismatch.hasMismatch) {
        results.score -= 0.3;
        results.issues.push(`Page claims to be "${brandMismatch.claimedBrand}" but domain is "${brandMismatch.actualDomain}"`);
      }
      
      // Ensure score doesn't go negative
      results.score = Math.max(0, results.score);
      
      console.log('[Security Detector] Analysis complete:', results);
      return results;
    } catch (error) {
      console.error('[Security Detector] Analysis failed:', error);
      // Return safe defaults on error
      return {
        score: 0.5,
        issues: ['Security analysis partially failed'],
        details: { error: error.message }
      };
    }
  },
  
  /**
   * Check if website uses HTTPS
   */
  checkHTTPS() {
    const protocol = window.location.protocol;
    return {
      isSecure: protocol === 'https:',
      protocol: protocol
    };
  },
  
  /**
   * Check SSL certificate validity
   * Note: Browser extensions have limited access to certificate details
   * This is a simplified check
   */
  async checkSSLCertificate() {
    const result = {
      hasIssues: false,
      issues: []
    };
    
    // In a real implementation, you would use the backend API
    // to fetch and validate the certificate
    // For now, we'll do basic checks
    
    const domain = window.location.hostname;
    
    // Check if domain has valid TLD
    if (!domain.includes('.')) {
      result.hasIssues = true;
      result.issues.push('Invalid domain format');
    }
    
    // Check for localhost or IP addresses (these won't have valid certs)
    if (domain === 'localhost' || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
      result.hasIssues = true;
      result.issues.push('Using IP address or localhost (no valid SSL certificate)');
    }
    
    return result;
  },
  
  /**
   * Check domain registration age
   */
  async checkDomainAge() {
    const domain = window.location.hostname;
    
    try {
      console.log('[Security Detector] Checking domain age for:', domain);
      // Request domain age from background script (which calls backend API)
      const response = await Promise.race([
        ScamDetectorHelpers.sendMessageToBackground('checkDomainAge', domain),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Domain age check timeout')), 5000))
      ]);
      
      console.log('[Security Detector] Domain age response:', response);
      return {
        age_days: response.age_days,
        isNew: response.is_new || (response.age_days > 0 && response.age_days < SCAM_DETECTOR_CONSTANTS.NEW_DOMAIN_THRESHOLD),
        registrationDate: response.registration_date
      };
    } catch (error) {
      console.warn('[Security Detector] Domain age check failed:', error);
      // Don't let this failure block the entire analysis
      return {
        age_days: -1,
        isNew: false,
        error: error.message
      };
    }
  },
  
  /**
   * Check if domain looks like a legitimate bank/UPI provider
   */
  checkLookAlikeDomain() {
    const domain = window.location.hostname;
    
    // Combine all legitimate domains
    const legitimateDomains = [
      ...SCAM_DETECTOR_CONSTANTS.LEGITIMATE_BANKS,
      ...SCAM_DETECTOR_CONSTANTS.UPI_PROVIDERS
    ];
    
    return ScamDetectorHelpers.isLookAlikeDomain(domain, legitimateDomains);
  },
  
  /**
   * Check if page claims to be a brand but domain doesn't match
   */
  checkBrandMismatch() {
    const domain = window.location.hostname;
    const pageText = document.body.innerText.toLowerCase();
    
    // Extract potential brand claims from page
    const bankBrands = [
      { name: 'State Bank of India', keywords: ['sbi', 'state bank'], domain: 'sbi.co.in' },
      { name: 'HDFC Bank', keywords: ['hdfc'], domain: 'hdfcbank.com' },
      { name: 'ICICI Bank', keywords: ['icici'], domain: 'icicibank.com' },
      { name: 'Axis Bank', keywords: ['axis bank'], domain: 'axisbank.com' },
      { name: 'Paytm', keywords: ['paytm'], domain: 'paytm.com' },
      { name: 'PhonePe', keywords: ['phonepe'], domain: 'phonepe.com' },
      { name: 'Google Pay', keywords: ['google pay', 'gpay'], domain: 'google.com' }
    ];
    
    for (const brand of bankBrands) {
      // Check if page mentions this brand prominently
      const mentionCount = brand.keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matches = pageText.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
      
      // If mentioned 3+ times, it's claiming to be this brand
      if (mentionCount >= 3) {
        // Check if domain matches
        if (!domain.includes(brand.domain) && !brand.domain.includes(domain)) {
          return {
            hasMismatch: true,
            claimedBrand: brand.name,
            actualDomain: domain,
            expectedDomain: brand.domain
          };
        }
      }
    }
    
    return { hasMismatch: false };
  }
};

// Export for content script
if (typeof window !== 'undefined') {
  window.WebsiteSecurityDetector = WebsiteSecurityDetector;
}
