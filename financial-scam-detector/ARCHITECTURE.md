# System Architecture

## Overview

The Financial Scam Detector is a browser-based security system with two main components:

1. **Browser Extension** (Client-side)
2. **ML API Server** (Backend)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Content Script (content.js)              │  │
│  │  - Runs on every webpage                              │  │
│  │  - Coordinates all detection modules                  │  │
│  │  - Shows alerts to user                               │  │
│  └───────────────────────────────────────────────────────┘  │
│           │        │        │        │        │              │
│           ▼        ▼        ▼        ▼        ▼              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │Website │ │  URL   │ │Financial│ │  OTP   │ │  UPI   │   │
│  │Security│ │Phishing│ │ Intent │ │ Misuse │ │  Scam  │   │
│  │Detector│ │Detector│ │Detector│ │Detector│ │Detector│   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│           │        │        │        │        │              │
│           └────────┴────────┴────────┴────────┘              │
│                          │                                    │
│                          ▼                                    │
│                ┌──────────────────┐                          │
│                │ Risk Scoring     │                          │
│                │ Engine           │                          │
│                └──────────────────┘                          │
│                          │                                    │
│  ┌───────────────────────┴───────────────────────┐          │
│  │         Background Script (background.js)      │          │
│  │  - Manages extension lifecycle                 │          │
│  │  - Communicates with backend API               │          │
│  │  - Stores alert history                        │          │
│  └────────────────────────────────────────────────┘          │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │ HTTP/JSON
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend ML API Server                       │
│                    (FastAPI + Python)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   API Endpoints                       │   │
│  │  - /api/analyze/email                                │   │
│  │  - /api/analyze/url                                  │   │
│  │  - /api/analyze/webpage                              │   │
│  │  - /api/risk-score                                   │   │
│  │  - /api/domain-age/{domain}                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│           ┌──────────────┼──────────────┐                   │
│           ▼              ▼               ▼                   │
│  ┌──────────────┐ ┌───────────┐ ┌────────────────┐         │
│  │   DistilBERT │ │    BART   │ │ Random Forest  │         │
│  │  (Email NLP) │ │(Zero-shot)│ │ (URL Features) │         │
│  └──────────────┘ └───────────┘ └────────────────┘         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              External Services                        │   │
│  │  - WHOIS (domain age check)                          │   │
│  │  - DNS resolution                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Interactions

### 1. Page Load Flow

```
User visits webpage
     │
     ▼
Content script activates
     │
     ├──► Website Security Check (HTTPS, SSL, Domain Age)
     │
     ├──► URL Phishing Analysis
     │
     └──► Financial Intent Detection
           │
           ├──► If financial activity detected:
           │     │
           │     ├──► OTP Misuse Detection
           │     │
           │     └──► UPI Scam Detection
           │
           └──► Risk Scoring Engine
                 │
                 └──► If Medium/High Risk:
                       │
                       └──► Show Alert to User
```

### 2. Data Flow

```
Browser Extension ──────► Backend API
                           │
Request:                   │
{                          ▼
  "url": "...",       ML Models Process
  "text": "...",           │
  ...                      │
}                          ▼
                     Pattern Matching
                           │
                           ▼
                     Risk Calculation
                           │
Response: ◄────────────────┘
{
  "risk_score": 0.75,
  "is_phishing": true,
  "reasons": [...]
}
```

## Detection Modules

### Client-Side Detectors

1. **Website Security Detector** (`websiteSecurityDetector.js`)
   - HTTPS validation
   - SSL certificate check
   - Domain age verification
   - Lookalike domain detection
   - Brand impersonation check

2. **URL Phishing Detector** (`urlPhishingDetector.js`)
   - URL length analysis
   - IP address detection
   - Subdomain counting
   - Suspicious TLD detection
   - URL shortener identification
   - Obfuscation detection

3. **Financial Intent Detector** (`financialIntentDetector.js`)
   - Bank login detection
   - UPI payment detection
   - OTP entry detection
   - Payment confirmation detection
   - Card entry detection

4. **OTP Misuse Detector** (`otpMisuseDetector.js`)
   - Sensitive field detection (OTP, password, CVV)
   - Domain trust verification
   - Non-HTTPS warning
   - Brand impersonation check

5. **UPI Scam Detector** (`upiScamDetector.js`)
   - "Approve to receive" scam detection
   - Suspicious payment request detection
   - QR code fraud detection
   - Pay-to-verify scam detection
   - Reversed transaction type detection

6. **Risk Scoring Engine** (`riskScoringEngine.js`)
   - Weighted signal combination
   - Financial intent multiplier
   - Risk level determination
   - Explanation generation

### Backend ML Detectors

1. **Email Phishing Detector** (`email_phishing_detector.py`)
   - Pre-trained DistilBERT model
   - Urgency pattern matching
   - Fear/threat detection
   - Reward/prize detection
   - Sender-domain mismatch

2. **URL Phishing Detector** (`url_phishing_detector.py`)
   - Feature extraction (30+ features)
   - Entropy calculation
   - Optional Random Forest classifier
   - Suspicious TLD database

3. **Webpage Classifier** (`webpage_classifier.py`)
   - Zero-shot BART model
   - Financial keyword detection
   - Phishing indicator matching
   - Category classification

4. **Risk Scorer** (`risk_scorer.py`)
   - Multi-signal aggregation
   - Weighted scoring
   - Financial intent amplification
   - Confidence calculation

5. **Domain Checker** (`domain_checker.py`)
   - WHOIS lookup
   - Domain age calculation
   - DNS resolution
   - Registrar information

## ML Models Used

| Model | Purpose | Size | Speed |
|-------|---------|------|-------|
| DistilBERT | Email/text phishing detection | ~260MB | Fast (~100ms) |
| BART-large-MNLI | Webpage zero-shot classification | ~1.6GB | Medium (~300ms) |
| Random Forest | URL feature classification | ~1MB | Very fast (<10ms) |

## Security Considerations

1. **Client-side Processing**: Most detection happens in the browser for privacy
2. **Optional Backend**: ML models run server-side but extension works without backend
3. **No Data Storage**: User data is not stored or logged
4. **HTTPS Only**: API communication is encrypted
5. **Minimal Permissions**: Extension requests only necessary permissions

## Performance Optimization

1. **Lazy Loading**: ML models loaded only when needed
2. **Caching**: Results cached for repeated checks
3. **Debouncing**: Page changes trigger delayed re-analysis
4. **Fallback Logic**: Rule-based detection when ML unavailable
5. **Async Processing**: Non-blocking operations throughout

## Scalability

- **Horizontal Scaling**: Backend API can run multiple instances
- **Load Balancing**: Support for nginx/HAProxy
- **Caching Layer**: Redis can be added for frequently checked domains
- **CDN**: Static ML models can be served via CDN
- **Database**: Optional PostgreSQL for analytics (not implemented)

## Future Enhancements

1. **On-device ML**: TensorFlow.js models in browser
2. **Federated Learning**: Improve models without collecting data
3. **Real-time Updates**: Blocklist synchronization
4. **Community Reports**: Crowdsourced threat intelligence
5. **Multi-language Support**: Detect scams in regional languages
