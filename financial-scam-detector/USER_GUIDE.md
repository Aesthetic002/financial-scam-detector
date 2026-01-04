# User Guide - Financial Scam Detector

## Table of Contents

1. [Installation](#installation)
2. [How It Works](#how-it-works)
3. [Understanding Alerts](#understanding-alerts)
4. [Risk Levels Explained](#risk-levels-explained)
5. [Common Scam Types](#common-scam-types)
6. [FAQ](#faq)
7. [Best Practices](#best-practices)

## Installation

### Prerequisites
- Windows 10/11
- Python 3.8 or higher
- Chrome or Edge browser

### Step 1: Setup Backend

1. Extract the files to a folder
2. Open PowerShell/Command Prompt
3. Navigate to the folder:
   ```
   cd financial-scam-detector
   ```
4. Run the setup script:
   ```powershell
   # PowerShell
   .\setup.ps1
   
   # OR Command Prompt
   setup.bat
   ```

### Step 2: Start Backend Server

```bash
cd backend
.\venv\Scripts\Activate.ps1  # PowerShell
# OR
venv\Scripts\activate.bat    # Command Prompt

python app.py
```

The server will start at `http://localhost:8000`

### Step 3: Install Browser Extension

1. Open Chrome/Edge browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `extension` folder
6. The shield icon should appear in your toolbar

## How It Works

### Continuous Protection

Once installed, the extension:
1. **Analyzes every webpage** you visit in real-time
2. **Detects financial activity** (logins, payments, OTP entry)
3. **Activates enhanced checks** when money is involved
4. **Alerts you instantly** if risk is detected

### What Gets Checked

✓ Website security (HTTPS, SSL certificate, domain age)  
✓ URL structure and patterns  
✓ Page content and intent  
✓ OTP/password requests on untrusted sites  
✓ UPI payment scams  
✓ Brand impersonation  

## Understanding Alerts

### Alert Types

#### 🟢 Low Risk
- Website appears safe
- No action needed
- Continue normally

#### 🟡 Medium Risk
- Some security concerns detected
- **Action**: Verify website authenticity
- Double-check the URL
- Look for official contact information

#### 🔴 High Risk
- Strong scam indicators detected
- **Action**: Leave the website immediately
- Do NOT enter any information
- Report the site if possible

### Alert Components

```
┌─────────────────────────────────────┐
│ 🚨 HIGH RISK                         │  ← Risk Level
├─────────────────────────────────────┤
│ This page is risky because banks    │  ← Simple Explanation
│ do not ask for OTP on websites.     │
│                                      │
│ Details:                             │
│ • OTP field on untrusted domain     │  ← Specific Reasons
│ • Domain only 15 days old           │
│ • Claims to be SBI but isn't        │
├─────────────────────────────────────┤
│ [I Understand] [Leave This Site]    │  ← Action Buttons
└─────────────────────────────────────┘
```

## Risk Levels Explained

### Low Risk (0-40%)
**What it means**: The page appears legitimate based on our checks.

**What to do**: 
- Proceed normally
- Still verify important transactions
- Trust your instincts

### Medium Risk (40-70%)
**What it means**: Some suspicious elements detected, but not conclusive.

**What to do**:
- ⚠️ DO NOT enter sensitive information yet
- Verify the website through official channels
- Check the URL carefully
- Contact the company directly if unsure

### High Risk (70-100%)
**What it means**: Strong indicators of a scam or phishing attempt.

**What to do**:
- 🚨 LEAVE THE WEBSITE IMMEDIATELY
- DO NOT enter any information
- Clear your browser history
- Run a security scan if you entered data
- Report to authorities if needed

## Common Scam Types

### 1. "Approve to Receive Money" Scam

**How it works**: Scammers send a payment request but word it as if you're receiving money.

**Red flags**:
- "Approve to receive ₹5000"
- "Accept payment to get money"
- UPI collect request with receiving language

**Reality**: In UPI, you NEVER approve anything to receive money. You only share your UPI ID.

---

### 2. Fake Bank Login Pages

**How it works**: Lookalike websites that mimic real bank sites.

**Red flags**:
- URL doesn't match official bank domain
- Recently registered domain
- Asking for full password (banks use grid authentication)
- Non-HTTPS connection

**Example**:
- ✗ `sbi-onlinebanking.com` (Fake)
- ✓ `onlinesbi.sbi.co.in` (Real)

---

### 3. OTP Phishing

**How it works**: Website asks you to enter OTP received on your phone.

**Red flags**:
- OTP requested via email link
- Random website asking for banking OTP
- "Verify your account" messages

**Remember**: Banks NEVER ask for OTP via email or website links!

---

### 4. Pay ₹1 to Verify Scam

**How it works**: Sites claim you need to pay ₹1 to verify or activate something.

**Red flags**:
- "Pay ₹1 to activate"
- "Send Re. 1 to confirm"
- "Verification payment required"

**Reality**: NO legitimate service requires payment for verification!

---

### 5. Prize/Reward Scams

**How it works**: Fake notifications claiming you won a prize, requiring payment.

**Red flags**:
- "You've won ₹50,000!"
- "Claim your reward now"
- Asking for payment to receive prize

**Reality**: Real prizes never ask for payment!

## FAQ

### Q: Will this slow down my browsing?
**A**: No. Analysis happens in milliseconds and doesn't affect page load speed.

### Q: Does it work without internet?
**A**: Yes! Most detection is client-side. ML features need backend but extension works without it.

### Q: What data is collected?
**A**: None. All analysis is local. No data is sent to external servers except optional ML API calls to localhost.

### Q: Can I trust a "Low Risk" site completely?
**A**: Use it as one signal, not the only one. Always verify important transactions through official channels.

### Q: What if I get a false positive?
**A**: You can click "I Understand" to proceed. The extension learns nothing is foolproof.

### Q: Does it protect against all scams?
**A**: It catches most common financial scams, but social engineering and new techniques may not be detected. Stay vigilant!

### Q: Can I use it on mobile?
**A**: Currently Chrome/Edge desktop only. Mobile version planned for future.

## Best Practices

### ✓ DO:

1. **Verify URLs manually** before entering credentials
2. **Use official banking apps** instead of browsers when possible
3. **Enable 2FA** on all financial accounts
4. **Check for HTTPS** and valid SSL certificates
5. **Bookmark** your bank's official website
6. **Contact bank directly** if you receive suspicious emails
7. **Keep the extension updated**

### ✗ DON'T:

1. **Never share OTP** with anyone, including "bank officials"
2. **Don't click email links** for banking - type URL manually
3. **Don't ignore High Risk alerts** - they're there for a reason
4. **Don't enter credentials** on shortened URLs (bit.ly, etc.)
5. **Don't trust caller ID** - scammers can fake it
6. **Don't pay to receive money** - that's not how UPI works

## Emergency Steps

### If You Think You've Been Scammed:

1. **Immediately**:
   - Change all passwords
   - Call your bank's fraud department
   - Block your cards if compromised

2. **Within 1 hour**:
   - File online complaint at cybercrime.gov.in
   - Report to local police
   - Inform UPI provider (PhonePe/Paytm/etc.)

3. **Within 24 hours**:
   - Monitor bank statements
   - Set up fraud alerts
   - Run antivirus scan

### Important Numbers:

- **National Cyber Crime Helpline**: 1930
- **Banking Ombudsman**: 14440 / 14441
- **Online Complaint**: cybercrime.gov.in

## Support

For issues or questions:
- Check the README.md file
- Review ARCHITECTURE.md for technical details
- Report bugs via GitHub issues (if applicable)

---

**Remember**: This tool is a helper, not a replacement for vigilance. When in doubt, verify through official channels!

Stay safe! 🛡️
