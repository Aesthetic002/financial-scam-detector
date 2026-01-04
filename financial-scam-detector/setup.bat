@echo off
echo ================================
echo Financial Scam Detector Setup
echo ================================
echo.

REM Check Python installation
echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Python not found. Please install Python 3.8 or higher.
    pause
    exit /b 1
)
echo [OK] Python found

REM Backend setup
echo.
echo Setting up backend...
cd backend

REM Create virtual environment
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

echo [OK] Backend setup complete

REM Return to root
cd ..

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Start the backend server:
echo    cd backend
echo    venv\Scripts\activate.bat
echo    python app.py
echo.
echo 2. Load the browser extension:
echo    - Open Chrome/Edge
echo    - Go to chrome://extensions/
echo    - Enable Developer mode
echo    - Click 'Load unpacked'
echo    - Select the 'extension' folder
echo.
echo You're protected! 🛡️
pause
