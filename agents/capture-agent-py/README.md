# SoundDocs Capture Agent

The SoundDocs Capture Agent is a small application that runs on your local machine to enable professional, multi-channel audio analysis in the SoundDocs web application. It connects to your audio interface, performs the necessary signal processing, and streams the results securely to the browser.

## Quick Start

The capture agent can be installed and run with a single script. You do not need to download the entire SoundDocs project.

**On macOS or Linux:**

1.  Download the `run.sh` script.
2.  Open your Terminal.
3.  Navigate to your Downloads folder: `cd ~/Downloads`
4.  Make the script executable: `chmod +x run.sh`
5.  Run the script: `./run.sh`

**On Windows:**

1.  Download the `run.bat` script.
2.  Open Command Prompt or PowerShell.
3.  Navigate to your Downloads folder: `cd %USERPROFILE%\Downloads`
4.  Run the script: `run.bat`

The first time you run the script, it will download the latest version of the agent, set up a Python virtual environment in your home directory (`~/.sounddocs-agent`), and install all required dependencies. The agent will then start, and you can connect to it from the SoundDocs web application.

## Manual Setup (for developers)

If you prefer to set up the environment manually:

1.  **Install Python:** Ensure you have Python 3.11 or newer installed.
2.  **Install Poetry:** If you don't have it, install Poetry, a Python dependency manager.
3.  **Create Virtual Environment:** Navigate to this directory and run `poetry shell` to create and activate a virtual environment.
4.  **Install Dependencies:** Run `poetry install` to install the necessary libraries.
5.  **Run the Agent:** Run `poetry run python -m capture_agent` to start the server.
