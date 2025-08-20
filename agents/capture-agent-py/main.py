#!/usr/bin/env python3
"""
Entry point for SoundDocs Capture Agent
This avoids relative import issues in PyInstaller builds
"""
import sys
import os
import asyncio
import pathlib
import subprocess
import shutil

# Add the current directory to Python path so we can import capture_agent
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from capture_agent.server import start_server
except ImportError:
    # Fallback for PyInstaller bundle
    import capture_agent.server
    start_server = capture_agent.server.start_server

def check_mkcert():
    """Check if mkcert is installed and available"""
    return shutil.which("mkcert") is not None

def setup_certificates():
    """Setup SSL certificates if they don't exist"""
    agent_dir = pathlib.Path.home() / ".sounddocs-agent"
    cert_path = agent_dir / "localhost.pem"
    key_path = agent_dir / "localhost-key.pem"
    
    # Create agent directory if it doesn't exist
    agent_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if certificates already exist
    if cert_path.exists() and key_path.exists():
        print("✓ SSL certificates found")
        return True
    
    print("Setting up SSL certificates...")
    
    # Check if mkcert is installed
    if not check_mkcert():
        print("✗ mkcert is not installed or not in PATH")
        print("\nTo install mkcert:")
        print("  macOS: brew install mkcert")
        print("  Windows: choco install mkcert")
        print("\nAfter installation, run 'mkcert -install' once, then restart this app.")
        return False
    
    try:
        # Check if CA is installed
        ca_root = subprocess.run(['mkcert', '-CAROOT'], capture_output=True, text=True)
        if ca_root.returncode != 0:
            print("Setting up mkcert Certificate Authority...")
            subprocess.run(['mkcert', '-install'], check=True)
        
        # Generate certificates
        print("Generating SSL certificates...")
        os.chdir(agent_dir)
        subprocess.run([
            'mkcert',
            '-cert-file', 'localhost.pem',
            '-key-file', 'localhost-key.pem',
            'localhost', '127.0.0.1', '::1'
        ], check=True, capture_output=True)
        
        print("✓ SSL certificates generated successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to generate SSL certificates: {e}")
        return False
    except Exception as e:
        print(f"✗ Certificate setup error: {e}")
        return False

def main():
    """Main entry point for the capture agent."""
    print("============================================")
    print("SoundDocs Capture Agent")
    print("============================================")
    print()
    
    # Setup certificates first
    if not setup_certificates():
        print("\nCertificate setup failed. Please resolve the issues above and try again.")
        input("Press Enter to exit...")
        sys.exit(1)
    
    print()
    print("Starting capture agent server...")
    print("The agent will be available at: wss://127.0.0.1:9469")
    print("Press Ctrl+C to stop.")
    print()
    
    try:
        asyncio.run(start_server())
    except KeyboardInterrupt:
        print("\nCapture agent stopped by user.")
    except Exception as e:
        print(f"\nError starting server: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        print("\nPlease check that all dependencies are installed correctly.")
        input("Press Enter to exit...")
        sys.exit(1)

if __name__ == "__main__":
    main()
