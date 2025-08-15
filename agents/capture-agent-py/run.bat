@echo off
setlocal

:: --- Configuration ---
set "AGENT_DIR=%USERPROFILE%\.sounddocs-agent"
set "VENV_DIR=%AGENT_DIR%\.venv"
set "REPO_BASE_URL=https://raw.githubusercontent.com/SoundDocs/sounddocs/beta/agents/capture-agent-py"

:: --- Main Script ---
echo Setting up SoundDocs Capture Agent...

:: Create agent directory
if not exist "%AGENT_DIR%" mkdir "%AGENT_DIR%"
cd /d "%AGENT_DIR%"

:: Download necessary files using PowerShell
echo Downloading agent files...
powershell -Command "(New-Object Net.WebClient).DownloadFile('%REPO_BASE_URL%/pyproject.toml', 'pyproject.toml')"
powershell -Command "if not (Test-Path 'capture_agent') { mkdir 'capture_agent' }; (New-Object Net.WebClient).DownloadFile('%REPO_BASE_URL%/capture_agent/__main__.py', 'capture_agent/__main__.py'); (New-Object Net.WebClient).DownloadFile('%REPO_BASE_URL%/capture_agent/audio.py', 'capture_agent/audio.py'); (New-Object Net.WebClient).DownloadFile('%REPO_BASE_URL%/capture_agent/dsp.py', 'capture_agent/dsp.py'); (New-Object Net.WebClient).DownloadFile('%REPO_BASE_URL%/capture_agent/schema.py', 'capture_agent/schema.py'); (New-Object Net.WebClient).DownloadFile('%REPO_BASE_URL%/capture_agent/server.py', 'capture_agent/server.py')"

:: Check for Python 3.11+
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in your PATH.
    echo Please install Python 3.11 or newer.
    exit /b 1
)

:: Create virtual environment if it doesn't exist
if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo Creating Python virtual environment...
    python -m venv "%VENV_DIR%"
)

:: Activate virtual environment and install dependencies
echo Installing/updating dependencies...
call "%VENV_DIR%\Scripts\activate.bat"
pip install --upgrade pip > nul
pip install . > nul

echo Starting SoundDocs Capture Agent...
echo Press Ctrl+C to stop.
python -m capture_agent

endlocal
