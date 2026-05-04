@echo off
REM Faculty Scheduler - Setup Script for Windows

echo ==========================================
echo Faculty Timetable Scheduler - Setup
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed. Please install from nodejs.org
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%
echo.

REM Check if directories exist
if not exist "backend" (
    echo Error: backend directory not found
    exit /b 1
)
if not exist "frontend" (
    echo Error: frontend directory not found
    exit /b 1
)

echo Installing dependencies...
echo.

REM Install backend dependencies
echo Backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install backend dependencies
    exit /b 1
)
echo Backend dependencies installed
cd ..
echo.

REM Install frontend dependencies
echo Frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install frontend dependencies
    exit /b 1
)
echo Frontend dependencies installed
cd ..
echo.

REM Create .env files if they don't exist
echo Setting up environment variables...
echo.

if not exist "backend\.env" (
    echo Creating backend\.env...
    copy backend\.env.example backend\.env
    echo Please update backend\.env with your Supabase credentials
)

if not exist "frontend\.env" (
    echo Creating frontend\.env...
    copy frontend\.env.example frontend\.env
    echo Please update frontend\.env with your Supabase credentials
)

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Update environment variables in backend\.env and frontend\.env
echo 2. Run: npm run dev (in backend directory)
echo 3. Run: npm run dev (in frontend directory)
echo 4. Visit http://localhost:3000
echo.
echo See QUICK_START.md for more details
