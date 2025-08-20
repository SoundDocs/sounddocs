# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.3] - 2025-01-17

### Added

- **Professional Installer Distribution**: Created automated build system for distributing the capture agent as proper installers instead of shell scripts.
  - **macOS .pkg Installer**: Native macOS package installer that installs to `/Applications/SoundDocs/` with automatic dependency management.
  - **Windows .exe Installer**: NSIS-based Windows installer with Start Menu shortcuts, desktop shortcuts, and dependency setup.
  - **GitHub Actions Workflow**: Automated CI/CD pipeline that builds both installers on release creation and uploads them as release assets.
- **Automated Dependency Management**: Installers automatically handle Python, mkcert, and SSL certificate setup without manual user intervention.
- **Enhanced Download Experience**: Updated download interface to use professional installers from GitHub releases instead of raw shell scripts.

### Changed

- **AgentDownload Component**: Updated to download `.pkg` and `.exe` installers from GitHub releases instead of raw scripts.
- **Installation Instructions**: Replaced terminal-based setup instructions with GUI installer guidance.
- **Distribution Method**: Moved from manual script downloads to automated release-based distribution.

### Fixed

- **GitHub Actions Permissions**: Added proper `contents: write` and `id-token: write` permissions for release asset uploads.
- **Artifact Upload Paths**: Fixed artifact directory structure for GitHub Actions v4 compatibility.
- **NSIS Syntax Issues**: Resolved PowerShell command quoting issues in Windows installer by using helper batch files.
- **Deprecated Actions**: Updated all GitHub Actions to latest versions (upload-artifact@v4, download-artifact@v4, setup-python@v5, action-gh-release@v2).

## [1.5.2.3] - 2025-08-19

### Added

- **Coherence-Based Transparency**: Magnitude and phase traces are now shaded based on coherence.
  - Traces are fully opaque when coherence is >= 0.9.
  - Traces are fully transparent when coherence is < 0.5.
  - A smooth alpha gradient is applied for coherence values between 0.5 and 0.9.
- **Consistent Styling**: The coherence-based transparency is applied to both live and saved measurements in the main analyzer view and the chart detail modal.

## [1.5.2.2] - 2025-08-19

### Added

- **AI-Powered System Alignment**: Added a new feature to the chart detail modal to calculate the precise time delay required to align two sound systems (e.g., mains and delays).
- **Haas Effect Logic**: The alignment calculation now ensures the front/closer system arrives 2ms before the rear/farther system to create a correct psychoacoustic localization effect.
- **Alignment UI**: Implemented a new UI panel for the alignment feature with a dropdown to select the type of systems being aligned and dedicated dropdowns to select the exact measurements for each system, improving clarity and ease of use.

### Changed

- **Database Schema**: Added a `capture_delay_ms` column to the `tf_measurements` table to store the frozen delay value at the moment of capture, which is essential for accurate time alignment calculations.
- **Supabase Edge Function**: Created a new `ai-align-systems` serverless function to handle the complex cross-correlation and delay calculation on the backend.

### Fixed

- **Measurement Data Fetching**: Fixed a bug where the app was not fetching the `capture_delay_ms` for saved measurements, which prevented the alignment feature from working.

## [1.5.2.1] - 2025-08-19

### Added

- **EQ Feature**: Added a comprehensive EQ feature to the chart detail modal, allowing users to apply parametric EQs and manufacturer-specific macros to their measurements.
- **"Show Original" Trace**: Added a toggle to the EQ controls to display the original, unequalized trace alongside the EQ'd version for easy comparison.
- **HPF/LPF Filters**: Added High-Pass and Low-Pass filters to the parametric EQ, with selectable slopes of 12, 24, and 48 dB/octave.

### Changed

- **Privacy Policy and Terms of Service**: Updated the Privacy Policy and Terms of Service to include a clause about using anonymized trace data for AI/ML model training.

### Fixed

- **EQ Controls UI**: Corrected the UI for HPF/LPF filters to hide the irrelevant "Gain" control.
- **"Add Filter" Dropdown**: The "Add Filter" dropdown now dynamically repositions itself to avoid going off-screen.
- **EQ Curve Rendering**: Corrected the biquad filter math to ensure accurate rendering of all EQ curves.
- **HP/LP Slope Logic**: Corrected the slope logic for HPF/LPF filters to correctly cascade biquad sections.

## [1.5.2.0.1] - 2025-08-17

### Added

- **Gain and Delay Controls**: Added gain and delay controls to the chart detail modal for each measurement.

### Fixed

- **Phase Wrapping**: Corrected the phase wrapping logic to handle both positive and negative phase values correctly.
- **Impulse Response Visibility**: Ensured the impulse response chart for saved traces is always visible, even when there is no live data.
- **Chart Modal Opening**: The chart modal now opens to the correct chart when a user clicks on it from the Analyzer Pro page.
- **Impulse Response Y-Axis**: Fixed the y-axis of the impulse response graph on the chart modal to be locked between -1 and 1.
- **Delay Control for Impulse Response**: The delay control now correctly affects the impulse response graph on the chart modal.

## [1.5.2] - 2025-08-17

### Added

- **Analyzer Pro Save/Recall**: Implemented the ability to save and recall transfer function measurements.
- **Interactive Chart Modal**: Created a full-screen modal for detailed chart analysis, with controls for trace visibility and dB scaling.
- **Customizable Trace Colors**: Added a color palette to assign unique colors to each saved measurement for better visual distinction.

### Fixed

- **Impulse Response Chart**: Corrected multiple issues with the impulse response chart to ensure it displays accurately.
- **Chart Labeling**: Improved chart labeling for clarity and readability.

## [1.5.1.1.1] - 2025-08-17

### Added

- **Analyzer Page**: Added a development warning popup to the analyzer page to inform users that the AcoustIQ feature is under active development.

## [1.5.1.1.0.5] - 2025-08-16

### Fixed

- **Analyzer Pro**: Fixed a bug where the "Freeze Delay" button would become unresponsive. The `isCapturing` state is now managed by the parent `AnalyzerProPage` component, ensuring the button's state is always in sync with the server.

## [1.5.1.1.0.4] - 2025-08-16

### Fixed

- **Analyzer Pro**: Fixed a regression where the "Freeze Delay" button was unresponsive. The UI now correctly sends the `appliedDelayMs` to the agent and immediately updates its state upon receiving the `delay_status` acknowledgment, ensuring a responsive user experience.
- **Capture Agent**: The agent now correctly uses the `applied_ms` value sent from the client when freezing the delay.
- **Protocol**: Added the `DelayStatusMessage` to the `AgentMessage` type definition to resolve TypeScript errors.

## [1.5.1.1.0.3] - 2025-08-16

### Fixed

- **Analyzer Pro**: The "delay finder keeps updating" issue is resolved by ensuring the UI consistently displays the applied delay value from the backend, trusting the backend's `delayMode` as the single source of truth, and removing local frontend state that could cause drift.
- **Capture Agent**: The agent now sends the applied, latched delay value in every frame to prevent the UI from showing intermediate raw values.
- **DSP**: Hardened the delay freeze logic by mirroring the frozen value into the EMA state, ensuring consistency across all internal metrics.

## [1.5.1.1.0.2] - 2025-08-16

### Fixed

- **Analyzer Pro**: Fixed a bug where the "Freeze Delay" button would not correctly lock the current delay value.
- **Analyzer Pro**: Corrected the argument order in the `csd` function call to fix the phase drift issue.

## [1.5.1.1.0.1] - 2025-08-16

### Fixed

- **Analyzer Pro**: Fixed a bug where the "Freeze Delay" button would not correctly lock the current delay value.

## [1.5.1.1] - 2025-08-16

### Added

- **Analyzer Pro**: Adds a "Freeze Delay" button to the Pro settings to lock the current delay value.

## [1.5.1.0.1] - 2025-08-16

### Changed

- **Delay Finder**: Increased the default maximum delay fallback from 300ms to 500ms to improve accuracy in larger spaces.

## [1.5.1] - 2025-08-16

### Changed

- **Magnitude and Phase Graphs**: The y-axis on the magnitude graph is now fixed to a range of -20 to +20, and the y-axis on the phase graph is fixed to a range of -180 to +180.
- **X-Axis Formatting**: The x-axis on the magnitude, phase, and coherence graphs is now displayed in Hz until 1kHz, with labels between 500Hz and 1kHz removed to prevent overlapping.
- **Branding**: Rebranded the Analyzer pages to "AcoustIQ".

## [1.5.0.0.9] - 2025-08-16

### Fixed

- **Impulse Response Calculation**: Replaced the flawed impulse response calculation with a robust method that correctly handles fractional delay, DC/Nyquist components, and band-edge tapering. This ensures a sharp, accurate impulse response that correctly reflects the system's behavior.

## [1.5.0.0.8] - 2025-08-16

### Changed

- **Impulse Response Graph**: The impulse response graph's y-axis is now fixed to a range of -1 to +1.

### Fixed

- **Impulse Response Calculation**: Fixed a bug where the impulse response was being calculated on the aligned signals, which is incorrect. The calculation is now performed on the original signals and the delay is applied to the impulse response itself, ensuring the graph displays correctly.

## [1.5.0.0.7] - 2025-08-16

### Changed

- **Impulse Response Graph**: The impulse response graph now displays a range of -8ms to +8ms, providing a more focused view of the impulse.

## [1.5.0.0.6] - 2025-08-16

### Added

- **Impulse Response Graph**: Added a new impulse response graph to the Analyzer Pro page. This graph is displayed between the phase response and coherence graphs, providing a more complete analysis of the audio system.
- **Impulse Response Calculation**: Implemented the impulse response calculation in the capture agent's DSP script. The agent now computes and transmits the impulse response data to the web app, making the graph fully functional.

## [1.5.0.0.5] - 2025-08-15

### Added

- **Freeze Delay**: Added a "Freeze Delay" feature to the capture agent. This allows users to lock the delay finder's current measurement, enabling them to see how physical changes in their system affect the phase response in real-time without the agent automatically re-aligning the signals. A manual delay entry mode was also added for precise control.

## [1.5.0.0.4] - 2025-08-15

### Fixed

- **Measurement Stability at High Delay**: Fixed an issue where magnitude, phase, and coherence plots would become noisy and erratic at high delay times. The DSP logic now analyzes only the valid, overlapping portion of the signal, ignoring zero-padded regions. It also dynamically adjusts the FFT size to ensure a minimum number of spectral averages, and the delay estimate is smoothed over time to reduce jitter.

## [1.5.0.0.3] - 2025-08-15

### Fixed

- **Agent Crash on High Delay**: Resolved a critical crash in the Python agent that occurred during signal analysis with high delay times (>85 ms). The alignment logic now uses zero-padding instead of trimming to preserve buffer length, and the analysis buffer size has been increased to ensure stable spectral measurements even with large delays.

## [1.5.0.0.2] - 2025-08-15

### Fixed

- **Agent Crash**: Fixed a bug where the agent would crash due to a missing `reset_dsp_state` function.

## [1.5.0.0.1] - 2025-08-15

### Fixed

- **Delay Finder Algorithm**: Replaced the circular GCC-PHAT with a linear GCC-PHAT algorithm. This correctly handles delays greater than 85ms and provides a much larger and more useful delay measurement range.

## [1.4.9.8.1] - 2025-08-15

### Fixed

- **Coherence Calculation**: Reworked the entire DSP chain to provide a more robust and accurate measurement. This includes applying the found delay to the measurement signal _before_ spectral analysis, and using consistent, overlapping segments for all spectral calculations. This will provide a more accurate and stable coherence measurement, especially at high delay times.
- **Buffer Overflows**: Decoupled the audio capture from the DSP by implementing a producer-consumer pattern. This prevents the audio buffer from overflowing and ensures that the DSP has clean, uncorrupted data to work with.

## [1.4.9.8] - 2025-08-15

### Fixed

- **Coherence Calculation**: Replaced the manual coherence calculation with a more robust version that uses consistent, overlapping segments for the spectral density calculations. This will provide a more accurate and stable coherence measurement.

## [1.4.9.7.1] - 2025-08-15

### Fixed

- **Coherence Calculation**: Replaced the manual coherence calculation with a more robust version that uses consistent, overlapping segments for the spectral density calculations. This will provide a more accurate and stable coherence measurement.

## [1.4.9.7] - 2025-08-15

### Fixed

- **Coherence Calculation**: Replaced the manual coherence calculation with `scipy.signal.coherence` to provide a more robust and accurate measurement. This also simplifies the DSP code by removing the need for manual averaging.

## [1.4.9.6] - 2025-08-15

### Fixed

- **Coherence Stability**: Fixed a bug where the spectral averaging buffers were not being reset between captures, causing stale data to corrupt the coherence measurement. The averaging depth has also been increased to provide a smoother, more reliable result.

## [1.4.9.5] - 2025-08-15

### Improved

- **Coherence Calculation**: Reworked the coherence calculation in the Python agent to average the power spectra before division, resulting in a more accurate and stable measurement, mirroring the method used in Open Sound Meter.

## [1.4.9.4] - 2025-08-15

### Improved

- **Simplified Analyzer**: Removed the Average Type, Transform Mode, and Window Function controls from the UI and backend to streamline the user experience and focus on core functionality.

## [1.4.9.3] - 2025-08-15

### Fixed

- **Delay Finder Range**: Increased the audio capture buffer size to 32,768 samples to ensure the delay finder has enough data to accurately measure delays up to ~340ms.

## [1.4.9.2] - 2025-08-15

### Fixed

- **Delay Finder Range**: Increased the delay finder's cross-correlation window size to 32,768 samples, extending the maximum measurable delay to ~340ms to support large-scale audio systems.

## [1.4.9.1] - 2025-08-15

### Fixed

- **Coherence Calculation**: Fixed a `RuntimeWarning` in the Python agent that occurred during coherence calculation when both signals had no energy. The calculation is now wrapped in a safe division block to prevent divide-by-zero errors.

## [1.4.9] - 2025-08-15

### Fixed

- **Delay Finder Accuracy**: Improved the delay finder's accuracy at high delay times by increasing the cross-correlation window size to 8192 samples.

### Improved

- **FIFO Averaging**: Implemented FIFO averaging in the Python agent to match the behavior of Open Sound Meter.
- **Simplified Averaging**: Removed the LPF averaging option from the UI and backend to simplify the user experience and align with the new FIFO implementation.

## [1.4.8] - 2025-08-15

### Fixed

- **Delay Finder Algorithm**: Updated the Python agent's `compute_metrics` function with a more robust implementation that correctly handles windowing and signal length, resolving failures at higher delay times.

### Improved

- **Analyzer Settings UI**: Reworked the "Pro Mode Settings" UI to align with professional audio software like Open Sound Meter.
  - Renamed "LPF type" to "Average Type" with "Off", "LPF", and "FIFO" options.
  - Renamed "Average" to "Average Count".
  - Added a new "Transform mode" setting with "Fast" and "Log" options.
- **State Management**: Centralized all analyzer settings into the `analyzerStore` for more consistent and predictable state management.

## [1.4.7] - 2025-08-15

### Improved

- **Professional Settings Panel**: Rebuilt the "Pro Mode Settings" UI to include professional controls inspired by Open Sound Meter, including LPF Mode, LPF Frequency, Averaging Type, and Window Type.
- **Agent DSP Refactor**: Implemented a robust overlap-add buffering strategy in the Python agent to ensure all calculations (TF, Coherence, Delay) are performed on correctly windowed and aligned data blocks, resulting in smooth and stable measurements.
- **LPF Smoothing**: Added a Bessel LPF to the agent's DSP for smoothing the Magnitude, Phase, and Coherence traces.

## [1.4.6] - 2025-08-15

### Fixed

- **Delay Finder Algorithm**: Corrected the cross-power spectrum formula in the delay finder to use the conjugate of the reference signal, not the measurement signal. This resolves a critical bug that caused inaccurate and unstable delay readings.

## [1.4.5] - 2025-08-15

### Improved

- **Delay Finder Accuracy**: Upgraded the agent's delay finder to use parabolic interpolation. This provides sub-sample accuracy, resulting in a much more precise and professional time delay measurement.

## [1.4.4] - 2025-08-15

### Fixed

- **Agent Capture Error**: Resolved a persistent crash in the Python agent caused by incorrect argument passing to the `scipy.signal.welch` function. The DSP logic has been refactored to use `scipy.signal.csd` for cross-spectral density and the correct `welch` signature for auto-spectral density, ensuring stable and accurate transfer function calculations.

## [1.4.3] - 2025-08-15

### Fixed

- **Production Build Failure**: Resolved a critical error where the Netlify deployment would fail. The `vite.config.ts` was attempting to load local SSL certificate files, which are not present in the build environment. The configuration has been updated to only enable HTTPS during local development (`serve` command) and skip it during production builds.

## [1.4.2] - 2025-08-15

### Improved

- **Fully Automated Agent Setup**: Replaced the manual self-signed certificate process with `mkcert`.
  - The `run.sh` and `run.bat` scripts now automatically check for and install `mkcert` using the system's package manager (Homebrew/Chocolatey).
  - The scripts then automatically create a local Certificate Authority (CA) and generate a browser-trusted SSL certificate.
  - This eliminates all browser security warnings and the need for any manual certificate trust steps, providing a seamless one-click setup for users.
- **Developer Experience**: Configured the Vite dev server to use the `mkcert`-generated certificate, enabling a fully secure `https://` environment for local development that mirrors production.
- **Documentation**: Updated the `README.md` to reflect the new, simplified, and fully automated setup process.

## [1.4.1] - 2025-08-15

### Fixed

- **Mixed Content Error**: Resolved a browser security error that blocked the web app (`https://`) from connecting to the local capture agent (`ws://`).
  - The Python agent now serves over a secure WebSocket (`wss://`) using a self-signed SSL certificate.
  - The web app now connects to the secure `wss://127.0.0.1:9469` endpoint.
- **Agent Origin Validation**: Fixed an issue where the agent would reject connections from `beta.sounddocs.org`. The beta subdomain has been added to the list of allowed origins.

### Improved

- **Agent Setup**: Automated the generation of the required SSL certificate. The `run.sh` and `run.bat` scripts now automatically create `localhost.pem` and `localhost-key.pem` if they are missing.
- **Documentation**: Added a "First-Time Setup" section to the agent's `README.md` with clear instructions for users on how to trust the self-signed certificate in their browser.

## [1.4] - 2025-08-15

### Added

- **Analyzer Pro Mode UI**: Implemented the user interface for the "Analyzer Pro" page, completing the core functionality of Milestone 3.
  - Added a new `TransferFunctionVisualizer` component to the `@sounddocs/analyzer-lite` package to display magnitude, phase, and coherence data.
  - Created a `ProSettings` component to allow users to select audio devices and configure capture settings (e.g., reference/measurement channels).
  - Integrated the new components into the `AnalyzerProPage`, which now communicates with the local agent to list devices and stream analysis data.

## [1.3.6.3] - 2025-08-15

### Fixed

- **Agent Connection Loop**: Fixed a critical bug causing the web app to repeatedly try to connect to the capture agent in an infinite loop, which led to the agent crashing with a "Too many open files" error.

## [1.3.6.2] - 2025-08-15

### Fixed

- **Agent Installer**: Fixed a critical bug where the installer scripts failed because they did not create a valid Python package structure, causing the `pip install` command to fail.

## [1.3.6.1] - 2025-08-15

### Improved

- **Beta Branch Installer**: Updated the agent installer scripts and UI download links to pull the agent source code from the `beta` branch instead of `main`, allowing users to get the latest updates faster.

### Fixed

- **Agent Installer**: Fixed a bug where the installer scripts failed because they did not download the `README.md` file, which is required by the package metadata.

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
