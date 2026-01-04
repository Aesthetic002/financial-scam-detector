/**
 * OTP Misuse Detector
 * Detects when OTP/password fields appear on untrusted domains
 */

const OTPMisuseDetector = {
  
  /**
   * Main analysis function
   */
  async analyze() {
    const results = {
      isMisuse: false,
      severity: 'none', // 'none', 'low', 'medium', 'high'
      score: 0,
      warnings: [],
      details: {}
    };
    
    const domain = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Check 1: Detect OTP/password fields
    const fieldsDetected = this.detectSensitiveFields();
    results.details.fieldsDetected = fieldsDetected;
    
    if (!fieldsDetected.hasOTP && !fieldsDetected.hasPassword) {
      // No sensitive fields, no misuse
      return results;
    }
    
    // Check 2: Verify if domain is trusted
    const domainTrust = this.checkDomainTrust(domain);
    results.details.domainTrust = domainTrust;
    
    // If domain is trusted, no misuse
    if (domainTrust.isTrusted) {
      return results;
    }
    
    // Check 3: Not HTTPS - immediate red flag
    if (protocol !== 'https:') {
      results.isMisuse = true;
      results.severity = 'high';
      results.score = 1.0;
      results.warnings.push('🚨 CRITICAL: Entering OTP/password on a non-HTTPS site');
      results.warnings.push('Banks NEVER ask for credentials on non-secure sites');
      return results;
    }
    
    // Check 4: Assess risk based on multiple factors
    let riskScore = 0;
    
    // OTP on untrusted domain
    if (fieldsDetected.hasOTP) {
      riskScore += 0.5;
      results.warnings.push('⚠️ OTP field detected on untrusted website');
      results.warnings.push('Banks do NOT ask for OTP on external websites');
    }
    
    // Password on untrusted domain
    if (fieldsDetected.hasPassword) {
      riskScore += 0.4;
      results.warnings.push('⚠️ Password field detected on untrusted website');
    }
    
    // CVV field (extremely sensitive)
    if (fieldsDetected.hasCVV) {
      riskScore += 0.6;
      results.warnings.push('🚨 CVV field detected - Banks NEVER ask for CVV via website links');
    }
    
    // Check 5: New or suspicious domain
    if (domainTrust.isNew) {
      riskScore += 0.2;
      results.warnings.push(`Domain is only ${domainTrust.age} days old`);
    }
    
    if (domainTrust.isSuspicious) {
      riskScore += 0.3;
      results.warnings.push('Domain structure appears suspicious');
    }
    
    // Check 6: Page claims to be from bank but isn't
    const brandCheck = this.checkBrandImpersonation();
    if (brandCheck.isImpersonation) {
      riskScore += 0.5;
      results.warnings.push(`Page impersonates ${brandCheck.claimedBrand} but domain doesn't match`);
    }
    
    results.score = Math.min(riskScore, 1.0);
    
    // Determine severity
    if (results.score >= 0.8) {
      results.severity = 'high';
      results.isMisuse = true;
    } else if (results.score >= 0.5) {
      results.severity = 'medium';
      results.isMisuse = true;
    } else if (results.score >= 0.3) {
      results.severity = 'low';
    }
    
    // Add educational warning
    if (results.isMisuse) {
      results.warnings.push('');
      results.warnings.push('💡 IMPORTANT: Legitimate banks and payment providers:');
      results.warnings.push('  • Will NEVER ask for OTP via email/website links');
      results.warnings.push('  • Will NEVER ask for CVV after login');
      results.warnings.push('  • Use their official domain names only');
    }
    
    return results;
  },
  
  /**
   * Detect sensitive input fields (OTP, password, CVV, PIN)
   */
  detectSensitiveFields() {
    const result = {
      hasOTP: false,
      hasPassword: false,
      hasCVV: false,
      hasPIN: false,
      fields: []
    };
    
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
      const name = (input.name || '').toLowerCase();
      const placeholder = (input.placeholder || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const type = input.type;
      const maxLength = input.maxLength;
      
      const fieldInfo = {
        type: type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder
      };
      
      // OTP detection
      if (name.includes('otp') || placeholder.includes('otp') || id.includes('otp') ||
          placeholder.includes('verification code') || placeholder.includes('sms code')) {
        result.hasOTP = true;
        fieldInfo.detectedAs = 'OTP';
        result.fields.push(fieldInfo);
      }
      
      // Password detection
      if (type === 'password') {
        result.hasPassword = true;
        fieldInfo.detectedAs = 'Password';
        result.fields.push(fieldInfo);
      }
      
      // CVV detection
      if (name.includes('cvv') || placeholder.includes('cvv') || id.includes('cvv') ||
          name.includes('cvc') || placeholder.includes('cvc')) {
        result.hasCVV = true;
        fieldInfo.detectedAs = 'CVV';
        result.fields.push(fieldInfo);
      }
      
      // PIN detection
      if ((name.includes('pin') || placeholder.includes('pin') || id.includes('pin')) &&
          (maxLength === 4 || maxLength === 6)) {
        result.hasPIN = true;
        fieldInfo.detectedAs = 'PIN';
        result.fields.push(fieldInfo);
      }
    });
    
    return result;
  },
  
  /**
   * Check if domain is trusted
   */
  checkDomainTrust(domain) {
    const result = {
      isTrusted: false,
      isNew: false,
      isSuspicious: false,
      age: null
    };
    
    // Check against known legitimate domains
    const legitimateDomains = [
      ...SCAM_DETECTOR_CONSTANTS.LEGITIMATE_BANKS,
      ...SCAM_DETECTOR_CONSTANTS.UPI_PROVIDERS,
      'google.com', 'microsoft.com', 'amazon.in', 'amazon.com',
      'flipkart.com', 'myntra.com'
    ];
    
    for (const trusted of legitimateDomains) {
      if (domain.endsWith(trusted) || domain === trusted) {
        result.isTrusted = true;
        return result;
      }
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP address
      /-secure-/i,
      /-login-/i,
      /-verify-/i,
      /-account-/i,
      /free\./i,
      /\.tk$|\.ml$|\.ga$/i // Free TLDs
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(domain)) {
        result.isSuspicious = true;
        break;
      }
    }
    
    return result;
  },
  
  /**
   * Check if page impersonates a known brand
   */
  checkBrandImpersonation() {
    const domain = window.location.hostname;
    const pageText = document.body.innerText.toLowerCase();
    
    const banks = [
      { name: 'SBI', domain: 'sbi.co.in', keywords: ['sbi', 'state bank'] },
      { name: 'HDFC Bank', domain: 'hdfcbank.com', keywords: ['hdfc'] },
      { name: 'ICICI Bank', domain: 'icicibank.com', keywords: ['icici'] },
      { name: 'Paytm', domain: 'paytm.com', keywords: ['paytm'] },
      { name: 'PhonePe', domain: 'phonepe.com', keywords: ['phonepe'] },
      { name: 'Google Pay', domain: 'google.com', keywords: ['google pay', 'gpay'] }
    ];
    
    for (const bank of banks) {
      // Count how many times brand is mentioned
      let mentions = 0;
      bank.keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = pageText.match(regex);
        mentions += matches ? matches.length : 0;
      });
      
      // If mentioned prominently (3+ times) but domain doesn't match
      if (mentions >= 3) {
        if (!domain.includes(bank.domain) && !bank.domain.includes(domain)) {
          return {
            isImpersonation: true,
            claimedBrand: bank.name,
            actualDomain: domain,
            expectedDomain: bank.domain
          };
        }
      }
    }
    
    return { isImpersonation: false };
  }
};

// Export for content script
if (typeof window !== 'undefined') {
  window.OTPMisuseDetector = OTPMisuseDetector;
}
