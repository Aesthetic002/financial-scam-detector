# Quick Testing Start Guide

## 4 New Test Pages Ready

All in `D:\DTLEL\`:
- ✅ test-phishing.html
- ✅ test-phishing-hdfc.html  
- ✅ test-upi-scam.html
- ✅ test-lottery-scam.html

---

## Test Now: 3 Simple Steps

### Step 1: Open Test File
1. Open Chrome
2. Press **Ctrl+O**
3. Go to `D:\DTLEL\test-phishing.html`

### Step 2: Wait & Check
- Wait 2-3 seconds for extension to analyze
- Click extension icon (shield) in toolbar
- Should show **HIGH RISK**

### Step 3: Verify
- Open F12 Console (press F12)
- Look for `[Scam Detector]` logs
- Should show complete analysis

---

## Expected Results

| Test File | Expected Risk | What It Detects |
|-----------|---------------|-----------------|
| test-phishing.html | HIGH (70%+) | UPI scams, OTP fields |
| test-phishing-hdfc.html | HIGH (80%+) | Bank phishing, passwords |
| test-upi-scam.html | HIGH (85%+) | UPI payment fraud |
| test-lottery-scam.html | HIGH (75%+) | Prize scams, upfront payment |

---

## Then Test Real Sites

Once local tests pass, try:
- https://www.hdfc.bank.in/ (Should be LOW RISK)
- https://www.icicibank.com/ (Should be LOW RISK)
- https://www.gmail.com (Should be LOW RISK)

---

## Report Results

Run all tests and share:
1. What risk levels you got
2. Any errors in console
3. Which tests passed/failed

👉 **Start with test-phishing.html** - it has all scam indicators!
