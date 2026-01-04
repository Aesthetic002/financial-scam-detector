# Safe Shutdown Guide — Financial Scam Detector

**Date:** January 5, 2026

Follow these steps to safely stop the system and resume work tomorrow.

## 1) Save your work
- Commit or stash any code changes if you use Git:

```powershell
cd D:\DTLEL\financial-scam-detector
git status
git add -A
git commit -m "WIP: save changes before shutdown"   # or use git stash
```

- If you are not using Git, make sure files are saved in the editor.

## 2) Stop the backend server (graceful)
- In the PowerShell window where you ran `python app.py`, press `Ctrl+C` and confirm to stop. Wait until the server exits.

If `Ctrl+C` does not stop it, find and kill the process:

```powershell
# find processes using port 8000
netstat -ano | findstr :8000
# note PID from the output, then
taskkill /PID <PID> /F
```

Or stop all Python processes (use with caution):

```powershell
Get-Process python | Stop-Process -Force
```

## 3) Deactivate virtual environment
- If your shell prompt still shows the venv, run:

```powershell
deactivate
```

- If `deactivate` isn't recognized, just close the PowerShell window — that also releases the environment.

## 4) Close Chrome and test pages
- Close the browser windows/tabs running your local test pages (`test-*.html`) so content scripts stop executing.
- Optionally, disable or remove the extension if you prefer a clean browser state tomorrow:
  - Open `chrome://extensions/` → toggle off **Financial Scam Detector** or click **Remove**.

## 5) Optional: Clean temporary logs
- If you have console logs or temporary files you want removed, clean them now.

## 6) Put the machine to sleep or shut down
- If you plan to resume quickly, use Sleep or Hibernate.
- If you will power off, shut down after confirming backend stopped and files saved.

## 7) Quick restart checklist (tomorrow)
- See `STARTUP_GUIDE.md` for full restart steps. Short version:

```powershell
# open PowerShell
cd D:\DTLEL\financial-scam-detector\backend
..\..\.venv\Scripts\Activate.ps1    # activate venv
python app.py                            # start backend
# verify health:
Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get | ConvertTo-Json
```

- Reload the extension at `chrome://extensions/` and open your test page(s).

---

## Notes & Warnings
- Always stop the backend before shutting down to avoid corrupting in-memory operations.
- If you kill processes with `taskkill` or `Stop-Process`, ensure you are terminating the intended processes.
- Keep `STARTUP_GUIDE.md` handy for the exact startup steps.

**File created at:** `D:\DTLEL\SHUTDOWN_GUIDE.md`