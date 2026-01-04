# Testing Guide

## Manual Testing Checklist

### 1. Installation Testing

- [ ] Backend starts without errors
- [ ] Extension loads in browser
- [ ] Extension icon appears in toolbar
- [ ] No console errors on load

### 2. Website Security Detection

#### Test HTTPS Detection
- [ ] Visit HTTP site - should show warning
- [ ] Visit HTTPS site - should pass check

#### Test Domain Age
- [ ] Visit newly registered domain - should flag as new
- [ ] Visit established domain - should pass

#### Test Lookalike Domains
- [ ] Visit typosquatted domain (e.g., `hdfc-bank.com`) - should detect
- [ ] Visit legitimate bank site - should pass

### 3. URL Phishing Detection

Test URLs:
```
✗ http://192.168.1.1/login
✗ https://very-long-url-with-many-characters-designed-to-look-suspicious.com
✗ https://secure@phishing.com
✗ https://bit.ly/something (URL shortener)
✓ https://google.com
✓ https://onlinesbi.sbi.co.in
```

- [ ] IP address in URL detected
- [ ] Long URLs flagged
- [ ] @ symbol detected
- [ ] URL shorteners identified
- [ ] Legitimate URLs pass

### 4. Financial Intent Detection

#### Bank Login Pages
Visit test pages with:
- [ ] "Login" + "Internet Banking" text
- [ ] Username and password fields
- [ ] "Forgot password" link

Should detect as financial activity.

#### UPI Payment Pages
Create test page with:
- [ ] "UPI" or "UPI ID" text
- [ ] Input field with placeholder like "yourname@upi"
- [ ] Amount input field
- [ ] Payment button

Should detect UPI intent.

#### OTP Entry
Create test page with:
- [ ] "Enter OTP" text
- [ ] 6-digit numeric input field
- [ ] "Resend OTP" link

Should detect OTP entry.

### 5. OTP Misuse Detection

Create test scenarios:

#### Scenario 1: OTP on Untrusted HTTP Site
```html
<form>
  <input type="text" placeholder="Enter OTP" maxlength="6">
  <button>Submit</button>
</form>
```
- [ ] Should show HIGH RISK alert
- [ ] Should warn "Banks NEVER ask for OTP on non-HTTPS sites"

#### Scenario 2: OTP on Untrusted HTTPS Domain
```html
<!-- On domain like secure-banking-verify.com -->
<input name="otp" placeholder="Enter 6-digit OTP">
```
- [ ] Should show MEDIUM/HIGH RISK
- [ ] Should detect OTP field on untrusted domain

#### Scenario 3: OTP on Legitimate Bank Domain
```html
<!-- On actual bank domain like onlinesbi.sbi.co.in -->
<input name="otp">
```
- [ ] Should NOT flag (trusted domain)

### 6. UPI Scam Detection

#### Scenario 1: "Approve to Receive" Scam
Create test page:
```html
<h2>You have received ₹5000</h2>
<p>Click approve to receive the money in your account</p>
<button>Approve Payment</button>
```
- [ ] Should detect scam
- [ ] Should explain "You don't approve to receive money"

#### Scenario 2: Pay ₹1 to Verify
```html
<p>Pay ₹1 to verify your UPI ID and receive ₹500 cashback</p>
```
- [ ] Should detect pay-to-verify scam
- [ ] Should warn it's not legitimate

#### Scenario 3: QR Code Scam
```html
<img src="qr.png" alt="Scan QR to receive money">
<p>Scan this QR code to receive your prize money</p>
```
- [ ] Should warn about QR scam
- [ ] Should explain QR can only send money

### 7. Risk Scoring

Test combinations:

#### Low Risk (0-0.4)
- HTTPS site
- Established domain
- No financial activity
- [ ] Should show "Low Risk" or no alert

#### Medium Risk (0.4-0.7)
- HTTPS site
- Suspicious URL patterns
- Financial activity detected
- [ ] Should show "CAUTION" warning
- [ ] Should suggest verification

#### High Risk (0.7-1.0)
- HTTP site + OTP field
- OR: Lookalike domain + login form
- OR: UPI scam detected
- [ ] Should show "HIGH RISK" alert
- [ ] Should recommend leaving site
- [ ] Should offer "Leave This Site" button

### 8. Alert UI Testing

- [ ] Alert appears on high-risk pages
- [ ] Alert is visible (not hidden behind content)
- [ ] Alert has correct styling
- [ ] Close button works
- [ ] "I Understand" button works
- [ ] "Leave This Site" button navigates back

### 9. Popup Testing

- [ ] Click extension icon - popup opens
- [ ] Current domain displayed
- [ ] Risk badge shows correct level
- [ ] Risk score displayed
- [ ] Stats update correctly
- [ ] Settings toggles work
- [ ] Alert history displays

### 10. Backend API Testing

Start backend and test endpoints:

```bash
# Health check
curl http://localhost:8000/health

# Email analysis
curl -X POST http://localhost:8000/api/analyze/email \
  -H "Content-Type: application/json" \
  -d '{"subject":"Urgent: Account Suspended","body":"Click here to verify immediately"}'

# URL analysis
curl -X POST http://localhost:8000/api/analyze/url \
  -H "Content-Type: application/json" \
  -d '{"url":"http://192.168.1.1/phishing"}'

# Domain age
curl http://localhost:8000/api/domain-age/google.com
```

Expected responses:
- [ ] Health endpoint returns status
- [ ] Email analysis detects urgency
- [ ] URL analysis detects IP address
- [ ] Domain age returns data

### 11. Performance Testing

- [ ] Page load time impact < 100ms
- [ ] Analysis completes in < 500ms
- [ ] No memory leaks (check DevTools)
- [ ] Works on 20+ tabs simultaneously

### 12. Edge Cases

- [ ] Works on localhost
- [ ] Works on file:// URLs (should skip)
- [ ] Handles malformed URLs gracefully
- [ ] Handles pages with no text content
- [ ] Handles iframes correctly
- [ ] Handles single-page applications (SPA)

## Automated Testing

### Unit Tests (Future Implementation)

```javascript
// Example test structure
describe('FinancialIntentDetector', () => {
  it('should detect bank login pages', () => {
    // Test implementation
  });
  
  it('should detect UPI payment pages', () => {
    // Test implementation
  });
});
```

### Integration Tests

Test full flow:
1. Load extension
2. Navigate to test page
3. Verify alert appears
4. Verify correct risk level
5. Verify explanations are present

## Test Sites

### Safe Test Sites
- https://google.com
- https://github.com
- https://stackoverflow.com

### Banking Test Sites (Legitimate)
- https://onlinesbi.sbi.co.in (SBI)
- https://netbanking.hdfcbank.com (HDFC)

### Create Local Test Pages

Create HTML files for testing:

**test_otp.html**
```html
<!DOCTYPE html>
<html>
<head><title>OTP Test</title></head>
<body>
  <h1>Enter OTP</h1>
  <input type="text" placeholder="Enter 6-digit OTP" maxlength="6">
  <button>Verify</button>
</body>
</html>
```

**test_upi_scam.html**
```html
<!DOCTYPE html>
<html>
<head><title>UPI Scam Test</title></head>
<body>
  <h1>Congratulations!</h1>
  <p>You have received ₹10,000</p>
  <p>Click approve to receive the money</p>
  <button>Approve Payment</button>
</body>
</html>
```

## Bug Reporting

When reporting bugs, include:
1. Browser version
2. Extension version
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Console errors (if any)
7. Screenshots

## Performance Metrics

Track these metrics:
- Time to analyze page: Target < 500ms
- Memory usage: Target < 50MB
- CPU usage: Target < 5%
- API response time: Target < 200ms

## Success Criteria

Extension is ready for release when:
- [ ] All critical tests pass
- [ ] No console errors
- [ ] Performance targets met
- [ ] User guide is clear
- [ ] Documentation is complete
