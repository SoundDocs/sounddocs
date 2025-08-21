#!/bin/bash
set -e

# --- Configuration ---
AGENT_DIR="$HOME/.sounddocs-agent"
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

# --- mkcert setup (user-owned CA + system trust) ---
MKCERT_PATH="$(command -v mkcert || true)"
if [ -z "$MKCERT_PATH" ]; then
  echo "'mkcert' not found. Installing with Homebrew..."
  command -v brew >/dev/null 2>&1 || { echo "Install Homebrew first: https://brew.sh"; exit 1; }
  brew install mkcert
  MKCERT_PATH="$(command -v mkcert || true)"
  [ -n "$MKCERT_PATH" ] || { echo "mkcert install failed"; exit 1; }
fi

# Install CA as USER so files are user-owned
"$MKCERT_PATH" -install || true

CAROOT="$("$MKCERT_PATH" -CAROOT 2>/dev/null || echo "$HOME/Library/Application Support/mkcert")"
if [ -d "$CAROOT" ]; then
  # Ensure readable by the user after any privileged prompts mkcert may have triggered
  sudo chown -R "$USER":staff "$CAROOT" || true
  chmod 600 "$CAROOT/rootCA-key.pem" 2>/dev/null || true
fi

# Ensure CA is trusted in System keychain (admin prompt)
if ! security find-certificate -a -Z -c mkcert /Library/Keychains/System.keychain >/dev/null 2>&1; then
  echo "Adding mkcert root to System keychain (you’ll be prompted)…"
  sudo /usr/bin/security add-trusted-cert -d -r trustAsRoot -k /Library/Keychains/System.keychain "$CAROOT/rootCA.pem"
fi

# Generate localhost leaf certs (as USER)
mkdir -p "$AGENT_DIR"
"$MKCERT_PATH" -cert-file "$AGENT_DIR/localhost.pem" \
               -key-file "$AGENT_DIR/localhost-key.pem" \
               localhost 127.0.0.1 ::1

# Download necessary files
download_file "pyproject.toml" "pyproject.toml"
download_file "README.md" "README.md"
download_file "generate_cert.py" "generate_cert.py"
download_dir "capture_agent" "capture_agent"
download_file "capture_agent/VERSION" "capture_agent/VERSION"

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

# Activate virtual environment
source $VENV_DIR/bin/activate

# Install/update dependencies
echo "Installing/updating dependencies..."
pip install --upgrade pip > /dev/null
pip install . > /dev/null

echo "Starting SoundDocs Capture Agent..."
echo "Press Ctrl+C to stop."
python3 -m capture_agent
