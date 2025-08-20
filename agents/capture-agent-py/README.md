# SoundDocs Capture Agent

The SoundDocs Capture Agent is a professional application that runs on your local machine to enable multi-channel audio analysis in the SoundDocs web application. It connects to your audio interface, performs real-time signal processing, and streams the results securely to the browser.

## Easy Installation

The capture agent is now available as professional installers - no more manual setup required!

### Quick Start

1.  **Download the installer for your OS:**

    - **macOS:** Download the `.pkg` installer from [GitHub Releases](https://github.com/SoundDocs/sounddocs/releases)
    - **Windows:** Download the `.exe` installer from [GitHub Releases](https://github.com/SoundDocs/sounddocs/releases)

2.  **Install and run:**

    - **macOS:** Double-click the `.pkg` file and follow the installer prompts
    - **Windows:** Right-click the `.exe` file, select "Run as administrator", and follow the setup wizard

3.  **Launch the agent:**
    - **macOS:** Find "SoundDocs Capture Agent" in Applications or Launchpad
    - **Windows:** Use the Start Menu shortcut or Desktop icon

### What the Installer Does

The installer automatically handles all setup for you:

1.  **Install the Application:** The capture agent is installed to your system's Applications folder
2.  **Dependency Management:** Automatically installs or configures mkcert for SSL certificates
3.  **Certificate Authority Setup:** Sets up a local Certificate Authority (CA) so browsers trust the connection
4.  **SSL Certificate Generation:** Creates trusted SSL certificates for `localhost`
5.  **System Integration:** Creates shortcuts and proper system integration
6.  **First-Run Setup:** On first launch, completes any remaining configuration automatically

Because the installer handles the certificate trust process, you will **not** see any browser security warnings when connecting.

### Using the Capture Agent

#### Connecting to SoundDocs

1.  **Launch the capture agent** using the methods described above
2.  **Open your browser** and navigate to [SoundDocs Analyzer Pro](https://sounddocs.org/analyzer-pro)
3.  **Connect automatically** - the web app will detect and connect to the running agent
4.  **Start analyzing** - you now have access to professional measurement tools!

#### Features Unlocked

With the capture agent running, you get access to:

- **Transfer Function Analysis** - Real-time magnitude and phase measurement
- **Coherence Analysis** - Measure signal correlation between channels
- **Multi-channel Support** - Use professional audio interfaces
- **Real-time Processing** - Live analysis with minimal latency
- **Professional Tools** - EQ, filtering, and measurement utilities

#### System Requirements

- **macOS:** macOS 10.14 or later
- **Windows:** Windows 10 or later
- **Audio Interface:** Any Core Audio (macOS) or WASAPI (Windows) compatible device
- **Network:** Local network access for WebSocket connection

#### Troubleshooting

If you encounter issues:

**Connection Problems:**

- Ensure the capture agent shows "SSL certificates found" on startup
- Check that no firewall is blocking port 8443
- Try restarting the capture agent

**macOS Issues:**

- If Homebrew installation is needed, the agent will guide you through it
- You may need to enter your password for certificate authority setup

**Windows Issues:**

- Run the installer as administrator if you encounter permission errors
- If Chocolatey is needed, the setup will help install it

## Local Development

For developers working on the capture agent:

1.  **Clone the repository** and navigate to `agents/capture-agent-py/`
2.  **Install dependencies:** `pip install -e .`
3.  **Run in development:** `python -m capture_agent` or `python main.py`
4.  **Test with web app:** Run `pnpm --filter web dev` and navigate to **https://localhost:5173**

The agent will be available at `wss://localhost:9469` for WebSocket connections.
