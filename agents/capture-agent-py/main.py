#!/usr/bin/env python3
"""
Entry point for SoundDocs Capture Agent
This avoids relative import issues in PyInstaller builds
"""
import sys
import os
import asyncio

# Add the current directory to Python path so we can import capture_agent
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from capture_agent.server import start_server
except ImportError:
    # Fallback for PyInstaller bundle
    import capture_agent.server
    start_server = capture_agent.server.start_server

def main():
    """Main entry point for the capture agent."""
    print("Starting SoundDocs Capture Agent...")
    print("The agent will be available at: https://localhost:8443")
    print("Press Ctrl+C to stop.")
    print()
    
    try:
        asyncio.run(start_server())
    except KeyboardInterrupt:
        print("\nCapture agent stopped by user.")
    except Exception as e:
        print(f"\nError: {e}")
        print("Please check that all dependencies are installed correctly.")
        sys.exit(1)

if __name__ == "__main__":
    main()
