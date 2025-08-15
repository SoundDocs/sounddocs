# SoundDocs Capture Agent

The SoundDocs Capture Agent is a small application that runs on your local machine to enable professional, multi-channel audio analysis in the SoundDocs web application. It connects to your audio interface, performs the necessary signal processing, and streams the results securely to the browser.

## Quick Start

We've provided simple scripts to get you up and running quickly.

**On macOS or Linux:**

1.  Open a Terminal window.
2.  Navigate to this directory: `cd /path/to/sounddocs/agents/capture-agent-py`
3.  Run the script: `./run.sh`

**On Windows:**

1.  Open Command Prompt or PowerShell.
2.  Navigate to this directory: `cd C:\path\to\sounddocs\agents\capture-agent-py`
3.  Run the script: `run.bat`

The first time you run the script, it will automatically set up a Python virtual environment and install the required dependencies. The agent will then start, and you can connect to it from the SoundDocs web application.

## Manual Setup (for advanced users)

If you prefer to set up the environment manually:

1.  **Install Python:** Ensure you have Python 3.11 or newer installed.
2.  **Install Poetry:** If you don't have it, install Poetry, a Python dependency manager.
3.  **Create Virtual Environment:** Navigate to this directory and run `poetry shell` to create and activate a virtual environment.
4.  **Install Dependencies:** Run `poetry install` to install the necessary libraries.
5.  **Run the Agent:** Run `poetry run python -m capture_agent` to start the server.
