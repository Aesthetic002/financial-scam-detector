/**
 * Constants and Configuration
 */

const SCAM_DETECTOR_CONSTANTS = {
  // Known legitimate bank domains
  LEGITIMATE_BANKS: [
    'sbi.co.in', 'hdfcbank.com', 'icicibank.com', 'axisbank.com',
    'pnbindia.in', 'bankofbaroda.in', 'kotakbank.com', 'yesbank.in',
    'indusind.com', 'idbibank.in', 'unionbankofindia.co.in'
  ],
  
  // Known UPI providers
  UPI_PROVIDERS: [
    'paytm.com', 'phonepe.com', 'google.com/pay', 'amazon.in/pay',
    'mobikwik.com', 'freecharge.in', 'bhimupi.org.in'
  ],
  
  // Phishing keywords (urgency)
  URGENCY_KEYWORDS: [
    'urgent', 'immediately', 'act now', 'limited time', 'expires today',
    'account suspended', 'verify now', 'confirm immediately', 'within 24 hours',
    'action required', 'suspended account', 'unusual activity', 'security alert'
  ],
  
  // Fear/threat keywords
  FEAR_KEYWORDS: [
    'blocked', 'frozen', 'compromised', 'unauthorized', 'suspicious activity',
    'fraud detected', 'cancel', 'lose access', 'permanent', 'legal action'
  ],
  
  // Reward/prize keywords
  REWARD_KEYWORDS: [
    'won', 'winner', 'prize', 'reward', 'cashback', 'free', 'claim now',
    'congratulations', 'selected', 'lottery', 'bonus', 'gift card'
  ],
  
  // Financial keywords
  FINANCIAL_KEYWORDS: [
    'otp', 'cvv', 'pin', 'password', 'card number', 'account number',
    'ifsc', 'upi', 'netbanking', 'debit card', 'credit card', 'bank',
    'payment', 'transfer', 'transaction', 'balance', 'withdraw'
  ],
  
  // UPI scam patterns
  UPI_SCAM_PATTERNS: [
    'approve to receive', 'accept payment', 'confirm to get money',
    'verify to receive', 'click to claim', 'pay ₹1 to receive',
    'send ₹1 to activate', 'reverse payment'
  ],
  
  // Domain age threshold (days)
  NEW_DOMAIN_THRESHOLD: 90,
  
  // Risk thresholds
  RISK_THRESHOLDS: {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.8
  },
  
  // SSL certificate minimum validity (days)
  SSL_MIN_VALIDITY: 30
};

// Export for other modules
if (typeof window !== 'undefined') {
  window.SCAM_DETECTOR_CONSTANTS = SCAM_DETECTOR_CONSTANTS;
}
