# 🚀 Financial Scam Detector - Restart Guide

**Last Updated:** January 5, 2026  
**System:** Windows PowerShell  
**Project Location:** `D:\DTLEL\financial-scam-detector`

---

## 📋 Quick Start (Morning Checklist)

Follow these steps **in order** to restart the system tomorrow:

### Step 1: Open PowerShell ✅
1. Press `Win + R`
2. Type: `powershell`
3. Press Enter

### Step 2: Navigate to Backend Folder ✅
```powershell
cd D:\DTLEL\financial-scam-detector\backend
```

### Step 3: Activate Virtual Environment ✅
```powershell
..\..\.venv\Scripts\Activate.ps1
```

**Expected Output:**
```
(venv) PS D:\DTLEL\financial-scam-detector\backend>
```
(You should see `(venv)` prefix in your prompt)

### Step 4: Start Backend Server ✅
```powershell
python app.py
```

**Wait 30-40 seconds for models to load.** You should see:
```
Initializing ML models...
Loading DistilBERT model...
Loading BART model...
Initializing sklearn models...
✓ All models initialized successfully!
INFO:     Application startup complete [uvicorn]
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Backend is ready when you see:** `Uvicorn running on http://0.0.0.0:8000`

### Step 5: Verify Backend Health ✅
**In a NEW PowerShell window:**

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get | ConvertTo-Json
```

**Expected Output (all true):**
```json
{
  "status": "healthy",
  "models": {
    "email_phishing": true,
    "url_phishing": true,
    "webpage_classification": true,
    "risk_scoring": true,
    "domain_checker": true
  }
}
```

✅ **If all are `true` → Backend is working!**

### Step 6: Open Chrome Extension ✅
1. Open **Google Chrome**
2. Go to: `chrome://extensions/`
3. Look for **"Financial Scam Detector"**
4. Check the **toggle switch is ON** (blue)
5. If off, click to enable it

### Step 7: Test Extension ✅
1. Open test page: `D:\DTLEL\test-phishing-hdfc.html`
   - Press `Ctrl+O` → Navigate to file → Open
2. Wait **2-3 seconds** for analysis
3. Click **extension icon** (shield icon in toolbar)
4. **Expected Result:** Should show HIGH RISK with warnings

---

## 🔧 Troubleshooting

### Backend Won't Start
**Error:** `ModuleNotFoundError` or `ImportError`

**Solution:**
```powershell
cd D:\DTLEL\financial-scam-detector\backend
..\..\.venv\Scripts\pip.exe install --upgrade -r requirements.txt
```

### Extension Not Analyzing
**Symptom:** Popup shows blank or "Unknown Risk"

**Solution:**
1. Go to `chrome://extensions/`
2. Find "Financial Scam Detector"
3. Click **Reload** (⟳ circular icon)
4. Refresh page in browser (Ctrl+R)
5. Wait 3 seconds and check popup again

### Backend Already Running (Port 8000 in use)
**Error:** `Address already in use`

**Solution:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace XXXX with PID)
taskkill /PID XXXX /F
```

### Models Taking Long Time to Load
**Symptom:** Backend running but health endpoint returns `false` for some models

**Solution:** Wait longer (up to 60 seconds). First startup loads ~2GB of ML models.

---

## 📁 Project Structure Reference

```
D:\DTLEL\
├── financial-scam-detector/
│   ├── backend/              ← Start Python server here
│   │   ├── app.py           ← Main FastAPI server
│   │   ├── requirements.txt
│   │   └── venv/            ← Virtual environment
│   └── extension/           ← Chrome extension files
├── test-phishing-hdfc.html  ← Test scam page
├── test-upi-scam.html
├── test-lottery-scam.html
└── test-phishing.html
```

---

## 🧪 Testing Workflow

### Current Test Status:
- ✅ **test-lottery-scam.html** - HIGH RISK (UPI scam detected)
- 🔄 **test-phishing-hdfc.html** - Being tested now (expect HIGH RISK)
- ⏳ **test-upi-scam.html** - Pending
- ⏳ **test-phishing.html** - Pending (retest)

### How to Test a Page:

1. **Backend running?** Check if you see `Uvicorn running` message
2. **Extension loaded?** Check `chrome://extensions/`
3. **Open test file:** `Ctrl+O` → Select test HTML file
4. **Wait 2-3 seconds** for analysis to complete
5. **Click extension icon** (shield) in Chrome toolbar
6. **Check popup** for:
   - Risk Level (HIGH RISK, MEDIUM RISK, LOW RISK)
   - Risk Score percentage
   - Warnings/reasons
7. **Press F12** → Console tab → Check for `[Scam Detector]` logs

---

## ✨ Key Features to Verify

### Expected for SCAM pages:
- 🚨 **HIGH RISK** or **MEDIUM RISK** warning in popup
- Risk Score: **70%+** for scams
- Detailed warnings showing what scam was detected
- Console shows detection reasons

### Expected for LEGITIMATE pages:
- ✅ **LOW RISK** badge
- Risk Score: **< 20%**
- Clear message: "This website appears safe"

---

## 📝 Important Notes

1. **Backend must stay running** - Keep PowerShell window with `python app.py` open
2. **Don't close the window** - Closing it stops the backend
3. **Chrome needs internet** - Some checks use online verification
4. **First run slower** - Models load on first startup (~40 seconds)
5. **Subsequent runs faster** - Models stay in memory after first load

---

## 🆘 Emergency Restart

If everything breaks, use "nuclear option":

```powershell
# Kill all Python processes
Get-Process python | Stop-Process -Force

# Wait 2 seconds
Start-Sleep -Seconds 2

# Activate venv fresh
cd D:\DTLEL\financial-scam-detector\backend
..\..\.venv\Scripts\Activate.ps1

# Clean install dependencies
..\..\.venv\Scripts\pip.exe install --upgrade -r requirements.txt

# Start server
python app.py
```

---

## 📞 Support

For issues, check:
1. `D:\DTLEL\financial-scam-detector\TESTING.md` - Full testing guide
2. `D:\DTLEL\DETAILED_TESTING_GUIDE.md` - Detailed test scenarios
3. Backend logs (first terminal) - Shows model loading progress
4. Chrome DevTools (F12) - Extension console logs

---

**Happy Testing! 🛡️**
