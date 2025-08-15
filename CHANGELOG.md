# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.6] - 2025-08-15

### Improved

- **Agent Installer**: Reworked the `run.sh` and `run.bat` scripts into standalone installers. They now automatically download the latest agent source code and dependencies into a local `~/.sounddocs-agent` directory, so users no longer need to download the entire project repository.
- **Setup Instructions**: Significantly clarified the agent setup instructions in both the UI and the README to guide users through the download and execution process.

### Fixed

- **Agent Runner Script**: Fixed a bug where the agent runner script would fail if not executed from the correct directory.

## [1.3.5] - 2025-08-15

### Improved

- **RTA Headroom**: Adjusted the default vertical scale of the RTA visualizer to -60dB to +20dB.
- **RTA Controls**: Replaced interactive pan-and-zoom controls with input fields in the settings panel for precise control over the dB and frequency view range.

### Fixed

- **SPL Meter Layout**: Reduced the font size of the SPL and Leq readouts to prevent the layout from breaking when displaying triple-digit values.

## [1.3.4] - 2025-08-15

### Added

- **Python Capture Agent (MVP)**: Created the initial version of the local capture agent (`agents/capture-agent-py`) to enable professional, multi-channel audio analysis.
  - Implemented a WebSocket server (`localhost:9469`) to stream analysis data to the web UI.
  - Integrated `sounddevice` for cross-platform audio device discovery and capturing.
  - Added core DSP logic using `numpy` and `scipy` for dual-channel Transfer Function (TF), coherence, and SPL calculations.
  - Established a secure communication protocol with origin validation for `sounddocs.org`.

### Improved

- **Analyzer Page Layout**: Reworked the analyzer section into a multi-page workflow. The main `/analyzer` page now serves as a hub with navigation cards leading to separate pages for "Analyzer Lite" and "Analyzer Pro" modes.
- **Agent Download Flow**: The new "Analyzer Pro" page contains a dedicated section for downloading the Python Capture Agent, with clear instructions for macOS/Linux and Windows.

### Fixed

- **Navigation**: Corrected the "AcoustIQ" link in the dashboard header to point to the new `/analyzer` hub page, resolving a 404 error.
- **Agent Download Links**: All download links on the Analyzer Pro page now open in a new tab to prevent users from navigating away from the application.
- **Standardized A-Weighting**: All SPL and Leq measurements are now standardized to use A-weighting for accuracy and consistency. The RTA's weighting remains a user-configurable option.
- **Calibration Reset**: Added a "Reset" button to the calibration panel, allowing users to easily clear the SPL offset.
- **CSV Export**: The exported CSV file for Leq measurements now correctly specifies "LEQ (A)" in the header to reflect the A-weighting.

### Fixed

- **Unweighted SPL/Leq**: Corrected an issue where SPL and Leq measurements were being calculated without A-weighting, regardless of the user's setting.

### Removed

- **Redundant Info Panel**: Removed the "About the Analyzer" and "Coming Soon" sections from the analyzer page, as this information is now integrated into the new card-based layout.

## [1.3.3.2] - 2025-08-15

### Fixed

- **Site Branding**: Corrected the application's browser tab title to consistently display "SoundDocs" instead of "Resources" across all pages.

## [1.3.3.1] - 2025-08-15

### Fixed

- **Build Failure**: Added `lucide-react` as a direct dependency to the `@sounddocs/analyzer-lite` package to resolve build failures in isolated environments like Netlify.

## [1.3.3] - 2025-08-15

### Added

- **AcoustIQ Audio Analyzer Page**: Created a new top-level page for the audio analyzer, branded as "AcoustIQ", accessible directly from the main dashboard header for improved visibility and user access.
- **Professional Calibration Workflow**: Replaced the manual offset input with a two-button system (94/114 dB) for a faster, more intuitive, and less error-prone calibration process that matches the workflow of professional audio software.

### Improved

- **SPL Meter Readability**: The SPL meter display now updates at a slower, more consistent rate (every 250ms) for a more stable and less "jumpy" reading.
- **CSV Data Export**: LEQ measurement CSV downloads are now filtered to only include data from the most recent logging session, providing more focused and useful exports.

### Fixed

- **Live Calibration Updates**: Fixed a critical bug where changes to the calibration offset were not being applied in real-time, ensuring that calibration adjustments are now reflected instantly.
- **Stale LEQ Logging**: Resolved an issue where the same LEQ value was being logged repeatedly by implementing a `useRef` to ensure the logging function always has access to the latest data.

### Removed

- **Temporary Debug Panel**: Removed the temporary debug panel from the Audio Analyzer UI for a cleaner and more professional user experience.

## [1.3.2] - 2025-8-14

### Added

- **Monorepo Architecture**: Transitioned to pnpm workspace-based monorepo structure
  - Created workspace packages: `apps/web`, `packages/analyzer-protocol`, `agents/capture-agent-*`, `models/eqalign`
  - Established foundation for AI-powered audio analyzer feature development
  - Added shared TypeScript protocol definitions for browser-to-agent communication
- **Cross-Origin Isolation**: Implemented Cross-Origin-Opener-Policy (COOP) and Cross-Origin-Embedder-Policy (COEP) headers
  - Enables SharedArrayBuffer support for high-performance audio processing
  - Required for browser-based real-time DSP and WebAssembly threading
  - Added headers to both development server and production deployment configuration
- **Analyzer Protocol Package**: Created `@sounddocs/analyzer-protocol` for shared type definitions
  - WebSocket message schemas for device communication
  - Transfer function (TF) data structures for dual-channel measurements
  - SPL/Leq measurement interfaces
  - Device discovery and capture configuration types

### Changed

- **Project Structure**: Reorganized codebase into monorepo workspace layout
  - Moved existing SoundDocs web app to `apps/web/`
  - Separated shared packages under `packages/`
  - Reserved directories for capture agents (`agents/`) and ML models (`models/`)
  - Updated build and development scripts for workspace management

### Technical Details

- **Workspace Configuration**:
  - Added `pnpm-workspace.yaml` with workspace package definitions
  - Updated root `package.json` with workspace references and multi-package scripts
  - Configured TypeScript project references for cross-package type checking
- **Cross-Origin Headers**:
  - Development: Added COOP/COEP headers to Vite dev server configuration
  - Production: Created `public/_headers` file for Netlify/Vercel deployment
  - Headers enable SharedArrayBuffer and WASM threading for audio processing
- **Package Structure**:
  - `apps/web/`: Main SoundDocs React application with existing features
  - `packages/analyzer-protocol/`: Shared TypeScript definitions for analyzer communication
  - Future packages: `packages/analyzer-lite/` (browser-only analyzer), `agents/capture-agent-py/` (Python audio capture)
- **Path Aliases**: Added `@/*` alias mapping to `src/*` for cleaner imports across the monorepo

## [1.3.1] - 2025-8-11

### Added

- **Default Column Colors**: Extended column color functionality to work with built-in/default columns
  - Color picker buttons now appear on all column headers (not just custom columns)
  - Default column colors stored in `default_column_colors` property in run of show data
  - Color picker modal automatically detects custom vs default columns
  - Consistent color application across all column types
- **Section Header Auto-Timing**: Extended automatic time calculation to include section headers
  - Section headers now automatically receive start times based on the previous cue's end time
  - When a cue's start time and duration are updated, all following section headers are updated
  - Multiple consecutive section headers receive the same calculated start time
  - Improves workflow efficiency for shows with multiple section breaks

### Improved

- **Enhanced Color Palette**: Updated color picker with more distinct and vibrant colors
  - Replaced muted colors with high-contrast, easily distinguishable options
  - Better accessibility with more distinct color differences
  - Professional color names: Electric Blue, Forest Green, Golden Yellow, Crimson Red, etc.
  - Improved visual separation for complex run of show documents

### Fixed

- **Column Color Persistence**: Fixed issue where default column colors were not being saved to database
  - Added `default_column_colors` to save payload in `handleSave` function
  - Default column colors now properly persist across browser sessions
  - Column colors for both custom and default columns are now fully functional
- **Database Schema**: Added missing `default_column_colors` column to `run_of_shows` table
  - Created migration `20250811120000_add_default_column_colors_to_run_of_shows.sql`
  - Added JSONB column with default empty object `{}`
  - Resolves "Could not find the 'default_column_colors' column" error
- **Show Mode Column Colors**: Added column color display support to show mode viewers
  - Updated ShowModePage.tsx and SharedShowModePage.tsx to display column colors
  - Column colors now visible in both user's show mode and shared view-only mode
  - Added type definitions for `highlightColor` in default column interfaces
  - Updated `FullRunOfShowData` and `SharedRunOfShowData` interfaces
- **Export Column Colors**: Added column color support to PDF exports
  - Updated RunOfShowExport.tsx (color export) to display column colors
  - Column colors apply to both section headers and regular rows
  - Row highlight colors take priority over column colors in exports
  - Updated interface definitions in AllRunOfShows.tsx and ProductionPage.tsx
  - Fixed data fetching in AllRunOfShows and ProductionPage to include `default_column_colors` when exporting
  - Fixed custom column data lookup - now correctly uses `col.id` instead of `col.name` for data retrieval
  - Custom column colors now properly display in color exports
- **Color Priority Logic**: Ensured row colors take precedence over column colors
  - Current/next cue highlights now properly override column colors in show mode
  - Row highlight colors override column colors in editor
  - Column colors still apply to section headers as intended
  - Improved visual hierarchy for better user experience

### Technical Details

- **RunOfShowEditor.tsx**:
  - Updated `PREDEFINED_HIGHLIGHT_COLORS` array with high-contrast color values
  - Enhanced color differentiation: Electric Blue (#0066FF), Forest Green (#00AA44), Golden Yellow (#FFB300)
  - Improved accessibility with more distinct hue separation
  - Maintained consistent color picker grid layout and functionality
  - Added color priority logic: row highlights override column colors when both are present
  - Column colors apply to section headers and non-highlighted rows
- **ShowModePage.tsx** and **SharedShowModePage.tsx**:
  - Added column color display support with `highlightColor` property mapping
  - Added color priority logic: current/next cue highlights override column colors
  - Updated type definitions to include `highlightColor` in default column interfaces
  - Column colors display on regular rows and section headers, hidden on current/next cues
- **Export Components** - **RunOfShowExport.tsx**:
  - Added column color support with `highlightColor` property mapping from both default and custom columns
  - Updated column mapping to include colors from `schedule.default_column_colors` and `custom_column_definitions`
  - Added color priority logic: row highlights override column colors in exported documents
  - Column colors apply to section headers and non-highlighted rows in color exports
  - Fixed custom column key mapping: uses `col.id` for data retrieval, `col.name` for labels
- **Interface Updates** - **AllRunOfShows.tsx** and **ProductionPage.tsx**:
  - Added `default_column_colors?: Record<string, string>` to `FullRunOfShowData` interface
  - Ensures type compatibility across all components using run of show data
  - Fixed import of `DetailedScheduleItem` from correct location in ProductionPage
  - Removed unused `letterRendering` option from html2canvas configuration

## [1.3.0] - 2025-8-11

### Added

- **Sticky Headers**: Implemented sticky column headers for Run of Show editor and show mode views
  - Column headers (Time, Name, Controls, etc.) now remain fixed at the top when scrolling
  - Section headers remain visible but scroll away when new section headers appear
  - Applied to RunOfShowEditor, ShowModePage, and SharedShowModePage
- **Auto-Scrolling in Show Mode**: Added automatic scrolling to follow current and next cues
  - ShowModePage now automatically scrolls to keep current cue visible
  - SharedShowModePage follows real-time updates with smooth scrolling
  - Accounts for sticky header height with proper padding
- **Automatic Time Calculation**: Added smart time calculation for sequential cues and section headers
  - When a cue's start time and duration are set, the next cue's start time is automatically calculated
  - Works with various time formats (HH:MM:SS, MM:SS) and duration formats (MM:SS, SS)
  - Now updates both section headers and regular items following the current cue
  - Section headers automatically get their start time from the previous cue's end time
  - Streamlines the cue timing process for faster show programming
- **Column Color Highlighting**: Added ability to apply colors to entire columns
  - Color picker button added to custom column headers (Palette icon)
  - Column colors apply to all cells in that column (both regular items and section headers)
  - Same color palette as row highlighting for consistency
  - Column colors work alongside existing row highlighting

### Fixed

- **Header Visibility**: Made column headers fully opaque to prevent content bleeding through
- **Section Header Gaps**: Eliminated gaps between column headers and section headers by removing table dividers and adjusting positioning
- **Section Header Opacity**: Made section headers fully opaque (changed from `bg-gray-700/70` to `bg-gray-700`)
- **Show Mode Headers**: Made column headers in show mode pages fully opaque (removed backdrop-blur)
- **TypeScript Errors**: Resolved all linting errors related to column definitions and type safety
- **Import Cleanup**: Removed unused imports (ResourceType, useCallback, ExternalLink)

### Changed

- **Table Layout**: Modified table containers to support sticky positioning with proper z-index layering
- **Scroll Behavior**: Added maximum height constraints for proper scrolling within viewport
- **Header Styling**: Updated header backgrounds for better visual hierarchy

### Technical Details

- **RunOfShowEditor.tsx**:
  - Column headers: `sticky top-0 z-20` with `bg-gray-700` (fully opaque)
  - Section headers: `sticky top-[49px] z-10` with `bg-gray-700` (seamless connection)
  - Removed `divide-y divide-gray-700` from table to eliminate gaps
  - Container: `max-h-[calc(100vh-300px)]` for proper scrolling
  - Time calculation utilities: `parseTimeToSeconds`, `parseDurationToSeconds`, `formatSecondsToTime`
  - Auto-calculation triggered on `startTime` or `duration` field changes
  - Enhanced `calculateNextCueTime` function now updates both section headers and regular items
  - Iterates through following items to update all consecutive section headers, then the next regular item
  - Column color support: Added `highlightColor` to `CustomColumnDefinition` interface
  - Default column colors: Added `default_column_colors` to `RunOfShowData` interface
  - Column color picker modal with shared color selection logic for both custom and default columns
  - Column color rendering applied to both item rows and section header cells
  - Universal color picker buttons on all column headers (custom and default)
- **ShowModePage.tsx**:
  - Column headers: `sticky top-0 z-20` with `bg-gray-700` (fully opaque, removed backdrop-blur)
  - Section headers: `sticky top-[49px] z-10` with `bg-gray-700` (seamless connection)
  - Removed `divide-y divide-gray-700` from table to eliminate gaps
  - Added `tableContainerRef` for scroll container reference
  - Auto-scroll logic triggers on `currentItemIndex` changes with 49px header height
  - Smooth scrolling with 20px padding from header
- **SharedShowModePage.tsx**:
  - Column headers: `sticky top-0 z-20` with `bg-gray-700` (fully opaque, removed backdrop-blur)
  - Section headers: `sticky top-[49px] z-10` with `bg-gray-700` (seamless connection)
  - Removed `divide-y divide-gray-700` from table to eliminate gaps
  - Auto-scroll follows `sharedData.live_show_data.currentItemIndex` changes with 49px header height
  - Real-time scrolling for shared view-only mode
