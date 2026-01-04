# API Documentation

## Backend ML API Reference

Base URL: `http://localhost:8000`

---

## Endpoints

### 1. Health Check

#### `GET /`
Basic health check endpoint.

**Response:**
```json
{
  "status": "online",
  "service": "Financial Scam Detector API",
  "version": "1.0.0",
  "timestamp": "2026-01-04T10:30:00"
}
```

---

#### `GET /health`
Detailed health status with model availability.

**Response:**
```json
{
  "status": "healthy",
  "models": {
    "email_detector": true,
    "url_detector": true,
    "webpage_classifier": true,
    "risk_scorer": true,
    "domain_checker": true
  },
  "timestamp": "2026-01-04T10:30:00"
}
```

---

### 2. Email Phishing Analysis

#### `POST /api/analyze/email`

Analyze email content for phishing patterns using NLP.

**Request Body:**
```json
{
  "subject": "Urgent: Your account has been suspended",
  "body": "Click here to verify your account immediately or it will be permanently blocked.",
  "sender": "security@bank-alert.com",
  "sender_domain": "bank-alert.com"
}
```

**Parameters:**
- `subject` (string, required): Email subject line
- `body` (string, required): Email body content
- `sender` (string, optional): Sender email address
- `sender_domain` (string, optional): Sender's domain

**Response:**
```json
{
  "phishing_score": 0.85,
  "is_phishing": true,
  "reasons": [
    "Urgency tactics detected: urgent, immediately",
    "Fear/threat language: suspended, blocked",
    "Sender domain mismatch: claims to be BANK but from bank-alert.com"
  ],
  "pattern_matches": {
    "urgency": ["urgent", "immediately"],
    "fear": ["suspended", "blocked"],
    "reward": [],
    "financial": ["account", "verify"]
  }
}
```

**Status Codes:**
- `200`: Success
- `422`: Validation error
- `500`: Server error
- `503`: Service unavailable (model not loaded)

---

### 3. URL Phishing Analysis

#### `POST /api/analyze/url`

Analyze URL structure and patterns for phishing indicators.

**Request Body:**
```json
{
  "url": "http://192.168.1.1/secure-login?redirect=https://real-bank.com"
}
```

**Parameters:**
- `url` (string, required): Full URL to analyze

**Response:**
```json
{
  "phishing_score": 0.75,
  "is_phishing": true,
  "reasons": [
    "URL contains IP address",
    "Non-HTTPS protocol",
    "Suspicious redirect parameter"
  ],
  "features": {
    "length": 67,
    "domain_length": 13,
    "num_dots": 4,
    "num_hyphens": 2,
    "has_ip": true,
    "num_subdomains": 0,
    "suspicious_tld": false,
    "domain_entropy": 3.2
  }
}
```

**Status Codes:**
- `200`: Success
- `422`: Validation error
- `500`: Server error
- `503`: Service unavailable

---

### 4. Webpage Content Classification

#### `POST /api/analyze/webpage`

Classify webpage content as phishing or legitimate using BERT.

**Request Body:**
```json
{
  "text": "Welcome to Internet Banking. Please enter your user ID and password to login...",
  "url": "https://example.com/login"
}
```

**Parameters:**
- `text` (string, required): Webpage text content (max 5000 chars recommended)
- `url` (string, required): Page URL for context

**Response:**
```json
{
  "is_financial": true,
  "is_phishing": false,
  "phishing_score": 0.25,
  "confidence": 0.82,
  "category": "financial"
}
```

**Response Fields:**
- `is_financial`: Whether page involves financial activity
- `is_phishing`: ML classification result
- `phishing_score`: Confidence that page is phishing (0-1)
- `confidence`: ML model confidence
- `category`: Page category (financial, e-commerce, informational, etc.)

**Status Codes:**
- `200`: Success
- `422`: Validation error
- `500`: Server error
- `503`: Service unavailable

---

### 5. Risk Score Calculation

#### `POST /api/risk-score`

Calculate overall risk score from multiple detection signals.

**Request Body:**
```json
{
  "websiteTrust": 0.3,
  "urlPhishing": 0.7,
  "financialIntent": 0.9,
  "otpMisuse": 0.8,
  "upiScam": 0.0
}
```

**Parameters:**
All parameters are optional floats (0-1):
- `websiteTrust`: Website security score (higher = more trustworthy)
- `urlPhishing`: URL phishing score (higher = more suspicious)
- `financialIntent`: Financial activity confidence (higher = more likely financial)
- `otpMisuse`: OTP misuse detection score
- `upiScam`: UPI scam detection score

**Response:**
```json
{
  "risk_score": 0.78,
  "risk_level": "high",
  "explanation": "⚠️ HIGH RISK - DO NOT PROCEED. This site is asking for sensitive information but is not trustworthy. We strongly recommend leaving this website.",
  "confidence": 0.8
}
```

**Response Fields:**
- `risk_score`: Overall risk (0-1)
- `risk_level`: "low", "medium", or "high"
- `explanation`: Human-readable explanation
- `confidence`: How many signals contributed (0-1)

**Risk Level Thresholds:**
- Low: 0.0 - 0.4
- Medium: 0.4 - 0.7
- High: 0.7 - 1.0

**Status Codes:**
- `200`: Success
- `422`: Validation error
- `500`: Server error
- `503`: Service unavailable

---

### 6. Domain Age Check

#### `GET /api/domain-age/{domain}`

Check domain registration age using WHOIS.

**Path Parameters:**
- `domain` (string, required): Domain name (e.g., "google.com")

**Example:**
```
GET /api/domain-age/google.com
```

**Response:**
```json
{
  "age_days": 9125,
  "is_new": false,
  "registration_date": "2001-09-15T00:00:00",
  "registrar": "MarkMonitor Inc."
}
```

**Response Fields:**
- `age_days`: Domain age in days (-1 if unavailable)
- `is_new`: Whether domain is < 90 days old
- `registration_date`: ISO 8601 date string
- `registrar`: Domain registrar name

**Status Codes:**
- `200`: Success
- `404`: Domain not found
- `500`: WHOIS lookup failed

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**Common Error Codes:**
- `400`: Bad Request - Invalid input
- `422`: Unprocessable Entity - Validation failed
- `500`: Internal Server Error
- `503`: Service Unavailable - Model not loaded

---

## Rate Limiting

Currently no rate limiting is implemented. In production, consider:
- 100 requests per minute per IP
- Implement caching for repeated queries
- Use Redis for distributed rate limiting

---

## Authentication

Currently no authentication required (localhost only).

For production deployment:
- Implement API key authentication
- Use HTTPS only
- Add CORS restrictions
- Implement request signing

---

## Examples

### Python

```python
import requests

# Email analysis
response = requests.post(
    'http://localhost:8000/api/analyze/email',
    json={
        'subject': 'Account Suspended',
        'body': 'Click here immediately',
        'sender_domain': 'suspicious-bank.com'
    }
)
result = response.json()
print(f"Phishing score: {result['phishing_score']}")
```

### JavaScript (from extension)

```javascript
// URL analysis
const response = await fetch('http://localhost:8000/api/analyze/url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: window.location.href })
});

const result = await response.json();
if (result.is_phishing) {
  console.warn('Phishing URL detected!');
}
```

### cURL

```bash
# Risk score calculation
curl -X POST http://localhost:8000/api/risk-score \
  -H "Content-Type: application/json" \
  -d '{
    "websiteTrust": 0.5,
    "urlPhishing": 0.8,
    "financialIntent": 0.9
  }'
```

---

## Model Information

### Email Phishing Detector
- **Model**: DistilBERT (distilbert-base-uncased-finetuned-sst-2-english)
- **Size**: ~260MB
- **Speed**: ~100ms per request
- **Accuracy**: ~85% on phishing emails

### Webpage Classifier
- **Model**: BART-large-MNLI (zero-shot classification)
- **Size**: ~1.6GB
- **Speed**: ~300ms per request
- **Categories**: 4 (banking, phishing, e-commerce, informational)

### URL Classifier
- **Model**: Feature-based + Random Forest (optional)
- **Features**: 30+ URL characteristics
- **Speed**: <10ms per request

---

## Performance Tips

1. **Batch Requests**: Not currently supported, but could be added
2. **Caching**: Cache WHOIS results (domains don't change often)
3. **Text Truncation**: Limit text to 1000 chars for faster ML inference
4. **Async Processing**: Use async/await in client code
5. **Local Fallbacks**: Extension has rule-based fallbacks if API unavailable

---

## Troubleshooting

### Model Loading Fails
```
WARNING: Could not load ML model: ...
```
**Solution**: Models download on first use. Ensure internet connection and sufficient disk space.

### WHOIS Lookup Fails
```
ERROR: WHOIS lookup failed for domain
```
**Solution**: Some domains block WHOIS. This is expected. The API returns default values.

### Slow Response Times
**Solution**: 
- First request is slow (model loading)
- Subsequent requests should be faster
- Consider reducing text length
- Use GPU if available (modify code to use `device=0`)

---

## Future Enhancements

Planned API improvements:
- [ ] Batch processing endpoints
- [ ] WebSocket support for real-time updates
- [ ] Model versioning
- [ ] A/B testing capabilities
- [ ] Analytics endpoints
- [ ] Admin dashboard API
- [ ] Feedback submission endpoint
