@echo off
set VENV_DIR=.venv

REM Check for Python 3.11+
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in your PATH.
    echo Please install Python 3.11 or newer.
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
for /f "tokens=1,2 delims=." %%a in ("%PYTHON_VERSION%") do (
    if %%a lss 3 (
        echo Error: Python 3.11 or newer is required. You have version %PYTHON_VERSION%.
        exit /b 1
    )
    if %%a equ 3 if %%b lss 11 (
        echo Error: Python 3.11 or newer is required. You have version %PYTHON_VERSION%.
        exit /b 1
    )
)

REM Check if virtual environment exists
if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo Creating Python virtual environment in '%VENV_DIR%'...
    python -m venv %VENV_DIR%
)

REM Activate virtual environment and install dependencies
echo Activating virtual environment...
call "%VENV_DIR%\Scripts\activate.bat"

echo Installing/updating dependencies from pyproject.toml...
pip install .

echo Starting SoundDocs Capture Agent...
echo Press Ctrl+C to stop.
python -m capture_agent
