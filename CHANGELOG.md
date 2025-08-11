# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- **Automatic Time Calculation**: Added smart time calculation for sequential cues
  - When a cue's start time and duration are set, the next cue's start time is automatically calculated
  - Works with various time formats (HH:MM:SS, MM:SS) and duration formats (MM:SS, SS)
  - Only updates the next playable item (skips section headers)
  - Streamlines the cue timing process for faster show programming

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
  - Smart next-cue detection that skips section headers
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
