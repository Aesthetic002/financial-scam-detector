# Financial Scam Detector - Testing Checklist

## Test Sites by Category

### ✅ LEGITIMATE BANKS (Should show LOW RISK)
- [ ] https://www.hdfc.bank.in/ (HDFC Bank)
- [ ] https://www.icicibank.com/ (ICICI Bank)
- [ ] https://www.sbi.co.in/ (State Bank of India)
- [ ] https://www.axisbank.com/ (Axis Bank)
- [ ] https://www.kotak.com/ (Kotak Bank)

### ✅ LEGITIMATE FINANCIAL SITES (Should show LOW RISK)
- [ ] https://www.google.com (Safe - No financial indicators)
- [ ] https://www.gmail.com (Safe - No financial indicators)
- [ ] https://www.github.com (Safe - No financial indicators)
- [ ] https://www.amazon.in/ (Legitimate e-commerce)
- [ ] https://www.flipkart.com/ (Legitimate e-commerce)

### ⚠️ SUSPICIOUS PATTERNS (Should show MEDIUM-HIGH RISK)
- [ ] Fake bank login pages (create locally)
- [ ] UPI payment request pages (create locally)
- [ ] OTP harvesting pages (create locally)

### 🔴 KNOWN PHISHING SITES (For reference - DO NOT VISIT)
- PayPal phishing URLs (use only if authenticated to phishing databases)
- Banking credential phishing (use only test pages)

---

## Testing Process

1. **Open each site in Chrome**
2. **Wait 2-3 seconds for extension to analyze**
3. **Click extension icon** to see:
   - Risk Level
   - Risk Score %
   - Protection Stats
4. **Record results** in table below

---

## Test Results

| Website | URL | Risk Level | Risk Score | Issues Found | Status |
|---------|-----|-----------|-----------|-------------|--------|
| HDFC Bank | hdfc.bank.in | Low Risk | 9% | None | ✅ PASS |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |

---

## Expected Behavior by Site Type

### Legitimate Banks
- **Risk Level:** LOW RISK or SAFE
- **Risk Score:** 5-20%
- **Reasons:** Proper HTTPS, established domain, no suspicious keywords

### Legitimate Non-Financial
- **Risk Level:** LOW RISK or SAFE
- **Risk Score:** 1-10%
- **Reasons:** No financial indicators, no suspicious patterns

### Suspicious/Phishing
- **Risk Level:** MEDIUM RISK or HIGH RISK
- **Risk Score:** 40-100%
- **Reasons:** 
  - Suspicious keywords (verify OTP, confirm account, urgent action)
  - UPI scam patterns
  - OTP field detection
  - Lookalike domains
  - New domains (< 30 days old)

---

## Console Debugging

To check what the extension detected:
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Look for `[Scam Detector]` logs showing:
   - Website security results
   - URL phishing score
   - Financial intent detected
   - OTP patterns found
   - UPI patterns found
   - Final risk calculation

---

## Report Issues

If you find:
- False positives (legitimate site marked as high risk)
- False negatives (suspicious site marked as low risk)
- Extension not loading on a page
- Errors in console

**Note the:**
- Website URL
- Expected vs actual result
- Console error messages
- Screenshot of popup

