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

## First-Time Setup: Trusting the SSL Certificate

To communicate securely, the agent uses a locally generated SSL certificate. Your browser will not trust this certificate by default. You must perform a one-time setup to grant trust.

1.  **Run the agent** using the `run.sh` or `run.bat` script as described above.
2.  **Open your browser** and navigate to the following URL: **https://localhost:9469**
3.  You will see a security warning page. Follow the instructions for your browser below.

#### **For Google Chrome / Microsoft Edge**

1.  The page will show a "Your connection is not private" warning.
2.  Click the **"Advanced"** button.
3.  Click the link that says **"Proceed to localhost (unsafe)"**.

#### **For Mozilla Firefox**

1.  The page will show a "Warning: Potential Security Risk Ahead" message.
2.  Click the **"Advanced..."** button.
3.  Click the **"Accept the Risk and Continue"** button.

#### **For Apple Safari**

1.  A dialog will appear saying "Safari can't verify the identity of the website 'localhost'".
2.  Click the **"Show Certificate"** button.
3.  Expand the **"Trust"** section.
4.  In the "When using this certificate" dropdown, select **"Always Trust"**.
5.  You may be prompted to enter your computer's password to save this setting.

After completing these steps, you can close the `localhost:9469` tab and return to the SoundDocs application. The connection should now work correctly.

### A Note on Security

Using a self-signed certificate is the standard and secure method for applications that run on your local machine (`localhost`). Because the agent is not on the public internet, it cannot use a traditional certificate from a public authority. By trusting the certificate, you are simply creating a secure, encrypted connection between the SoundDocs website and the agent running on your own computer.

## Manual Setup (for developers)

If you prefer to set up the environment manually:

1.  **Install Python:** Ensure you have Python 3.11 or newer installed.
2.  **Install Poetry:** If you don't have it, install Poetry, a Python dependency manager.
3.  **Create Virtual Environment:** Navigate to this directory and run `poetry shell` to create and activate a virtual environment.
4.  **Install Dependencies:** Run `poetry install` to install the necessary libraries.
5.  **Run the Agent:** Run `poetry run python -m capture_agent` to start the server.
