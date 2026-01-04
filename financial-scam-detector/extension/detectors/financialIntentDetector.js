/**
 * Financial Intent Detector (CRITICAL MODULE)
 * Detects when a page involves banking, UPI payments, OTP entry, or financial transactions
 */

const FinancialIntentDetector = {
  
  /**
   * Main analysis function
   */
  async analyze() {
    const results = {
      isFinancial: false,
      confidence: 0,
      intent: null, // 'bank_login', 'upi_payment', 'otp_entry', 'payment_confirmation'
      indicators: [],
      details: {}
    };
    
    // Check 1: Detect bank login pages
    const bankLogin = this.detectBankLogin();
    if (bankLogin.detected) {
      results.isFinancial = true;
      results.intent = 'bank_login';
      results.confidence = Math.max(results.confidence, bankLogin.confidence);
      results.indicators.push(...bankLogin.indicators);
      results.details.bankLogin = bankLogin;
    }
    
    // Check 2: Detect UPI payment pages
    const upiPayment = this.detectUPIPayment();
    if (upiPayment.detected) {
      results.isFinancial = true;
      results.intent = 'upi_payment';
      results.confidence = Math.max(results.confidence, upiPayment.confidence);
      results.indicators.push(...upiPayment.indicators);
      results.details.upiPayment = upiPayment;
    }
    
    // Check 3: Detect OTP entry pages
    const otpEntry = this.detectOTPEntry();
    if (otpEntry.detected) {
      results.isFinancial = true;
      if (!results.intent) results.intent = 'otp_entry';
      results.confidence = Math.max(results.confidence, otpEntry.confidence);
      results.indicators.push(...otpEntry.indicators);
      results.details.otpEntry = otpEntry;
    }
    
    // Check 4: Detect payment confirmation pages
    const paymentConfirm = this.detectPaymentConfirmation();
    if (paymentConfirm.detected) {
      results.isFinancial = true;
      results.intent = 'payment_confirmation';
      results.confidence = Math.max(results.confidence, paymentConfirm.confidence);
      results.indicators.push(...paymentConfirm.indicators);
      results.details.paymentConfirm = paymentConfirm;
    }
    
    // Check 5: Detect credit/debit card entry
    const cardEntry = this.detectCardEntry();
    if (cardEntry.detected) {
      results.isFinancial = true;
      results.intent = 'card_entry';
      results.confidence = Math.max(results.confidence, cardEntry.confidence);
      results.indicators.push(...cardEntry.indicators);
      results.details.cardEntry = cardEntry;
    }
    
    // Check 6: Use ML model for text classification
    try {
      const mlAnalysis = await this.analyzeWithML();
      if (mlAnalysis && mlAnalysis.is_financial) {
        results.isFinancial = true;
        results.confidence = Math.max(results.confidence, mlAnalysis.confidence);
      }
    } catch (error) {
      console.warn('ML financial intent analysis failed:', error);
    }
    
    return results;
  },
  
  /**
   * Detect bank login pages
   */
  detectBankLogin() {
    const result = {
      detected: false,
      confidence: 0,
      indicators: []
    };
    
    const pageText = document.body.innerText.toLowerCase();
    
    // Look for login-specific text
    const loginKeywords = ['login', 'sign in', 'log in', 'internet banking', 'net banking'];
    const bankingKeywords = ['account', 'customer id', 'user id', 'ifsc'];
    
    let loginScore = 0;
    
    loginKeywords.forEach(keyword => {
      if (pageText.includes(keyword)) {
        loginScore += 0.2;
        result.indicators.push(`Contains keyword: "${keyword}"`);
      }
    });
    
    bankingKeywords.forEach(keyword => {
      if (pageText.includes(keyword)) {
        loginScore += 0.15;
      }
    });
    
    // Look for login forms
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input[type="password"], input[type="text"], input[name*="user"], input[name*="login"]');
    
    if (forms.length > 0 && inputs.length >= 2) {
      loginScore += 0.3;
      result.indicators.push('Login form detected');
    }
    
    // Check for "forgot password" link
    const links = Array.from(document.querySelectorAll('a'));
    const hasForgotPassword = links.some(link => 
      link.textContent.toLowerCase().includes('forgot password') ||
      link.textContent.toLowerCase().includes('forgot user')
    );
    
    if (hasForgotPassword) {
      loginScore += 0.1;
      result.indicators.push('Forgot password link found');
    }
    
    result.confidence = Math.min(loginScore, 1.0);
    result.detected = result.confidence > 0.5;
    
    return result;
  },
  
  /**
   * Detect UPI payment pages
   */
  detectUPIPayment() {
    const result = {
      detected: false,
      confidence: 0,
      indicators: []
    };
    
    const pageText = document.body.innerText.toLowerCase();
    
    // UPI-specific keywords
    const upiKeywords = [
      'upi', 'unified payments interface', 'vpa', 'virtual payment address',
      'upi id', 'upi pin', '@paytm', '@okaxis', '@ybl', '@oksbi'
    ];
    
    const paymentKeywords = ['pay', 'payment', 'send money', 'transfer', 'collect request'];
    
    let upiScore = 0;
    
    upiKeywords.forEach(keyword => {
      if (pageText.includes(keyword)) {
        upiScore += 0.25;
        result.indicators.push(`UPI keyword detected: "${keyword}"`);
      }
    });
    
    paymentKeywords.forEach(keyword => {
      if (pageText.includes(keyword)) {
        upiScore += 0.1;
      }
    });
    
    // Look for UPI input fields
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      const name = (input.name || '').toLowerCase();
      const placeholder = (input.placeholder || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      
      if (name.includes('upi') || placeholder.includes('upi') || id.includes('upi')) {
        upiScore += 0.3;
        result.indicators.push('UPI input field detected');
      }
      
      if (placeholder.includes('@') || placeholder.includes('vpa')) {
        upiScore += 0.2;
      }
    });
    
    // Look for amount input
    const amountInputs = document.querySelectorAll(
      'input[name*="amount"], input[placeholder*="amount"], input[id*="amount"], input[type="number"]'
    );
    if (amountInputs.length > 0) {
      upiScore += 0.15;
      result.indicators.push('Amount input field detected');
    }
    
    // Check for QR code
    const images = document.querySelectorAll('img');
    const hasQR = Array.from(images).some(img => 
      img.alt.toLowerCase().includes('qr') || 
      img.src.toLowerCase().includes('qr')
    );
    
    if (hasQR) {
      upiScore += 0.2;
      result.indicators.push('QR code detected');
    }
    
    result.confidence = Math.min(upiScore, 1.0);
    result.detected = result.confidence > 0.5;
    
    return result;
  },
  
  /**
   * Detect OTP entry pages
   */
  detectOTPEntry() {
    const result = {
      detected: false,
      confidence: 0,
      indicators: []
    };
    
    const pageText = document.body.innerText.toLowerCase();
    
    // OTP keywords
    const otpKeywords = [
      'otp', 'one time password', 'verification code', 'sms code',
      'enter otp', 'verify otp', '6 digit code', 'authentication code'
    ];
    
    let otpScore = 0;
    
    otpKeywords.forEach(keyword => {
      if (pageText.includes(keyword)) {
        otpScore += 0.3;
        result.indicators.push(`OTP keyword detected: "${keyword}"`);
      }
    });
    
    // Look for OTP input fields (usually 4-6 digit numeric)
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      const name = (input.name || '').toLowerCase();
      const placeholder = (input.placeholder || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const maxLength = input.maxLength;
      const type = input.type;
      
      // Check for OTP-specific attributes
      if (name.includes('otp') || placeholder.includes('otp') || id.includes('otp')) {
        otpScore += 0.4;
        result.indicators.push('OTP input field detected');
      }
      
      // Check for numeric input with specific length (4-6 digits)
      if ((type === 'number' || type === 'tel') && maxLength >= 4 && maxLength <= 6) {
        otpScore += 0.3;
        result.indicators.push('Numeric code input detected');
      }
      
      // Multiple small numeric inputs in sequence (separate boxes for each digit)
      if (input.className.includes('otp') || input.className.includes('code')) {
        otpScore += 0.2;
      }
    });
    
    // Look for "resend OTP" link
    const links = Array.from(document.querySelectorAll('a, button'));
    const hasResendOTP = links.some(link => 
      link.textContent.toLowerCase().includes('resend') && 
      link.textContent.toLowerCase().includes('otp')
    );
    
    if (hasResendOTP) {
      otpScore += 0.2;
      result.indicators.push('Resend OTP option found');
    }
    
    result.confidence = Math.min(otpScore, 1.0);
    result.detected = result.confidence > 0.5;
    
    return result;
  },
  
  /**
   * Detect payment confirmation pages
   */
  detectPaymentConfirmation() {
    const result = {
      detected: false,
      confidence: 0,
      indicators: []
    };
    
    const pageText = document.body.innerText.toLowerCase();
    
    const confirmKeywords = [
      'confirm payment', 'verify payment', 'approve transaction',
      'transaction details', 'payment summary', 'review order'
    ];
    
    let confirmScore = 0;
    
    confirmKeywords.forEach(keyword => {
      if (pageText.includes(keyword)) {
        confirmScore += 0.25;
        result.indicators.push(`Confirmation keyword: "${keyword}"`);
      }
    });
    
    // Look for amount display (₹ symbol or "Amount:")
    if (pageText.includes('₹') || pageText.includes('inr') || pageText.includes('amount:')) {
      confirmScore += 0.2;
      result.indicators.push('Amount displayed');
    }
    
    // Look for confirm/proceed buttons
    const buttons = document.querySelectorAll('button, input[type="submit"]');
    const hasConfirmButton = Array.from(buttons).some(btn => {
      const text = btn.textContent.toLowerCase();
      return text.includes('confirm') || text.includes('proceed') || 
             text.includes('pay now') || text.includes('submit');
    });
    
    if (hasConfirmButton) {
      confirmScore += 0.3;
      result.indicators.push('Confirmation button found');
    }
    
    result.confidence = Math.min(confirmScore, 1.0);
    result.detected = result.confidence > 0.5;
    
    return result;
  },
  
  /**
   * Detect credit/debit card entry
   */
  detectCardEntry() {
    const result = {
      detected: false,
      confidence: 0,
      indicators: []
    };
    
    const pageText = document.body.innerText.toLowerCase();
    
    // Card-specific keywords
    const cardKeywords = ['card number', 'cvv', 'expiry', 'cardholder name', 'debit card', 'credit card'];
    
    let cardScore = 0;
    
    cardKeywords.forEach(keyword => {
      if (pageText.includes(keyword)) {
        cardScore += 0.2;
        result.indicators.push(`Card keyword: "${keyword}"`);
      }
    });
    
    // Look for card number input (16 digits)
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      const name = (input.name || '').toLowerCase();
      const placeholder = (input.placeholder || '').toLowerCase();
      const maxLength = input.maxLength;
      
      if (name.includes('card') || placeholder.includes('card number')) {
        cardScore += 0.4;
        result.indicators.push('Card number input detected');
      }
      
      if (maxLength === 16 || maxLength === 19) { // 16 digits or 16+3 spaces
        cardScore += 0.2;
      }
      
      if (name.includes('cvv') || placeholder.includes('cvv')) {
        cardScore += 0.3;
        result.indicators.push('CVV input detected');
      }
    });
    
    result.confidence = Math.min(cardScore, 1.0);
    result.detected = result.confidence > 0.5;
    
    return result;
  },
  
  /**
   * Analyze with ML model
   */
  async analyzeWithML() {
    try {
      const pageText = ScamDetectorHelpers.extractPageText();
      return await ScamDetectorHelpers.sendMessageToBackground('analyzeWebpage', {
        text: pageText,
        url: window.location.href
      });
    } catch (error) {
      console.warn('ML webpage analysis not available:', error);
      return null;
    }
  }
};

// Export for content script
if (typeof window !== 'undefined') {
  window.FinancialIntentDetector = FinancialIntentDetector;
}
