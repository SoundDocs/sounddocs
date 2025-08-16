# SoundDocs 🎛️

**Professional Audio Documentation, Simplified.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)

SoundDocs is a modern web application meticulously crafted for audio engineers, production managers, and event technicians. Streamline your workflow by creating comprehensive patch lists, intuitive stage plots, detailed run of shows, and production schedules with ease. Share your setups seamlessly with venues, artists, and production teams.

![SoundDocs Hero Preview](https://i.postimg.cc/bJdc5Hmz/Screenshot-2025-06-05-at-19-21-01.png)

## ✨ Core Features

SoundDocs empowers you to manage event audio documentation efficiently:

- **📝 Patch Sheet Editor:**
  Design detailed input/output lists, map signal flows, specify equipment, and add critical technical notes. Perfect for FOH, monitors, and broadcast.
- **🎨 Stage Plot Designer:**
  Visually construct stage layouts using a library of draggable elements including instruments, microphones, monitors, DI boxes, and risers. Clearly communicate stage needs.
- **🗓️ Run of Show Creator (with Show Mode):**
  Develop detailed event timelines, cue sheets, and segment breakdowns. Utilize the "Show Mode" for real-time event tracking and execution.
- **📊 Production Schedule Manager:**
  Organize and track all pre-production, setup, rehearsal, show, and strike activities. Ensure your entire team is aligned.
- **🚀 Smart Export System:**
  Generate professional, high-quality PDF exports of your documents. Choose between dark or light mode to suit your presentation needs.
- **🤝 Collaboration Tools:**
  Share your documents securely via unique links. Facilitate smooth communication with clients, band members, and technical crew.
- **🎤 AcoustIQ Audio Analyzer:**
  A comprehensive audio analysis tool with both a simple browser-based RTA ("Lite") and a powerful dual-channel version ("Pro") that uses a local capture agent. Features include:
  - Real-time Spectrogram (RTA)
  - SPL Meter with Calibration
  - Dual-Channel Transfer Function
  - Coherence & Phase Measurement
  - Impulse Response

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API / Zustand (for more complex states)
- **Routing**: React Router 6
- **Exporting**: `jspdf` for PDF generation

### Backend

- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Real-time Features**: Supabase Realtime
- **Storage**: Supabase (PostgreSQL)

## 🚀 Development

This guide provides instructions for setting up the SoundDocs project for local development.

### Quick Start

For experienced developers, here are the essential commands to get the project running:

1.  **Clone and Checkout `beta` Branch**:
    ```bash
    git clone https://github.com/SoundDocs/sounddocs.git
    cd sounddocs
    git checkout beta
    ```
2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
3.  **Start Local Supabase Services**:
    ```bash
    supabase start
    ```
4.  **Set Up Web App Environment**:
    Copy the local Supabase credentials output by the previous command into a new `.env` file in `apps/web`.
5.  **Generate SSL Certificate**:
    ```bash
    cd agents/capture-agent-py
    python3 generate_cert.py
    cd ../..
    ```
6.  **Start the Web App**:
    ```bash
    pnpm dev
    ```
7.  **(Optional) Run Capture Agent**:
    If developing agent-related features:
    ```bash
    cd agents/capture-agent-py
    ./run.sh # or run.bat
    ```

### Detailed Setup Guide

#### Prerequisites

Before you begin, make sure you have the following tools installed:

- **Node.js**: v18+ (LTS recommended).
- **pnpm**: This project uses `pnpm` for package management. If you don't have it, install it globally:
  ```bash
  npm install -g pnpm
  ```
- **Docker**: The Supabase CLI uses Docker to run the local development environment. [Install Docker](https://docs.docker.com/get-docker/).
- **Supabase CLI**: Required for managing the local Supabase stack. Follow the official installation guide for your OS: [Supabase CLI Docs](https://supabase.com/docs/guides/cli).
- **Python**: v3.11+ is required for the capture agent.
- **mkcert**: A tool for creating trusted local SSL certificates. The capture agent's `run` script will attempt to install this for you if you have Homebrew (macOS) or Chocolatey (Windows) installed.

#### 1. Web App Setup

First, set up the main web application.

1.  **Clone the Repository and Checkout `beta`**:
    All development should be done on the `beta` branch.
    ```bash
    git clone https://github.com/SoundDocs/sounddocs.git
    cd sounddocs
    git checkout beta
    ```
2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
3.  **Start Local Supabase Services**:
    This command uses Docker to start all the necessary backend services (database, auth, etc.).
    ```bash
    supabase start
    ```
4.  **Set Up Environment Variables**:
    After `supabase start` completes, it will output your local credentials (API URL and anon key). Create a new file at `apps/web/.env` and add the credentials to it:
    ```env
    VITE_SUPABASE_URL=http://127.0.0.1:54321
    VITE_SUPABASE_ANON_KEY=your-local-anon-key-from-the-cli
    ```
5.  **Generate SSL Certificate**:
    The Vite development server requires a trusted SSL certificate to run over HTTPS.

    ```bash
    cd agents/capture-agent-py
    python3 generate_cert.py
    cd ../..
    ```

    The script uses `mkcert` and may prompt for your password to install a local Certificate Authority (CA). This is a crucial one-time step.

6.  **Start the Development Server**:
    Now you can start the web app.
    ```bash
    pnpm dev
    ```
    The application will be available at `https://localhost:5173` (or the next available port).

#### 2. (Optional) Capture Agent Development

If you are working on features related to the "AcoustIQ Pro" audio analyzer, you will need to run the Python-based capture agent locally. The HTTPS dev server is a prerequisite for the secure WebSocket (`wss://`) connection the agent uses.

1.  **Navigate to the Agent Directory**:
    In a **new terminal window** (leaving the web app server running), go to the agent's directory:
    ```bash
    cd agents/capture-agent-py
    ```
2.  **Run the Agent**:
    The `run` script handles installing dependencies and starting the agent.

    - **macOS/Linux**: `./run.sh`
    - **Windows**: `run.bat`

    The agent will now be running and can communicate with the web app.

_This section has been moved and integrated into the main setup guide._

## 🌐 Self-Hosting

To self-host SoundDocs, you will need a remote Supabase project.

1.  **Clone the Repository and Install Dependencies**:
    Follow steps 1 and 2 from the "Web App Setup" section.
2.  **Create a Supabase Project**:
    Go to [Supabase](https://supabase.com/) and create a new project.
3.  **Set Up Environment Variables**:
    Create a file at `apps/web/.env` and add your remote Supabase project's credentials:
    ```env
    VITE_SUPABASE_URL=your-supabase-project-url (looks like https://(projecturl).supabase.co)
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```
    You can find these in your Supabase project's API settings.
4.  **Apply Database Migrations**:
    In your Supabase project dashboard, go to the "SQL Editor" and run the contents of the migration files located in the `/supabase/migrations` directory in chronological order.
5.  **Build and Deploy**:
    Build the application and deploy the contents of the `apps/web/dist` folder to your preferred hosting provider (e.g., Vercel, Netlify, AWS S3).
    ```bash
    pnpm build
    ```

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, feature enhancements, or documentation improvements, your help is appreciated.

Please review our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

Join our [Discord server](https://discord.com/invite/NRcRtyxFQa) to discuss ideas and collaborate with the community.

## 📄 License

This project is distributed under the GNU AGPLv3 License. See `LICENSE` file for more information.

## 🙏 Acknowledgements

- **Supabase Team** for their incredible backend-as-a-service platform.
- **Lucide Icons** for the clean and versatile icon set.
- **React Draggable & React Resizable** for interactive UI elements.
- **html2canvas** for the client-side export functionality.
- The open-source community for tools and libraries that make projects like SoundDocs possible.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SoundDocs/sounddocs&type=Date)](https://star-history.com/#SoundDocs/sounddocs&Date)
