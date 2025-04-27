# SoundDocs 🎛️

**Professional Audio Documentation Made Simple**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)

SoundDocs is a modern web application designed for audio engineers to create professional technical documentation for live events. Create detailed patch lists, design stage plots, and share your setups with venues and production teams effortlessly.

![Hero Preview](https://via.placeholder.com/800x400.png?text=SoundDocs+Demo) *Add screenshot later*

## ✨ Features

### Core Functionality
- **Patch Sheet Editor**  
  Document input/output lists, signal flow, equipment specs, and technical notes
- **Stage Plot Designer**  
  Create visual stage layouts with draggable elements (instruments, mics, monitors)
- **Smart Export System**  
  Generate high-quality PNG/PDF exports with dark/light mode options
- **Collaboration Tools**  
  Share documents via secure links with clients and crew

### Professional Features
- Customizable templates for different venue sizes
- Auto-save functionality with version history
- Equipment database with common audio gear presets
- Print-friendly formatting for on-site use
- Responsive design for mobile field use

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + CSS Modules
- **Icons**: Lucide React
- **State Management**: React Context API
- **Routing**: React Router 6
- **PDF/Image Export**: html2canvas

### Backend
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Real-time Updates**: Supabase Realtime
- **Storage**: Supabase Storage

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- Supabase account (free tier works)

### Installation
1. Clone the repository:
   git clone https://github.com/cj-vana/sounddocs.git
   cd sounddocs
2. Install Dependancies
   npm install
3. Set up environment variables in your .env file:
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-key
4. Start the development server:
   npm run dev

## 📖 Usage

- Create Account
- Sign up using email
- New Document
- Choose between Patch Sheet or Stage Plot
- Build Your Setup
- Patch Sheets: Add inputs, outputs, and technical specs
- Stage Plots: Drag-and-drop elements on stage canvas
- Export & Share
- Download as PNG/PDF or generate shareable link

## 🤝 Contributing

We welcome any and all contributions!

## 📄 License

Distributed under the MIT License.

## 🙏 Acknowledgements

Supabase for backend services
Lucide for beautiful icons
React Draggable for stage elements
html2canvas for export functionality
