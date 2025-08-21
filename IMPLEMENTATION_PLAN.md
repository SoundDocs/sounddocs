# Signal Generator Implementation Plan

## Overview

This document outlines the plan to implement a signal generator with various noise profiles and a loopback feature for the analyzer pro. The implementation is divided into three main parts: protocol extension, frontend UI, and backend implementation.

---

### Step 1: Extend the Analyzer Protocol (✓ Done)

**File:** `packages/analyzer-protocol/src/index.ts`

The WebSocket protocol will be extended to control the signal generator from the frontend.

- **Define `SignalType`:** Create a new type for the different noise profiles.

  ```typescript
  export type SignalType = "off" | "pink" | "white" | "sine";
  ```

- **Create `ConfigureGeneratorMessage`:** Define a new message interface to send generator settings to the agent.

  ```typescript
  export interface ConfigureGeneratorMessage {
    type: "configure_generator";
    signalType: SignalType;
    outputChannel: number;
    loopback: boolean;
  }
  ```

- **Update `ClientMessage`:** Add `ConfigureGeneratorMessage` to the `ClientMessage` union type.
  ```typescript
  export type ClientMessage =
    // ... existing messages
    ConfigureGeneratorMessage;
  ```

---

### Step 2: Implement the Frontend UI (✓ Done)

A new React component will be created for the signal generator controls and integrated into the `ProSettings` panel.

1.  **Create `SignalGenerator.tsx` Component**

    - **File:** `apps/web/src/components/analyzer/SignalGenerator.tsx`
    - This component will be a controlled component and include UI elements for:
      - A dropdown to select the signal type (`off`, `pink`, `white`, `sine`).
      - A dropdown to select the output channel.
      - A checkbox to enable the loopback feature.
    - It will receive its state and callbacks as props.

2.  **Integrate into `ProSettings.tsx`**
    - **File:** `apps/web/src/components/analyzer/ProSettings.tsx`
    - Add state for the generator settings (`signalType`, `outputChannel`, `loopback`).
    - Render the `SignalGenerator` component within the `ProSettings` panel.
    - Pass a callback to the `SignalGenerator` component that sends a `configure_generator` message to the agent using the `sendMessage` function from the `useCaptureAgent` hook.
    - When loopback is enabled, the "Reference Channel" dropdown will be disabled and display "Loopback".

---

### Step 3: Implement the Backend Logic

The signal generation and loopback functionality will be implemented in the Python capture agent.

1.  **Update `server.py` to Handle New Message (✓ Done)**

    - **File:** `agents/capture-agent-py/capture_agent/server.py`
    - Add a new handler in the `process_message` function for the `configure_generator` message type.
    - The handler will store the generator configuration in a shared state accessible by the `run_capture` function.
    - Modify `run_capture` to open an `sd.OutputStream` alongside the `InputStream` when a capture starts.
    - The output stream will use a callback to continuously feed the generated signal data to the selected output device.

2.  **Add DSP Functions for Signal Generation (✓ Done)**

    - **File:** `agents/capture-agent-py/capture_agent/dsp.py`
    - Implement new functions to generate the different signal types:
      - `generate_pink_noise()`: Generate a pink noise signal.
      - `generate_white_noise()`: Generate a white noise signal.
      - `generate_sine_sweep()`: Generate a logarithmic sine sweep.

3.  **Implement the Loopback Feature (✓ Done)**
    - **File:** `agents/capture-agent-py/capture_agent/server.py`
    - When the `loopback` option is enabled in the `ConfigureGeneratorMessage`, the `run_capture` function will be modified to:
      - Route the output of the signal generator directly into the reference channel of the analysis buffer.
      - This will bypass the physical audio interface, providing a perfect reference signal for measurements.

---

### Step 4: Versioning and Changelog

As per the repository rules, the following files will be updated upon completion of the implementation:

1.  **`CHANGELOG.md`:** A new entry will be added under the "Added" section to describe the new signal generator feature.
2.  **`package.json`:** The version number will be incremented according to the contribution guidelines.
