import asyncio
from .server import start_server

def main():
    """Main entry point for the capture agent."""
    print("Starting SoundDocs Capture Agent...")
    try:
        asyncio.run(start_server())
    except KeyboardInterrupt:
        print("Capture agent stopped by user.")

if __name__ == "__main__":
    main()
