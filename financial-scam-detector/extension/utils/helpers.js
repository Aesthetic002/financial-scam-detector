/**
 * Helper Utility Functions
 */

const ScamDetectorHelpers = {
  
  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  stringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  },
  
  /**
   * Levenshtein distance algorithm
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  },
  
  /**
   * Check if domain looks like another domain (lookalike detection)
   */
  isLookAlikeDomain(domain, legitimateDomains) {
    const domainLower = domain.toLowerCase();
    
    for (const legit of legitimateDomains) {
      const legitLower = legit.toLowerCase();
      
      // Exact match
      if (domainLower === legitLower) {
        return { isLookAlike: false, matchedDomain: legit };
      }
      
      // High similarity (potential typosquatting)
      const similarity = this.stringSimilarity(domainLower, legitLower);
      if (similarity > 0.8 && similarity < 1.0) {
        return { 
          isLookAlike: true, 
          matchedDomain: legit,
          similarity: similarity,
          reason: 'Typosquatting'
        };
      }
      
      // Contains legitimate domain with additions
      if (domainLower.includes(legitLower) && domainLower !== legitLower) {
        return {
          isLookAlike: true,
          matchedDomain: legit,
          reason: 'Contains legitimate domain name'
        };
      }
      
      // Common character substitutions
      const substitutions = this.checkCharacterSubstitution(domainLower, legitLower);
      if (substitutions.detected) {
        return {
          isLookAlike: true,
          matchedDomain: legit,
          reason: substitutions.reason
        };
      }
    }
    
    return { isLookAlike: false };
  },
  
  /**
   * Check for character substitution attacks
   */
  checkCharacterSubstitution(domain, legitimate) {
    const substitutions = {
      '0': 'o',
      '1': 'l',
      '3': 'e',
      '5': 's',
      '@': 'a',
      '!': 'i'
    };
    
    let transformedDomain = domain;
    let substitutionCount = 0;
    
    for (const [fake, real] of Object.entries(substitutions)) {
      if (transformedDomain.includes(fake)) {
        transformedDomain = transformedDomain.replace(new RegExp(fake, 'g'), real);
        substitutionCount++;
      }
    }
    
    if (substitutionCount > 0 && transformedDomain === legitimate) {
      return {
        detected: true,
        reason: `Character substitution detected (${substitutionCount} replacements)`
      };
    }
    
    return { detected: false };
  },
  
  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return null;
    }
  },
  
  /**
   * Count URL features for phishing detection
   */
  analyzeURLFeatures(url) {
    const features = {
      length: url.length,
      numDots: (url.match(/\./g) || []).length,
      numHyphens: (url.match(/-/g) || []).length,
      numUnderscores: (url.match(/_/g) || []).length,
      numSlashes: (url.match(/\//g) || []).length,
      numQuestionMarks: (url.match(/\?/g) || []).length,
      numEquals: (url.match(/=/g) || []).length,
      numAt: (url.match(/@/g) || []).length,
      numAmpersands: (url.match(/&/g) || []).length,
      hasIP: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url),
      numSubdomains: 0
    };
    
    // Count subdomains
    const domain = this.extractDomain(url);
    if (domain) {
      features.numSubdomains = domain.split('.').length - 2;
    }
    
    return features;
  },
  
  /**
   * Extract text content from page
   */
  extractPageText() {
    // Get visible text only
    const bodyText = document.body.innerText || document.body.textContent || '';
    
    // Limit to first 5000 characters to avoid overwhelming ML model
    return bodyText.substring(0, 5000);
  },
  
  /**
   * Detect if text contains specific patterns
   */
  containsPatterns(text, patterns) {
    const textLower = text.toLowerCase();
    const matches = [];
    
    patterns.forEach(pattern => {
      if (textLower.includes(pattern.toLowerCase())) {
        matches.push(pattern);
      }
    });
    
    return {
      found: matches.length > 0,
      matches: matches,
      count: matches.length
    };
  },
  
  /**
   * Calculate risk score from multiple signals
   */
  calculateWeightedScore(signals, weights) {
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.keys(weights).forEach(key => {
      if (signals[key] !== undefined && signals[key] !== null) {
        totalScore += signals[key] * weights[key];
        totalWeight += weights[key];
      }
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  },
  
  /**
   * Send message to background script with promise
   */
  sendMessageToBackground(action, data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action, data },
        response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'Unknown error'));
          }
        }
      );
    });
  },
  
  /**
   * Debounce function
   */
  debounce(func, wait) {
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
};

// Export for other modules
if (typeof window !== 'undefined') {
  window.ScamDetectorHelpers = ScamDetectorHelpers;
}
