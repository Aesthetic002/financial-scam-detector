/**
 * URL Phishing Detector
 * Analyzes URL structure, detects suspicious patterns and redirects
 */

const URLPhishingDetector = {
  
  /**
   * Main analysis function
   */
  async analyze(url) {
    const results = {
      score: 0, // Phishing score (0 = safe, 1 = phishing)
      isPhishing: false,
      reasons: [],
      features: {}
    };
    
    // Extract URL features
    const features = ScamDetectorHelpers.analyzeURLFeatures(url);
    results.features = features;
    
    // Check 1: URL length (phishing URLs are often long)
    if (features.length > 75) {
      results.score += 0.2;
      results.reasons.push('Unusually long URL');
    }
    
    // Check 2: IP address in URL (red flag)
    if (features.hasIP) {
      results.score += 0.3;
      results.reasons.push('URL contains IP address instead of domain name');
    }
    
    // Check 3: Excessive subdomains
    if (features.numSubdomains > 3) {
      results.score += 0.25;
      results.reasons.push(`Too many subdomains (${features.numSubdomains})`);
    }
    
    // Check 4: Suspicious symbols
    if (features.numAt > 0) {
      results.score += 0.25;
      results.reasons.push('URL contains @ symbol (possible redirect)');
    }
    
    if (features.numHyphens > 3) {
      results.score += 0.15;
      results.reasons.push('Excessive hyphens in URL');
    }
    
    // Check 5: Suspicious TLD
    const suspiciousTLDs = this.checkSuspiciousTLD(url);
    if (suspiciousTLDs.isSuspicious) {
      results.score += 0.2;
      results.reasons.push(`Suspicious domain extension: .${suspiciousTLDs.tld}`);
    }
    
    // Check 6: URL shorteners (can hide destination)
    const shortener = this.checkURLShortener(url);
    if (shortener.isShortener) {
      results.score += 0.15;
      results.reasons.push('URL shortener detected (destination hidden)');
    }
    
    // Check 7: Check for redirect chains
    const redirectCheck = await this.checkRedirects();
    if (redirectCheck.hasRedirects) {
      results.score += 0.2;
      results.reasons.push(`Multiple redirects detected (${redirectCheck.count})`);
    }
    
    // Check 8: Hex encoding or obfuscation
    const obfuscation = this.checkObfuscation(url);
    if (obfuscation.isObfuscated) {
      results.score += 0.25;
      results.reasons.push('URL contains obfuscation patterns');
    }
    
    // Check 9: Query ML model for additional analysis
    try {
      const mlAnalysis = await this.analyzeWithML(url);
      if (mlAnalysis && mlAnalysis.phishing_score) {
        results.score = Math.max(results.score, mlAnalysis.phishing_score);
        if (mlAnalysis.reasons) {
          results.reasons.push(...mlAnalysis.reasons);
        }
      }
    } catch (error) {
      console.warn('ML URL analysis failed:', error);
    }
    
    // Cap score at 1.0
    results.score = Math.min(results.score, 1.0);
    
    // Determine if phishing
    results.isPhishing = results.score > 0.6;
    
    return results;
  },
  
  /**
   * Check for suspicious TLDs
   */
  checkSuspiciousTLD(url) {
    const suspiciousTLDs = [
      'tk', 'ml', 'ga', 'cf', 'gq', // Free TLDs often used by scammers
      'pw', 'cc', 'top', 'work', 'click',
      'loan', 'racing', 'men', 'download'
    ];
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const tld = hostname.split('.').pop().toLowerCase();
      
      if (suspiciousTLDs.includes(tld)) {
        return { isSuspicious: true, tld };
      }
    } catch (e) {
      // Invalid URL
    }
    
    return { isSuspicious: false };
  },
  
  /**
   * Check if URL is a shortener
   */
  checkURLShortener(url) {
    const shorteners = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
      'is.gd', 'buff.ly', 'adf.ly', 'shorte.st'
    ];
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      
      if (shorteners.includes(hostname)) {
        return { isShortener: true, service: hostname };
      }
    } catch (e) {
      // Invalid URL
    }
    
    return { isShortener: false };
  },
  
  /**
   * Check for redirect chains
   */
  async checkRedirects() {
    // Check if page has meta refresh redirects
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
    if (metaRefresh) {
      return { hasRedirects: true, count: 1, type: 'meta-refresh' };
    }
    
    // Check for JavaScript redirects
    const scripts = document.getElementsByTagName('script');
    let jsRedirectFound = false;
    
    for (const script of scripts) {
      const content = script.textContent || script.innerText;
      if (content.includes('window.location') || content.includes('document.location')) {
        jsRedirectFound = true;
        break;
      }
    }
    
    if (jsRedirectFound) {
      return { hasRedirects: true, count: 1, type: 'javascript' };
    }
    
    return { hasRedirects: false, count: 0 };
  },
  
  /**
   * Check for URL obfuscation
   */
  checkObfuscation(url) {
    const patterns = {
      hexEncoding: /%[0-9A-Fa-f]{2}/g,
      unicodeEscape: /\\u[0-9A-Fa-f]{4}/g,
      excessiveEncoding: /%/g
    };
    
    // Check for hex encoding
    const hexMatches = url.match(patterns.hexEncoding);
    if (hexMatches && hexMatches.length > 5) {
      return { isObfuscated: true, type: 'excessive hex encoding' };
    }
    
    // Check for Unicode escapes
    if (patterns.unicodeEscape.test(url)) {
      return { isObfuscated: true, type: 'unicode escape sequences' };
    }
    
    // Check for punycode (internationalized domain names)
    if (url.includes('xn--')) {
      return { isObfuscated: true, type: 'punycode (IDN homograph attack possible)' };
    }
    
    return { isObfuscated: false };
  },
  
  /**
   * Analyze URL with ML model via background script
   */
  async analyzeWithML(url) {
    try {
      return await ScamDetectorHelpers.sendMessageToBackground('analyzeURL', { url });
    } catch (error) {
      console.warn('ML URL analysis not available:', error);
      return null;
    }
  }
};

// Export for content script
if (typeof window !== 'undefined') {
  window.URLPhishingDetector = URLPhishingDetector;
}
