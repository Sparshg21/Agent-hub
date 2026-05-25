@echo off
echo.
echo   AgentHub - Starting up...
echo.

:: Check Python
python --version >nul 2>&1 || (echo   ERROR: Python not found. Install from https://python.org && pause && exit /b)
:: Check Node
node --version >nul 2>&1 || (echo   ERROR: Node.js not found. Install from https://nodejs.org && pause && exit /b)

:: API Key setup
if not exist backend\.env (
  copy backend\.env.example backend\.env >nul
)

findstr /C:"sk-ant-" backend\.env >nul 2>&1
if errorlevel 1 (
  echo   Enter your Anthropic API key ^(from https://console.anthropic.com^):
  set /p API_KEY=  Key:
  powershell -Command "(Get-Content backend\.env) -replace 'ANTHROPIC_API_KEY=.*', 'ANTHROPIC_API_KEY=%API_KEY%' | Set-Content backend\.env"
  echo   API key saved!
  echo.
)

:: Backend setup
echo   Setting up backend...
cd backend
if not exist venv (python -m venv venv)
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
echo   Backend ready - starting...
start /B uvicorn main:app --port 8000
cd ..

:: Frontend setup
echo   Setting up frontend...
cd frontend
if not exist node_modules (npm install --silent)
echo   Frontend ready - starting...
echo.
echo   ==========================================
echo     AgentHub is running!
echo     Open: http://localhost:5173
echo   ==========================================
echo.
npm run dev -- --open
