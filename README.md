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

-   **📝 Patch Sheet Editor:**
    Design detailed input/output lists, map signal flows, specify equipment, and add critical technical notes. Perfect for FOH, monitors, and broadcast.
-   **🎨 Stage Plot Designer:**
    Visually construct stage layouts using a library of draggable elements including instruments, microphones, monitors, DI boxes, and risers. Clearly communicate stage needs.
-   **🗓️ Run of Show Creator (with Show Mode):**
    Develop detailed event timelines, cue sheets, and segment breakdowns. Utilize the "Show Mode" for real-time event tracking and execution.
-   **📊 Production Schedule Manager:**
    Organize and track all pre-production, setup, rehearsal, show, and strike activities. Ensure your entire team is aligned.
-   **🚀 Smart Export System:**
    Generate professional, high-quality PDF exports of your documents. Choose between dark or light mode to suit your presentation needs.
-   **🤝 Collaboration Tools:**
    Share your documents securely via unique links. Facilitate smooth communication with clients, band members, and technical crew.

## 🛠️ Tech Stack

### Frontend
-   **Framework**: React 18 with TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **State Management**: React Context API / Zustand (for more complex states)
-   **Routing**: React Router 6
-   **Exporting**: `html2canvas` for image generation

### Backend
-   **Authentication**: Supabase Auth
-   **Database**: Supabase (PostgreSQL)
-   **Real-time Features**: Supabase Realtime
-   **Storage**: Supabase Storage (for user uploads, templates)

## 🚀 Get Started / Self-Host

### Prerequisites
-   Node.js v18+ (LTS recommended)
-   A Supabase account (the free tier is sufficient to get started)

### Installation & Setup
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/SoundDocs/sounddocs.git
    cd sounddocs
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:**
    Create a `.env` file in the project root and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your-supabase-project-url
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```
    *You can find these in your Supabase project settings.*
4.  **Database Migrations:**
    Apply the necessary database schema. Navigate to the Supabase SQL Editor in your project dashboard and run the migration files located in `/supabase/migrations`.
5.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the next available port).

## 📖 How to Use SoundDocs

1.  **Navigate** to the live application (e.g., `http://localhost:5173` if running locally, or https://sounddocs.org).
2.  **Create an Account / Sign In** using email and password.
3.  **Choose Document Type:** Click New "Patch Sheet", "Stage Plot", "Run of Show", or "Production Schedule".
4.  **Build Your Setup:**
    -   **Patch Sheets:** Add channels, assign inputs/outputs, specify microphones, DIs, processing, and notes.
    -   **Stage Plots:** Drag and drop elements onto the canvas. Label items, indicate positions, and specify connections.
    -   **Run of Shows:** Define event segments, cues, timings, and responsible personnel. Use Show Mode during the event.
    -   **Production Schedules:** Outline tasks, deadlines, and assignees for all event phases.
5.  **Save & Export:** Your work is auto-saved. When ready, export your document as a PDF, or generate a shareable link.

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, feature enhancements, or documentation improvements, your help is appreciated.

Please review our [Contributing Guidelines](CONTRIBUTING.md) (to be created) and Code of Conduct before submitting a pull request. Join our Discord server to discuss ideas and collaborate: [discord.gg/hVk6tctuHM](https://discord.com/invite/NRcRtyxFQa)

### Local Development

Getting set up for local development is currently a tad convoluted. There's an issue to make it better.

Assuming you're on a Mac:

- Install either Docker Desktop or OrbStack if you don't have it already
- Install Homebrew (https://brew.sh/) if you don't have it already
- Install nvm (brew install nvm) if you don't have it already
- Install Node.js LTS Iron (nvm install --lts=iron)
- Clone the codebase (git clone https://github.com/SoundDocs/sounddocs.git)
- cd into that directory
- Ensure you're using Node.js LTS Iron (nvm use --lts=iron)
- Run npm install
- Start Supabase locally using npm run local-db
- Start the app locally using npm run dev

## 📄 License

This project is distributed under the GNU AGPLv3 License. See `LICENSE` file for more information.

## 🙏 Acknowledgements

-   **Supabase Team** for their incredible backend-as-a-service platform.
-   **Lucide Icons** for the clean and versatile icon set.
-   **React Draggable & React Resizable** for interactive UI elements.
-   **html2canvas** for the client-side export functionality.
-   The open-source community for tools and libraries that make projects like SoundDocs possible.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=SoundDocs/sounddocs&type=Date)](https://star-history.com/#SoundDocs/sounddocs&Date)
