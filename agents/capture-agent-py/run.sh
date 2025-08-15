#!/bin/bash
set -e

VENV_DIR=".venv"

# Check for Python 3.11+
if ! command -v python3 &> /dev/null || ! python3 -c 'import sys; assert sys.version_info >= (3, 11)' &> /dev/null; then
    echo "Error: Python 3.11 or newer is required."
    echo "Please install it and ensure 'python3' is in your PATH."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment in '$VENV_DIR'..."
    python3 -m venv $VENV_DIR
fi

# Activate virtual environment and install dependencies
source $VENV_DIR/bin/activate

echo "Installing/updating dependencies from pyproject.toml..."
# Use pip to install from pyproject.toml, as poetry might not be installed
pip install .

echo "Starting SoundDocs Capture Agent..."
echo "Press Ctrl+C to stop."
python -m capture_agent
