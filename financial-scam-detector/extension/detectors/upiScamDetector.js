/**
 * UPI Scam Detector
 * Detects fake UPI payment requests, "approve to receive" scams, and QR fraud
 */

const UPIScamDetector = {
  
  /**
   * Main analysis function
   */
  async analyze() {
    const results = {
      isScam: false,
      confidence: 0,
      scamType: null,
      warnings: [],
      details: {}
    };
    
    // Check 1: Detect "approve to receive money" scam
    const approveScam = this.detectApproveToReceiveScam();
    if (approveScam.detected) {
      results.isScam = true;
      results.scamType = 'approve_to_receive';
      results.confidence = Math.max(results.confidence, approveScam.confidence);
      results.warnings.push(...approveScam.warnings);
      results.details.approveScam = approveScam;
    }
    
    // Check 2: Detect suspicious UPI IDs on the page
    const suspiciousUPI = this.detectSuspiciousUPIIds();
    if (suspiciousUPI.detected) {
      results.isScam = true;
      results.scamType = 'suspicious_upi_id';
      results.confidence = Math.max(results.confidence, suspiciousUPI.confidence);
      results.warnings.push(...suspiciousUPI.warnings);
      results.details.suspiciousUPI = suspiciousUPI;
    }
    
    // Check 3: Detect suspicious payment requests
    const suspiciousRequest = this.detectSuspiciousPaymentRequest();
    if (suspiciousRequest.detected) {
      results.isScam = true;
      results.scamType = 'suspicious_request';
      results.confidence = Math.max(results.confidence, suspiciousRequest.confidence);
      results.warnings.push(...suspiciousRequest.warnings);
      results.details.suspiciousRequest = suspiciousRequest;
    }
    
    // Check 4: Detect QR code redirect fraud
    const qrFraud = this.detectQRCodeFraud();
    if (qrFraud.detected) {
      results.isScam = true;
      results.scamType = 'qr_fraud';
      results.confidence = Math.max(results.confidence, qrFraud.confidence);
      results.warnings.push(...qrFraud.warnings);
      results.details.qrFraud = qrFraud;
    }
    
    // Check 4: Detect pay ₹1 to verify scam
    const payToVerify = this.detectPayToVerifyScam();
    if (payToVerify.detected) {
      results.isScam = true;
      results.scamType = 'pay_to_verify';
      results.confidence = Math.max(results.confidence, payToVerify.confidence);
      results.warnings.push(...payToVerify.warnings);
      results.details.payToVerify = payToVerify;
    }
    
    // Check 5: Detect reversed transaction type
    const reversedType = this.detectReversedTransactionType();
    if (reversedType.detected) {
      results.isScam = true;
      results.scamType = 'reversed_type';
      results.confidence = Math.max(results.confidence, reversedType.confidence);
      results.warnings.push(...reversedType.warnings);
      results.details.reversedType = reversedType;
    }
    
    // Add educational information if scam detected
    if (results.isScam) {
      results.warnings.push('');
      results.warnings.push('💡 REMEMBER:');
      results.warnings.push('  • To RECEIVE money in UPI, you only share your UPI ID');
      results.warnings.push('  • You NEVER need to approve/pay/enter OTP to receive money');
      results.warnings.push('  • Collect requests mean YOU are paying, not receiving');
      results.warnings.push('  • No legitimate service asks you to pay ₹1 to verify');
    }
    
    return results;
  },
  
  /**
   * Detect suspicious UPI IDs displayed on the page
   */
  detectSuspiciousUPIIds() {
    const result = {
      detected: false,
      confidence: 0,
      warnings: [],
      foundUPIs: []
    };
    
    const pageText = document.body.innerText;
    
    // Regex to find UPI IDs: username@provider
    const upiPattern = /([a-zA-Z0-9._-]+@(?:paytm|phonepe|googlepay|ybl|oksbi|okaxis|okicici|okhdfcbank|axl|ibl|upi)[a-zA-Z0-9._-]*)/gi;
    const matches = pageText.match(upiPattern);
    
    if (matches && matches.length > 0) {
      result.foundUPIs = [...new Set(matches)]; // Remove duplicates
      
      let suspicionScore = 0;
      
      // Check each UPI ID for suspicious patterns
      result.foundUPIs.forEach(upiId => {
        const lowerUPI = upiId.toLowerCase();
        
        // Suspicious keywords in UPI ID
        const suspiciousKeywords = [
          'scam', 'fraud', 'winner', 'prize', 'lottery', 
          'reward', 'refund', 'verify', 'official', 'support',
          'customer', 'service', 'helpline', 'claim', 'gift',
          'bonus', 'cashback', 'payment', 'receive'
        ];
        
        const hasSuspiciousKeyword = suspiciousKeywords.some(keyword => 
          lowerUPI.includes(keyword)
        );
        
        if (hasSuspiciousKeyword) {
          suspicionScore += 0.6;
          result.warnings.push(`🚨 SCAM UPI ID DETECTED: ${upiId}`);
          result.warnings.push('   This UPI ID contains suspicious keywords typically used in scams');
        }
        
        // Check for random/generic usernames (e.g., scammer12345@paytm)
        const hasRandomNumbers = /\d{4,}/.test(upiId.split('@')[0]);
        if (hasRandomNumbers) {
          suspicionScore += 0.3;
          result.warnings.push(`⚠️ Suspicious UPI ID: ${upiId}`);
          result.warnings.push('   Contains random numbers - typical of scam accounts');
        }
      });
      
      // If page asks for payment AND shows UPI ID, it's likely a scam
      const askingForPayment = /send|pay|transfer|₹|rupees|amount/i.test(pageText);
      if (askingForPayment && result.foundUPIs.length > 0) {
        suspicionScore += 0.4;
        result.warnings.push('⚠️ Page displays UPI ID and requests payment');
        result.warnings.push('   Legitimate services use secure payment gateways, not direct UPI transfers');
      }
      
      result.confidence = Math.min(suspicionScore, 1.0);
      result.detected = result.confidence > 0.5;
    }
    
    return result;
  },
  
  /**
   * Detect "Approve to receive money" scam
   * Scammers trick users into thinking they need to approve a payment to receive money
   */
  detectApproveToReceiveScam() {
    const result = {
      detected: false,
      confidence: 0,
      warnings: []
    };
    
    const pageText = document.body.innerText.toLowerCase();
    
    // Scam phrases
    const scamPhrases = [
      'approve to receive',
      'accept payment to get money',
      'confirm to receive money',
      'verify to receive payment',
      'click accept to get',
      'approve payment to receive',
      'accept request to get money'
    ];
    
    let scamScore = 0;
    
    scamPhrases.forEach(phrase => {
      if (pageText.includes(phrase)) {
        scamScore += 0.4;
        result.warnings.push(`🚨 SCAM DETECTED: "${phrase}"`);
      }
    });
    
    // Look for "collect request" combined with receiving money language
    if (pageText.includes('collect request') || pageText.includes('payment request')) {
      if (pageText.includes('receive') || pageText.includes('get money') || pageText.includes('credited')) {
        scamScore += 0.3;
        result.warnings.push('⚠️ Misleading: Collect requests mean YOU pay, not receive');
      }
    }
    
    // Look for buttons with misleading text
    const buttons = document.querySelectorAll('button, a.button, input[type="submit"]');
    buttons.forEach(btn => {
      const text = btn.textContent.toLowerCase();
      if ((text.includes('approve') || text.includes('accept')) && 
          (pageText.includes('receive') || pageText.includes('get'))) {
        scamScore += 0.3;
        result.warnings.push('⚠️ Misleading button detected');
      }
    });
    
    result.confidence = Math.min(scamScore, 1.0);
    result.detected = result.confidence > 0.5;
    
    if (result.detected) {
      result.warnings.push('');
      result.warnings.push('This is a COMMON SCAM. You DO NOT need to approve anything to receive money!');
    }
    
    return result;
  },
  
  /**
   * Detect suspicious payment requests
   */
  detectSuspiciousPaymentRequest() {
    const result = {
      detected: false,
      confidence: 0,
      warnings: []
    };
    
    const pageText = document.body.innerText.toLowerCase();
    
    let suspicionScore = 0;
    
    // Check for unexpected payment request language
    const unexpectedPhrases = [
      'payment request from unknown',
      'unrecognized transaction',
      'payment from unknown number',
      'request from new contact'
    ];
    
    unexpectedPhrases.forEach(phrase => {
      if (pageText.includes(phrase)) {
        suspicionScore += 0.3;
        result.warnings.push('⚠️ Unexpected payment request');
      }
    });
    
    // High urgency in UPI context
    const urgencyPhrases = [
      'pay immediately',
      'urgent payment',
      'pay now or',
      'limited time offer'
    ];
    
    urgencyPhrases.forEach(phrase => {
      if (pageText.includes(phrase)) {
        suspicionScore += 0.2;
        result.warnings.push('⚠️ Urgency tactics detected');
      }
    });
    
    // Prize/reward in payment context
    if ((pageText.includes('prize') || pageText.includes('reward') || pageText.includes('won')) &&
        (pageText.includes('pay') || pageText.includes('upi'))) {
      suspicionScore += 0.4;
      result.warnings.push('🚨 Prize scam: Legitimate prizes never require payment');
    }
    
    result.confidence = Math.min(suspicionScore, 1.0);
    result.detected = result.confidence > 0.4;
    
    return result;
  },
  
  /**
   * Detect QR code redirect fraud
   */
  detectQRCodeFraud() {
    const result = {
      detected: false,
      confidence: 0,
      warnings: []
    };
    
    const pageText = document.body.innerText.toLowerCase();
    
    // Look for QR codes on suspicious pages
    const images = document.querySelectorAll('img');
    let hasQR = false;
    
    images.forEach(img => {
      const alt = (img.alt || '').toLowerCase();
      const src = (img.src || '').toLowerCase();
      
      if (alt.includes('qr') || src.includes('qr') || alt.includes('scan')) {
        hasQR = true;
      }
    });
    
    if (hasQR) {
      let qrScore = 0;
      
      // QR + receive/get money language (suspicious)
      if (pageText.includes('scan to receive') || pageText.includes('scan to get')) {
        qrScore += 0.5;
        result.warnings.push('🚨 SCAM: Scanning QR codes can only SEND money, not receive');
      }
      
      // QR + verification
      if (pageText.includes('scan to verify') || pageText.includes('scan to confirm')) {
        qrScore += 0.4;
        result.warnings.push('⚠️ Suspicious: QR scan for verification is unusual');
      }
      
      // QR on untrusted domain
      const domain = window.location.hostname;
      const trustedDomains = SCAM_DETECTOR_CONSTANTS.UPI_PROVIDERS;
      const isTrusted = trustedDomains.some(trusted => domain.includes(trusted));
      
      if (!isTrusted && hasQR) {
        qrScore += 0.2;
        result.warnings.push('⚠️ QR code on untrusted website');
      }
      
      result.confidence = Math.min(qrScore, 1.0);
      result.detected = result.confidence > 0.4;
    }
    
    return result;
  },
  
  /**
   * Detect "Pay ₹1 to verify/activate" scam
   */
  detectPayToVerifyScam() {
    const result = {
      detected: false,
      confidence: 0,
      warnings: []
    };
    
    const pageText = document.body.innerText.toLowerCase();
    
    const scamPhrases = [
      'pay ₹1 to verify',
      'pay ₹1 to activate',
      'send ₹1 to confirm',
      'pay re 1 to',
      'transfer ₹1 to receive',
      '₹1 verification payment'
    ];
    
    let scamScore = 0;
    
    scamPhrases.forEach(phrase => {
      if (pageText.includes(phrase)) {
        scamScore += 0.6;
        result.warnings.push(`🚨 SCAM DETECTED: "${phrase}"`);
      }
    });
    
    // Check for small amount + verification language
    if ((pageText.includes('₹1') || pageText.includes('re. 1') || pageText.includes('rs. 1')) &&
        (pageText.includes('verify') || pageText.includes('activate') || pageText.includes('confirm'))) {
      scamScore += 0.5;
      result.warnings.push('🚨 Pay-to-verify scam detected');
    }
    
    result.confidence = Math.min(scamScore, 1.0);
    result.detected = result.confidence > 0.5;
    
    if (result.detected) {
      result.warnings.push('NO legitimate service requires ₹1 payment for verification!');
    }
    
    return result;
  },
  
  /**
   * Detect reversed transaction type (showing "credit" when it's actually "debit")
   */
  detectReversedTransactionType() {
    const result = {
      detected: false,
      confidence: 0,
      warnings: []
    };
    
    const pageText = document.body.innerText.toLowerCase();
    
    // Look for contradictory language
    if (pageText.includes('collect request') || pageText.includes('payment request')) {
      // These mean money goes OUT, not IN
      if (pageText.includes('money will be credited') || 
          pageText.includes('amount will be received') ||
          pageText.includes('balance will increase')) {
        result.confidence = 0.7;
        result.detected = true;
        result.warnings.push('🚨 CONTRADICTION: Collect requests DEBIT your account, not credit');
        result.warnings.push('This page is misleading you about the transaction direction');
      }
    }
    
    return result;
  }
};

// Export for content script
if (typeof window !== 'undefined') {
  window.UPIScamDetector = UPIScamDetector;
}
