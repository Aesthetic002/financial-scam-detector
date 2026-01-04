# Testing Guide - Financial Scam Detector

## Quick Start: Test Your Extension Now

### Test Pages Created (Local Testing)

Open these files in Chrome to test various scam types:

1. **test-phishing.html** - Generic phishing page
   - Expected: **HIGH RISK** (Shows investment fraud, UPI scams, OTP fields)
   
2. **test-phishing-hdfc.html** - Fake HDFC Bank phishing
   - Expected: **HIGH RISK** (Requests passwords, PINs, OTPs)
   
3. **test-upi-scam.html** - UPI payment scam
   - Expected: **HIGH RISK** (UPI payment request, urgency tactics)
   
4. **test-lottery-scam.html** - Fake lottery/prize scam
   - Expected: **HIGH RISK** (Prize claim, upfront payment required)

---

## How to Test Local Files

1. **Open Chrome**
2. **Press Ctrl+O** (or Cmd+O on Mac)
3. **Navigate to:** `D:\DTLEL\`
4. **Select:** `test-phishing.html` (or any test file)
5. **Wait 2-3 seconds** for extension to analyze
6. **Click extension icon** to see results
7. **Check console (F12)** for detailed logs

---

## Real Website Testing

### Step 1: Test Legitimate Sites (Should be LOW RISK)

**Indian Banks:**
```
https://www.hdfc.bank.in/
https://www.icicibank.com/
https://www.sbi.co.in/
https://www.axisbank.com/
https://www.kotak.com/
```

**Safe Sites:**
```
https://www.google.com
https://www.gmail.com
https://www.github.com
```

**Steps:**
1. Open site in new tab
2. Wait 2-3 seconds
3. Click extension icon
4. **Expected:** Risk Level = LOW RISK, Score < 20%

---

### Step 2: Document Results

For each site test:
- ✅ Website loads correctly
- ✅ Extension initializes (watch for [Scam Detector] logs in F12 console)
- ✅ Popup shows risk assessment
- ✅ Risk level matches expectations

---

## Expected Results by Category

### ✅ Legitimate Banks
| Site | Expected Risk | Why |
|------|---------------|-----|
| HDFC Bank | 5-15% | Established domain, HTTPS, no financial keywords |
| ICICI Bank | 5-15% | Proper security, legitimate indicators |
| SBI | 5-15% | Government bank, secure |

### ✅ Safe Sites
| Site | Expected Risk | Why |
|------|---------------|-----|
| Google | 1-10% | No financial indicators, secure |
| Gmail | 1-10% | No payment requests, HTTPS |
| GitHub | 1-10% | Developer site, no financial content |

### 🔴 Test Scam Pages (LOCAL FILES)
| File | Expected Risk | Scam Type |
|------|---------------|-----------|
| test-phishing.html | 70-90% | Phishing, UPI, OTP |
| test-phishing-hdfc.html | 80-95% | Bank impersonation, credential theft |
| test-upi-scam.html | 85-100% | UPI payment fraud, urgency |
| test-lottery-scam.html | 75-95% | Prize scam, upfront payment |

---

## Detailed Testing Results

### Test 1: HDFC Bank (Legitimate)
```
URL: https://www.hdfc.bank.in/
Expected Risk: LOW RISK (< 20%)
✓ HTTPS: Detected
✓ Domain: Established (> 30 days old)
✓ Financial Keywords: Some (legitimate for bank)
✓ OTP Fields: Not requesting
✓ Urgency: None
Result: ✅ PASS if Risk < 20%
```

### Test 2: test-phishing.html (SCAM)
```
URL: file:///D:/DTLEL/test-phishing.html
Expected Risk: HIGH RISK (70%+)
✓ UPI Scam ID: Detected (pay2885951@paytm)
✓ OTP Request: Detected
✓ Financial Keywords: Multiple detected
✓ Urgency Tactics: "DO NOT PROCEED" message
✓ Lookalike: Non-authentic domain
Result: ✅ PASS if Risk > 70%
```

### Test 3: test-phishing-hdfc.html (FAKE BANK)
```
URL: file:///D:/DTLEL/test-phishing-hdfc.html
Expected Risk: HIGH RISK (80%+)
✓ Bank Impersonation: HDFC lookalike
✓ Password Request: Detected
✓ OTP Request: Detected
✓ PIN Request: Detected
✓ Urgency: "Account suspension warning"
Result: ✅ PASS if Risk > 80%
```

---

## Console Debugging

### What to look for in F12 Console:

**For test-phishing.html, you should see:**
```
[Scam Detector] Content script loaded
[Scam Detector] Initializing on: file:///D:/DTLEL/test-phishing.html
[Scam Detector] Step 1: Website security check...
[Scam Detector] Step 2: URL phishing detection...
[Scam Detector] Step 3: Financial intent detection...
[Scam Detector] Step 4: OTP misuse detection...
[Scam Detector] Step 5: UPI scam detection...
[Scam Detector] Step 6: Risk scoring...
[Scam Detector] Analysis complete! Risk level: high Score: 0.85
```

**For legitimate sites (HDFC Bank):**
```
[Scam Detector] Content script loaded
[Scam Detector] Initializing on: https://www.hdfc.bank.in/
[Scam Detector] Step 1: Website security check...
[Security Detector] Domain age check failed: Domain age check timeout
[Scam Detector] Step 2: URL phishing detection...
[Scam Detector] Analysis complete! Risk level: low Score: 0.09
```

---

## Troubleshooting

### Issue: Extension not analyzing
- **Solution:** Refresh page (Ctrl+R)
- **Check:** Console shows "[Scam Detector] Content script loaded"

### Issue: "Could not establish connection" errors
- **Expected:** These happen during domain age check (timeout is normal)
- **Impact:** None - analysis continues with graceful fallback

### Issue: Risk score doesn't match expectation
- **Check:** What financial keywords did it detect? (Check console)
- **Note:** Risk score is aggregate of all factors

### Issue: False positive on legitimate site
- **Document:** URL and risk score
- **Note:** We can tune detection thresholds if needed

---

## Reporting Results

When testing, note:
1. **Website URL**
2. **Risk Level shown**
3. **Risk Score %**
4. **Any errors in console**
5. **Whether it matches expectations**

Example:
```
✅ HDFC Bank - https://www.hdfc.bank.in/
   Risk: LOW RISK ✓
   Score: 9% ✓
   Console: No errors ✓
   Status: PASS

❌ test-phishing.html - file:///D:/DTLEL/test-phishing.html
   Risk: MEDIUM RISK (Expected HIGH) ✗
   Score: 45% (Expected > 70%)
   Console: Financial intent not detected
   Status: NEEDS TUNING
```

---

## Next Steps After Testing

1. ✅ Test all local scam pages
2. ✅ Test 3-5 legitimate banks
3. ✅ Test 3-5 safe sites
4. ✅ Document any false positives/negatives
5. ✅ Report results

**Then:** We can fine-tune detection thresholds based on real-world results!
