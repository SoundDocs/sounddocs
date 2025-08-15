#!/bin/bash
set -e

# --- Configuration ---
AGENT_DIR="$HOME/.sounddocs-agent"
REPO_URL="https://api.github.com/repos/SoundDocs/sounddocs/contents/agents/capture-agent-py"
VENV_DIR="$AGENT_DIR/.venv"

# --- Helper Functions ---
function download_file() {
  local file_path="$1"
  local output_path="$2"
  echo "Downloading $file_path..."
  curl -s -L -H "Accept: application/vnd.github.v3.raw" \
    "https://raw.githubusercontent.com/SoundDocs/sounddocs/beta/agents/capture-agent-py/$file_path" \
    -o "$output_path"
}

function download_dir() {
  local dir_path="$1"
  local output_dir="$2"
  mkdir -p "$output_dir"
  
  # Get directory contents from GitHub API
  local api_url="https://api.github.com/repos/SoundDocs/sounddocs/contents/agents/capture-agent-py/$dir_path?ref=beta"
  local files=$(curl -s -L "$api_url" | grep '"name":' | sed 's/.*"name": "\(.*\)",.*/\1/')

  for file in $files; do
    download_file "$dir_path/$file" "$output_dir/$file"
  done
}

# --- Main Script ---
echo "Setting up SoundDocs Capture Agent..."

# Create agent directory
mkdir -p "$AGENT_DIR"
cd "$AGENT_DIR"

# Download necessary files
download_file "pyproject.toml" "pyproject.toml"
download_file "README.md" "README.md"
download_dir "capture_agent" "capture_agent"

# Check for Python 3.11+
if ! command -v python3 &> /dev/null || ! python3 -c 'import sys; assert sys.version_info >= (3, 11)' &> /dev/null; then
    echo "Error: Python 3.11 or newer is required."
    echo "Please install it and ensure 'python3' is in your PATH."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv $VENV_DIR
fi

# Activate virtual environment and install dependencies
source $VENV_DIR/bin/activate

echo "Installing/updating dependencies..."
pip install --upgrade pip > /dev/null
pip install . > /dev/null

echo "Starting SoundDocs Capture Agent..."
echo "Press Ctrl+C to stop."
python -m capture_agent
