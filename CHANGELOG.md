# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.6.8] - 2025-09-30

### Added

- **Technical Riders**: Complete technical rider management system for touring artists and production teams
  - Create and edit comprehensive technical riders with artist information, band members, and contact details
  - Manage input/channel lists with mic types, phantom power, and DI requirements
  - Define sound system requirements (PA, monitors, console specifications)
  - Track backline requirements and artist-provided equipment
  - Specify required technical staff and special production requirements
  - Add hospitality and additional notes sections
  - Share riders with view and edit permissions via secure share links
  - Print-friendly PDF exports with professional formatting and proper page breaks
  - Available on Production page for easy access
- **Script Import Instructions**: Added LLM prompt template for converting scripts to Run of Show format
  - Provides structured instructions for users to convert scripts using external LLMs (ChatGPT, Claude, etc.)
  - Template includes guidance for adding lighting cues, audio requirements, and production notes
  - Generates JSON format compatible with SoundDocs Run of Show system
  - Accessed via Import Show Flow modal in Run of Show editor
- **Trusted By Section**: Added social proof component to landing page
  - Live user count display showing platform adoption
  - Real-time statistics from user base
  - Professional presentation of platform credibility

### Changed

- **Web App Version**: Updated to `1.5.6.8`

## [1.5.6.7] - 2025-09-25

### Added

- **Signal Generator for Capture Agent**: Added comprehensive signal generation capabilities to the capture agent
  - Pink Noise Generator: Professional-grade pink noise (1/f spectrum) using Voss-McCartney algorithm
  - White Noise Generator: Full-spectrum white noise for system calibration
  - Sine Wave Generator: Pure tone generation with adjustable frequency (20Hz - 20kHz)
  - Sine Sweep Generator: Logarithmic sweep for system testing and alignment
  - Configurable output routing to any available audio channel
  - Real-time signal generation with minimal latency
  - WebSocket control interface for remote signal control from web UI
- **Internal Loopback Measurement**: Added loopback mode for measuring systems internally
  - Routes generated signal directly to reference channel for internal system measurement
  - Enables measuring DSP chains, plugins, and software signal paths without physical connections
  - Useful for analyzing digital signal processing and software-based audio systems

### Changed

- **Capture Agent Version**: Bumped to `0.2.0` to reflect major feature addition
- **Web App Version**: Updated to `1.5.6.7`

## [1.5.6.6] - 2025-09-21

### Fixed

- **Capture Agent Memory Leaks**: Eliminated critical memory leaks and improved stability in the capture agent
  - Fixed memory leaks in buffer pool management with proper buffer return and dynamic growth limits
  - Fixed DSP cache memory leaks by implementing proper LRU cache cleanup and FFT plan management
  - Fixed WebSocket cleanup issues preventing proper connection handling
  - Resolved QueueFull errors with better queue management and connection stability
  - Improved frame drop rates and overall capture agent reliability
- **WebSockets Compatibility**: Fixed compatibility issues with websockets v12+ library
  - Updated connection handling to support modern WebSocket protocols
  - Enhanced error handling and connection resilience
- **Chart Legend Consistency**: Fixed legend white fill consistency for magnitude and phase charts
  - Ensured consistent white background for legend color swatches across all chart types
  - Improved visual clarity and professional appearance of chart legends

### Changed

- **Capture Agent Version**: Bumped capture agent version to `0.1.14`

## [1.5.6.5] - 2025-09-19

### Added

- **Lens Calculator**: Added a comprehensive lens throw calculator tool for projection and event planning
  - Calculate image sizes and throw distances for various projector lens configurations
  - Support for standard and ultra-wide aspect ratios (16:9, 16:10, 4:3, 21:9)
  - Preset lens configurations for common projector types
  - Interactive visual diagram showing projector positioning relative to screen
  - Professional-grade calculations for accurate event setup planning

## [1.5.6.4] - 2025-09-17

### Changed

- Updated PDF export footer text to "Professional Event Documentation" across production schedules and related exports

### Fixed

- Resolved TypeScript/ESLint error in `AllRunOfShows.tsx` by typing `onclone` and safely casting html2canvas options

## [1.5.6.3] - 2025-09-15

### Fixed

- **Production Schedule Print Export**: Fixed issues with print-friendly PDF exports for production schedules
  - Added date headers to group schedule items by day with clear visual separation
  - Fixed sorting to ensure dates are in chronological order
  - Preserved user-defined order of items within each date group
  - Applied same improvements to both detailed schedule and labor schedule sections
  - Removed redundant date columns from tables since dates are now shown in headers
  - Ensured consistent formatting between AllProductionSchedules and ProductionPage exports

### Improved

- **Production Schedule Export Layout**: Enhanced readability of print exports
  - Added light blue-gray background for date headers
  - Improved table column widths for better content distribution
  - Consistent formatting between detailed schedule and labor schedule sections

## [1.5.6.2] - 2025-09-11

### Added

- **PR Checks for Changed Files Only**: Implemented targeted CI/CD checks that only validate modified files in pull requests

  - Created `.github/workflows/pr-checks.yml` workflow that runs on PRs to main and beta branches
  - Uses `tj-actions/changed-files` to intelligently detect which files have been modified
  - Significantly improves CI performance by avoiding full codebase scans
  - Allows legacy code to coexist while ensuring new changes meet quality standards

- **TypeScript/JavaScript Checks**: Added comprehensive checks for TypeScript and JavaScript files

  - ESLint runs only on changed `.ts`, `.tsx`, `.js`, and `.jsx` files
  - TypeScript type checking validates the entire project but reports errors only for changed files
  - Prettier format checking ensures consistent code style on modified files
  - Supports the monorepo structure with proper pnpm workspace handling

- **Python Linting for Changed Files**: Integrated Python code quality checks

  - Ruff linting and format checking on changed `.py` files
  - Leverages existing Ruff configuration from `pyproject.toml`
  - Optional mypy type checking (non-blocking initially) for gradual type safety adoption
  - Properly configured for Python 3.11 as used in the capture agent

- **SQL Linting for Migrations**: Added SQL file validation
  - SQLFluff linting for changed `.sql` files with PostgreSQL dialect
  - Created `.sqlfluff` configuration file with project-specific rules
  - Safety checks for dangerous SQL operations (DROP without IF EXISTS, NOT NULL without DEFAULT)
  - Non-blocking for existing migrations to avoid breaking legacy code

### Improved

- **CI/CD Performance**: Dramatic speed improvements by checking only changed files instead of entire codebase
- **Developer Experience**: Faster feedback loops with focused checks on actual changes
- **Incremental Code Quality**: Enables gradual improvement of codebase quality without requiring full refactor

### Fixed

- **NotFoundPage.tsx**: Removed unused `Home` import from lucide-react to resolve ESLint warning
  - Demonstrates the new PR checks workflow in action
  - Ensures clean lint status for testing CI/CD pipeline

## [1.5.6.1] - 2025-09-10

### Added

- **Comprehensive CI/CD Pipeline**: Implemented automated testing and linting for PRs on main and beta branches

  - **GitHub Actions Workflow**: Created `.github/workflows/ci.yml` for automated quality checks
  - **Multi-Language Linting**: Added ESLint for TypeScript, Ruff for Python, and SQLFluff for SQL
  - **Legacy Code Protection**: Configured lint-staged to only check staged/changed files, protecting legacy code from CI failures
  - **New Code Quality Enforcement**: Strict linting with `--max-warnings=0` ensures new code meets high quality standards
  - **Staged-File-Only Approach**: CI only validates what developers are actually committing, not entire codebase

- **Python Linting Setup**: Added comprehensive Ruff configuration for capture agent

  - **Comprehensive Rule Set**: Enabled 50+ linting rules covering code quality, security, and best practices
  - **Agent-Specific Configuration**: Created `agents/capture-agent-py/pyproject.toml` with Python 3.11 target and tailored rules
  - **Test File Exclusions**: Configured appropriate rule exclusions for test files

- **SQL Linting Setup**: Added SQLFluff configuration for database migrations

  - **PostgreSQL Dialect**: Configured for Supabase PostgreSQL migrations
  - **Reasonable Exclusions**: Excluded overly strict rules while maintaining code quality
  - **Caching Support**: Added `.sqlfluff` config file with proper dialect and line length settings

- **Enhanced Development Workflow**: Improved developer experience with automated quality checks

  - **Caching Support**: Added `.eslintcache` to `.gitignore` for faster ESLint runs
  - **Pre-commit Hooks**: Enhanced lint-staged configuration with comprehensive file type coverage
  - **Fast Feedback**: Only lints changed files during development for quick iteration

- **Qodo Integration**: Updated CONTRIBUTING.md with Qodo documentation
  - **Automatic PR Descriptions**: Documented how Qodo generates comprehensive PR descriptions
  - **AI-Powered Code Reviews**: Added information about intelligent code review features
  - **Simplified PR Process**: Updated guidelines to reflect that only titles are required for PRs
  - **Review Management**: Documented Qodo's role in managing review workflows

### Technical Enhancements

- **TypeScript Strict Mode**: Re-enabled strict TypeScript checking for new/changed files while protecting legacy code
- **Staged-File-Only Type Checking**: Integrated TypeScript checking into lint-staged for targeted validation
- **Python Tooling**: Configured Ruff and SQLFluff via pip for CI environment (not as npm dependencies)
- **Performance Optimization**: Enabled caching for all linters to improve CI performance
- **Monorepo Support**: Configured linting to work across the entire monorepo structure
- **Legacy Code Protection**: Implemented staged-file approach that preserves existing code while enforcing quality on new changes

## [1.5.6] - 2025-01-12

### Added

- **Math Traces**: Complete mathematical operations system for measurements

  - **Advanced Averaging**: Coherence-weighted averaging for improved measurement quality
  - **Complex Arithmetic**: Proper handling of magnitude and phase data with phase unwrapping
  - **Multiple Operations**: Support for average, sum, and subtract operations on measurement traces
  - **Quality-Based Processing**: Measurements with higher coherence contribute more to averages
  - **Real-Time Processing**: Dynamic computation of math traces as measurements are selected

- **Math Trace Management UI**:

  - **Math Trace Modal**: Dedicated interface for creating and managing mathematical operations
  - **Operation Selection**: Choose between average, sum, and subtract operations
  - **Measurement Selection**: Multi-select interface for choosing source measurements
  - **Visual Integration**: Math traces appear in measurement lists with calculator icon
  - **Real-Time Updates**: Changes to source measurements automatically update math traces

- **Database Schema**: New `math_measurements` table for persistent storage
  - **Full CRUD Operations**: Create, read, update, and delete math trace definitions
  - **User-Specific Storage**: Measurements are associated with user accounts
  - **Relationship Management**: Links to source measurement IDs for dynamic updates

### Improved

- **Analyzer Pro Page**: Enhanced measurement visualization and management

  - **Math Trace Integration**: Math traces appear alongside regular measurements
  - **Color Coding**: Distinct visual identification of math traces
  - **Performance**: Optimized rendering of complex measurement datasets

- **Chart Visualization**: Improved chart rendering and legend display

  - **Phase Legend Colors**: Fixed color display in phase graph legends on main analyzer page
  - **Coherence Visualization**: Enhanced coherence-based coloring in charts
  - **Legend Consistency**: Proper color swatches across all chart types

- **Signal Processing**: Advanced DSP algorithms for measurement mathematics
  - **Phase Unwrapping**: Robust handling of phase discontinuities in complex arithmetic
  - **Frequency Validation**: Automatic validation of measurement compatibility
  - **Error Handling**: Comprehensive error handling for edge cases

### Fixed

- **Chart Legend Colors**: Resolved empty color boxes in phase graph legends
- **Measurement Compatibility**: Fixed frequency bin validation for math operations
- **Phase Processing**: Corrected phase unwrapping for accurate complex arithmetic
- **Production Schedule Print Export**: Fixed day headers and time ordering issues
  - **Day Headers**: Changed from row separators to proper section headers for detailed schedule items
  - **Time Ordering**: Preserved manual reordering by removing forced sorting, matching interactive version behavior

### Technical Enhancements

- **Type Safety**: Updated TypeScript interfaces for math trace support
- **Component Architecture**: New reusable UI components for math operations
- **Performance Optimization**: Efficient algorithms for real-time math trace computation
- **Memory Management**: Proper cleanup and resource management in DSP operations

## [1.5.5.2] - 2025-09-08

### Fixed

- **pyFFTW Implementation**: Resolved critical runtime errors in FFT operations
  - **FFT Plan Management**: Fixed tuple unpacking errors and attribute access issues in pyFFTW plan caching
  - **Array Buffer Handling**: Corrected improper use of plan input/output arrays, preventing "'tuple' object has no attribute 'input_array'" errors
  - **Plan Caching**: Fixed access time indexing in LRU eviction algorithm (index 3 instead of 2)
  - **Graceful Fallbacks**: Enhanced error handling for cases where pyFFTW plans return None values
  - **Memory Safety**: Improved buffer reuse patterns to prevent data corruption between FFT operations

### Improved

- **FFT Performance**: Optimized pyFFTW plan execution with proper inplace=False usage for thread safety
- **Code Reliability**: Enhanced robustness of DSP operations with better error handling and fallback mechanisms

## [1.5.5.1] - 2025-09-08

### Fixed

- **Critical Memory Leaks**: Eliminated unbounded memory growth in capture agent DSP operations
  - **FFT Memory Optimization**: Implemented pyFFTW with precomputed plans and reusable work arrays to prevent memory leaks during FFT operations
  - **Work Array Management**: Enhanced caching system with dtype-aware keys to prevent buffer type mismatches and memory waste
  - **Array Zeroing Optimization**: Replaced inefficient `np.copyto()` calls with direct `fill()` method for better performance
  - **FFT Plan Caching**: Added LRU-based FFT plan management to prevent plan accumulation and memory leaks
  - **Deterministic Cleanup**: Improved periodic cleanup routines for work arrays and FFT plans

### Improved

- **DSP Performance**: Switched to pyFFTW backend for optimal FFT performance with intelligent plan reuse
- **Memory Efficiency**: Enhanced work array reuse and reduced temporary allocations during signal processing

## [1.5.5] - 2025-09-05

### Added

- **Comms Planner**: Complete wireless communications planning system for events
  - **Visual Comms Canvas**: Interactive drag-and-drop canvas for designing wireless communication setups
  - **Transceiver Management**: Create and manage wireless transceiver base stations with frequency bands, labels, and channel assignments
  - **Beltpack Management**: Manage wireless beltpack units with channel assignments and user assignments
  - **Comprehensive Export**: Generate detailed PDF exports with transceiver layouts, beltpack assignments, and frequency coordination details
  - **Database Integration**: Full persistence with Supabase backend supporting sharing and versioning
  - **Professional Workflows**: Designed specifically for live event production with industry-standard practices

### Improved

- **Comms Planning Workflows**: Streamlined wireless communication planning with professional-grade tools and visual design capabilities

## [1.5.4.6.1] - 2025-09-04

### Fixed

- **Analyzer Page UI**: Fixed a styling issue on the analyzer hub page where the disclaimer overlay would not dim the header and buttons, making them unintentionally interactive. The page content is now properly dimmed when the disclaimer is active.

## [1.5.4.6] - 2025-09-04

### Improved

- **Pixel Map Editor UI**: Updated both LED and Standard pixel map editors to match the consistent UI patterns used in other tools like the patch sheet and production schedule editors.
  - Changed from light theme to dark gray theme matching other editors
  - Updated button styling to use indigo color scheme consistently
  - Improved layout with proper responsive design and mobile-friendly headers
  - Added card-based sections with headers and descriptions
  - Enhanced alert and success message styling for consistency
  - Added loading state with spinner while data is fetched
  - Added bottom save button for better accessibility
  - Improved overall visual hierarchy and professional appearance

## [1.5.4.5] - 2025-09-03

### Fixed

- **Capture Agent Memory Leak**: Fixed critical memory leaks in the acoustIQ capture agent that caused memory usage to increase unbounded over time.
  - Improved buffer pool management: Increased pool size, added dynamic growth limits, and ensured buffers are always returned to the pool
  - Optimized DSP caches: Reduced LRU cache sizes, added cache clearing on state reset, and implemented reusable FFT buffers
  - Limited queue drainage: Process audio blocks in smaller batches to prevent memory spikes
  - Added periodic garbage collection hints to help Python reclaim memory
  - The agent now maintains stable memory usage during long capture sessions
- **Capture Agent Version**: Bumped capture agent version to `0.1.12`

## [1.5.4.4] - 2025-09-02

### Added

- **AcoustIQ Feature Banner**: Added a prominent banner to the dashboard to feature the new AcoustIQ audio analysis tools.

## [1.5.4.3] - 2025-09-02

### Fixed

- **Mobile Drag/Zoom (Stage Plot Editor)**: Implemented a series of fixes to make drag, zoom, and resize functionality reliable on mobile devices.
  - The `<Draggable>` component now compensates for CSS scaling, preventing jumpy or overshooting drags.
  - The resize handle now uses pointer events, enabling touch support.
  - Element positions and dimensions are now proportionally rescaled when the stage size changes, preventing layout breaks.
- **Stage Size Parsing**: Corrected a bug where parsing `x-large-wide` or `x-large-narrow` stage sizes would fail.
- **Code Quality**: Removed unused variables and imports across multiple components to resolve linting errors.

### Improved

- **Mobile UX (Stage Plot Editor)**: Added `touch-action: none` to the stage canvas to prevent conflicts between browser gestures and pinch-to-zoom, creating a smoother user experience.

## [1.5.4.2] - 2025-09-02

### Changed

- Made the production schedule and run of show editors more mobile-first, with a card-based layout on mobile that is always in edit mode.
- Centralized the `ScheduleForExport` type to `apps/web/src/lib/types.ts`.

### Fixed

- Removed extra buttons on smaller screens for a cleaner mobile experience.
- Fixed various TypeScript errors.

## [1.5.4.1] - 2025-09-02

### Fixed

- **Safari Print Export**: Fixed an issue where day header rows in the Detailed Production Schedule and Labor Schedule would disappear in print exports on Safari. The `display: flex` style was moved from the `<td>` element to a nested `<div>` to prevent WebKit from dropping the table cell content.
- **Print Style Hardening**: Added `-webkit-print-color-adjust: exact` and `print-color-adjust: exact` to the print export wrapper to improve color consistency in printed outputs.

### Changed

- **Branding**: Updated the footer on all export documents to "SoundDocs | Professional Event Documentation" for consistency.

## [1.5.4] - 2025-08-27

### Fixed

- **Capture Agent Memory Churn**: Implemented significant memory optimizations in the Python capture agent to address a memory leak caused by rapid allocation and deallocation of large NumPy arrays and JSON payloads. The agent now reuses buffers, caches frequently used arrays, and uses more efficient serialization, resulting in stable, long-term memory performance.
- **Capture Agent Version**: Bumped capture agent version to `0.1.11`.

## [1.5.3.13.4] - 2025-08-22

### Fixed

- **Capture Agent Memory Leak**: Fixed a memory leak in the Python capture agent caused by NumPy array re-allocations and an unbounded window cache. The agent's memory usage now remains stable during long capture sessions.
- **Capture Agent Syntax Error**: Fixed a `SyntaxError: 'await' outside async function` error in the capture agent caused by incorrect indentation.
- **Capture Agent Version**: Bumped capture agent version to `0.1.10`.

## [1.5.3.13.3] - 2025-08-22

### Fixed

- **Capture Agent Memory Leak**: Fixed a memory leak in the Python capture agent caused by NumPy array re-allocations and an unbounded window cache. The agent's memory usage now remains stable during long capture sessions.
- **Capture Agent Version**: Bumped capture agent version to `0.1.9`.

## [1.5.3.13.2] - 2025-08-21

### Fixed

- **Phase Flip on Pro Page**: Fixed an issue where the phase flip was not being applied to the main charts on the Analyzer Pro page.

## [1.5.3.13.1] - 2025-08-21

### Improved

- **EQ Trace Styling**: The "before" EQ trace in the chart detail modal is now rendered as a dashed line for better visual distinction.

## [1.5.3.13] - 2025-08-21

### Added

- **Phase Flip**: Added a "Flip Phase" button to the chart detail modal. This allows users to flip the phase of a measurement by 180 degrees, and the change is persisted to the database.

### Fixed

- **EQ Button Visibility**: The EQ button in the chart detail modal is now only visible when the magnitude chart is selected.

## [1.5.3.12] - 2025-08-21

### Added

- **Capture Agent Version Check**: Implemented a version check on the Analyzer Pro page.
  - The Python agent now sends its version to the web app upon connection.
  - The web app compares the agent's version to the latest required version.
  - A notification is displayed prompting the user to update if their agent is outdated or no version is detected.

### Changed

- **Capture Agent Version**: Bumped capture agent version to `0.1.8`.
- **Build Workflow**: Updated the GitHub Actions workflow to build installers with version `0.1.8`.

## [1.5.3.11] - 2025-08-21

### Fixed

- **macOS CA Ownership/Trust**: Fixed `mkcert` CA ownership and trust issues on macOS. The installer scripts now run `mkcert -install` as the user, ensure the user owns the `CAROOT` directory, trust the CA into the System keychain with a proper administrative prompt, and generate the leaf certificate as the user. This resolves permission errors and browser trust failures.

## [1.5.3.10] - 2025-08-21

### Fixed

- **Certificate Validation**: Patched the certificate validation logic to be compatible with `cryptography` library versions both older and newer than v41. The agent no longer crashes when encountering datetime objects without the `_utc` suffix.
- **macOS CA Installation**: Corrected the macOS installer script to ensure the `mkcert` Certificate Authority is installed into the System keychain instead of the login keychain. This resolves browser trust errors (`ERR_CERT_AUTHORITY_INVALID`).
- **Privileged Path Execution**: Fixed an issue where the macOS installer could not find `mkcert` when running with administrator privileges due to a minimal `PATH`. The script now uses the absolute path to `mkcert` for privileged operations.

### Changed

- **Dependency Pinning**: Pinned the `cryptography` dependency to `>=41,<44` in `pyproject.toml` and CI workflows to ensure deterministic builds and prevent future validation errors.

## [1.5.3.9] - 2025-08-20

### Fixed

- **Privileged Certificate Installation**: Enhanced installer to use AppleScript `with administrator privileges` to properly prompt for user password when installing mkcert certificates. This ensures the GUI password dialog appears and `mkcert -install` runs with necessary privileges to modify the system keychain.

## [1.5.3.8] - 2025-08-20

### Fixed

- **macOS Keychain Certificate Installation**: Fixed critical issue where `mkcert -install` would run but not actually install certificates into the macOS keychain. The installer now uses `security find-certificate` to verify certificates are properly installed in the keychain and provides better error reporting when installation fails.

## [1.5.3.7] - 2025-08-20

### Fixed

- **Certificate Validation and Regeneration**: Enhanced SSL certificate setup to validate existing certificates and regenerate them if invalid, expired, or missing required domains. The agent now properly checks certificate authority installation and provides Firefox compatibility warnings.
- **Cryptography Dependency**: Added cryptography library dependency for proper certificate validation.

## [1.5.3.6] - 2025-08-20

### Fixed

- **macOS Installer Certificate Setup**: Fixed issue where `mkcert -install` would not run after Homebrew installs mkcert. The installer now properly refreshes the PATH and forces certificate authority setup when mkcert is newly installed, ensuring SSL certificates are always properly trusted by the browser.

## [1.5.3.5] - 2025-08-20

### Fixed

- **macOS App Bundle Complete Redesign**: Completely redesigned the macOS installer to create a clean, single app bundle experience. Removed confusing loose files in `/Applications/SoundDocs/` folder. The app now always opens a Terminal window showing real-time progress of `mkcert -install`, SSL certificate generation, and agent status. Users get full transparency into the setup process with emoji-enhanced status messages and clear error reporting.

### Changed

- **macOS Installer Structure**: Simplified installer to create only `SoundDocs Capture Agent.app` bundle with embedded executable and resources. No more loose files or confusing dual installation paths.

## [1.5.3.4] - 2025-08-20

### Fixed

- **macOS App Bundle GUI Launch**: Fixed the app bundle "bouncing" issue where the application would start but immediately crash when launched via Finder or `open` command. The launch script now properly handles GUI launches by setting up the PATH environment for Homebrew, replacing interactive prompts with macOS notifications and dialogs, and providing proper error handling for non-terminal environments.

## [1.5.3.3] - 2025-08-20

### Fixed

- **macOS App Bundle Structure**: Fixed the fundamental issue where the macOS installer created a launch script but provided no way for users to execute it. The installer now creates a proper macOS app bundle (`.app`) with the SoundDocs logo icon that users can double-click to launch. The app bundle properly executes the dependency installation and certificate setup process.
- **macOS Installer User Experience**: Users now get a proper macOS application in their Applications folder instead of loose executables, providing a native macOS experience.

## [1.5.3.2] - 2025-08-20

### Fixed

- **macOS Installer Dependency Management**: Fixed a critical issue where the macOS installer assumed mkcert was already installed on end users' systems. The installer now automatically installs mkcert via Homebrew at runtime, matching the Windows installer's dependency management approach.

## [1.5.3.1] - 2025-08-20

### Fixed

- **macOS Installer Certificate Trust**: Fixed a critical issue where the macOS installer was not installing the mkcert Certificate Authority, causing SSL certificate trust warnings in browsers. The installer now properly runs `mkcert -install` to establish trust before generating certificates, eliminating "Not Secure" warnings.
- **Documentation**: Corrected incorrect port number in agent startup message from 8443 to the actual port 9469.

## [1.5.3] - 2025-08-20

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
