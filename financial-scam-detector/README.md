# AI-Powered Financial Scam Detection System

A browser-based real-time financial fraud detection system that protects users from online banking scams, UPI fraud, and phishing attacks.

## 🎯 Key Features

- **Website Security Validation**: HTTPS, SSL certificate, domain age, lookalike detection
- **Email Phishing Detection**: NLP-based analysis with urgency/fear pattern recognition
- **URL & Website Analysis**: Suspicious URL structure and redirect detection
- **Financial Intent Detection**: Identifies bank login, UPI payments, OTP entry
- **OTP Misuse Prevention**: Warns against entering OTP on untrusted sites
- **UPI Scam Detection**: Identifies fake payment requests and QR fraud
- **Smart Risk Scoring**: Multi-signal analysis with explainable decisions
- **User-Friendly Alerts**: Clear, non-technical warnings

## 🏗️ Architecture

```
financial-scam-detector/
├── extension/              # Browser Extension (Chrome/Firefox)
│   ├── manifest.json       # Extension configuration
│   ├── background.js       # Background service worker
│   ├── content.js          # Page interaction script
│   ├── popup/              # Extension UI
│   ├── detectors/          # Client-side detection modules
│   └── utils/              # Helper functions
│
├── backend/                # ML API Server
│   ├── app.py              # FastAPI server
│   ├── models/             # Pre-trained ML models
│   ├── detectors/          # Server-side detectors
│   └── requirements.txt    # Python dependencies
│
└── README.md
```

## 🚀 Installation

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
```

### Browser Extension Setup

1. Open Chrome/Edge: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

## 🔧 Technology Stack

- **Frontend**: Vanilla JavaScript (browser extension)
- **Backend**: Python + FastAPI
- **ML Models**: 
  - DistilBERT (phishing text detection)
  - URL feature-based classifier
  - Risk scoring ensemble
- **APIs**: WHOIS, SSL verification, domain reputation

## 📊 Risk Scoring

The system combines multiple signals:
- Website trust score (SSL, domain age, lookalikes)
- Email/content phishing score
- Financial intent flag
- OTP misuse detection
- UPI scam patterns

**Output**: Low Risk | Medium Risk | High Risk

## 🛡️ How It Works

1. **Continuous Monitoring**: Analyzes every webpage you visit
2. **Financial Intent Detection**: Activates enhanced checks on payment/login pages
3. **Real-time Analysis**: ML models run in <500ms
4. **Explainable Alerts**: Shows why a site is risky
5. **Preventive Action**: Can block form submission on high-risk sites

## � Documentation

- **[USER_GUIDE.md](USER_GUIDE.md)** - Complete user guide with examples
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design
- **[API_DOCS.md](API_DOCS.md)** - Backend API reference
- **[TESTING.md](TESTING.md)** - Testing guide and checklist

## 🎯 Key Features Implemented

### ✅ Website Security Checks
- HTTPS and SSL certificate validation
- Domain age detection (flags domains < 90 days old)
- Lookalike domain detection using string similarity
- Brand impersonation detection

### ✅ Email Phishing Detection
- NLP-based text analysis using DistilBERT
- Urgency and fear pattern detection
- Sender-domain mismatch detection
- Phishing confidence scoring

### ✅ URL & Website Phishing
- 30+ URL feature extraction
- IP address and suspicious TLD detection
- URL shortener identification
- Webpage content classification

### ✅ Financial Intent Detection
- Bank login page detection
- UPI payment page detection
- OTP entry field detection
- Card entry detection
- Payment confirmation detection

### ✅ OTP Misuse Prevention
- Detects OTP fields on untrusted domains
- Warns against entering OTP on HTTP sites
- Validates domain trustworthiness
- Educational warnings for users

### ✅ UPI Scam Detection
- "Approve to receive money" scam detection
- Pay ₹1 to verify scam detection
- QR code fraud detection
- Reversed transaction type detection

### ✅ Risk Scoring Engine
- Multi-signal weighted scoring
- Financial intent multiplier (1.5x)
- Explainable risk levels (Low/Medium/High)
- Confidence calculation

### ✅ User Alerts
- Real-time browser alerts
- Color-coded risk levels
- Simple, non-technical explanations
- Actionable recommendations

## 🚀 Quick Start

### 1. One-Command Setup
```bash
# Run the setup script
.\setup.ps1  # PowerShell
# OR
setup.bat    # Command Prompt
```

### 2. Start Backend Server
```bash
cd backend
.\venv\Scripts\Activate.ps1  # Activate virtual environment
python app.py                # Start server at localhost:8000
```

### 3. Load Extension
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension` folder
5. You're protected! 🛡️

## 🔬 Testing

Create a test HTML file:

```html
<!-- test_phishing.html -->
<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
  <h1>Internet Banking Login</h1>
  <p>Enter your OTP to verify your account immediately!</p>
  <input type="text" placeholder="Enter 6-digit OTP" maxlength="6">
  <button>Submit</button>
</body>
</html>
```

Open this file in browser - the extension should:
- Detect financial intent (login + OTP)
- Flag OTP field on untrusted domain
- Show HIGH RISK alert
- Explain why it's dangerous

See [TESTING.md](TESTING.md) for comprehensive test cases.

## 💻 Project Structure

```
financial-scam-detector/
├── extension/                    # Browser Extension
│   ├── manifest.json             # Extension config
│   ├── background.js             # Service worker
│   ├── content.js                # Main content script
│   ├── detectors/                # Detection modules
│   │   ├── websiteSecurityDetector.js
│   │   ├── urlPhishingDetector.js
│   │   ├── financialIntentDetector.js
│   │   ├── otpMisuseDetector.js
│   │   ├── upiScamDetector.js
│   │   └── riskScoringEngine.js
│   ├── utils/                    # Helper utilities
│   │   ├── constants.js
│   │   └── helpers.js
│   └── popup/                    # Extension UI
│       ├── popup.html
│       ├── popup.css
│       └── popup.js
│
├── backend/                      # ML API Server
│   ├── app.py                    # FastAPI server
│   ├── requirements.txt          # Python dependencies
│   ├── detectors/                # ML detectors
│   │   ├── email_phishing_detector.py
│   │   ├── url_phishing_detector.py
│   │   ├── webpage_classifier.py
│   │   └── risk_scorer.py
│   └── utils/
│       └── domain_checker.py
│
├── setup.ps1                     # Windows PowerShell setup
├── setup.bat                     # Windows batch setup
├── README.md                     # This file
├── USER_GUIDE.md                 # User documentation
├── ARCHITECTURE.md               # Technical architecture
├── API_DOCS.md                   # API reference
└── TESTING.md                    # Testing guide
```

## 🤖 ML Models

| Model | Purpose | Framework |
|-------|---------|-----------|
| DistilBERT | Email/text phishing detection | Hugging Face Transformers |
| BART-MNLI | Zero-shot webpage classification | Hugging Face Transformers |
| Random Forest | URL feature classification | Scikit-learn |

Models are downloaded automatically on first use.

## 📝 License

MIT License

## ⚠️ Disclaimer

This tool provides security assistance but should not be the only line of defense. Always verify website authenticity through official channels.

**Important**: 
- No tool is 100% accurate
- Stay vigilant against social engineering
- Verify critical transactions independently
- Report suspected scams to authorities

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional scam patterns
- Regional language support
- Mobile browser support
- Performance optimizations
- UI/UX enhancements

## 📞 Support

- **National Cyber Crime Helpline**: 1930
- **Online Complaint**: cybercrime.gov.in
- **Banking Ombudsman**: 14440 / 14441

---

**Built with ❤️ to protect users from financial fraud**

Stay safe online! 🛡️
