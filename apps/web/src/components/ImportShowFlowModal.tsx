import React, { useState } from "react";
import { X, Copy, Check, AlertCircle, FileJson } from "lucide-react";
import { RunOfShowItem, CustomColumnDefinition } from "../pages/RunOfShowEditor";

interface ImportShowFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (name: string, items: RunOfShowItem[], customColumns: CustomColumnDefinition[]) => void;
}

const LLM_PROMPT = `# Convert Script/Show Flow to SoundDocs JSON Format

Please convert the following script or show flow into a JSON format compatible with SoundDocs' Run of Show system.

## IMPORTANT INSTRUCTIONS:

1. **For Basic Scripts**: If the input is just dialogue or a simple script without technical details, PLEASE EMBELLISH by:
   - Adding realistic lighting cues (e.g., "Stage wash at 75%", "Spotlight on center", "Fade to black")
   - Including audio requirements (e.g., "Wireless mic 1", "Background music -10dB", "SFX: Thunder")
   - Suggesting video/projection needs where appropriate
   - Adding production notes for crew coordination
   - Estimating realistic durations based on content
   - Creating logical section headers (e.g., "Pre-Show", "Act 1", "Intermission", "Act 2", "Post-Show")

2. **Be Creative**: Make the show production-ready by thinking like a technical director. Add details that would actually be needed to run the show.

## Required JSON Structure

The output must be a valid JSON object with the following structure:

\`\`\`json
{
  "name": "Show Name Here",
  "items": [
    // Array of show items (see below)
  ],
  "custom_column_definitions": [
    // Optional: Define any custom columns needed
  ]
}
\`\`\`

### Item Structure

Each item in the \`items\` array must follow this format:

#### Regular Show Item:
\`\`\`json
{
  "id": "unique-id-here",
  "type": "item",
  "itemNumber": "1",
  "startTime": "19:00:00",  // Actual show time (e.g., 7:00 PM)
  "preset": "Scene or preset name",
  "duration": "00:30",
  "privateNotes": "Internal notes not shown to audience",
  "productionNotes": "Notes for production team",
  "audio": "Audio cue or notes",
  "video": "Video content or cue",
  "lights": "Lighting cue or notes",
  "highlightColor": "#FF0000"  // Optional: hex color for highlighting
}
\`\`\`

#### Section Header:
\`\`\`json
{
  "id": "unique-id-here",
  "type": "header",
  "itemNumber": "",  // Leave empty for headers
  "startTime": "19:00:00",  // Actual show time when section starts
  "headerTitle": "Section Name",
  "highlightColor": "#0000FF"  // Optional, but recommended for visual organization
}
\`\`\`

### Field Specifications:

- **id**: Generate a unique identifier for each item (e.g., "item-1", "header-1", or UUID)
- **type**: Either "item" for regular entries or "header" for section dividers
- **itemNumber**: Sequential number for items (string). Leave empty ("") for headers
- **startTime**: The actual absolute time when this item/header starts in HH:MM:SS format (e.g., "19:30:00" for 7:30 PM). This is NOT relative to show start - it's the real wall-clock time
- **duration**: Duration in MM:SS format (e.g., "05:30" for 5 minutes 30 seconds)
- **preset**: The scene, preset, or segment name (descriptive and clear)
- **privateNotes**: Internal notes for operators (technical details, warnings, reminders)
- **productionNotes**: Notes visible to production team (cue sequences, transitions)
- **audio**: Audio-specific cues (mic assignments, music levels, sound effects)
- **video**: Video/projection cues (content playback, camera switches, displays)
- **lights**: Lighting cues (scenes, intensities, color temperatures, effects)
- **highlightColor**: Use colors strategically:
  - Headers: "#4A90E2" (blue) for acts, "#E67E22" (orange) for breaks
  - Critical items: "#E74C3C" (red)
  - Video-heavy: "#9B59B6" (purple)
  - Music/performance: "#27AE60" (green)

### Custom Columns (Optional):

For specialized productions, add custom fields:

\`\`\`json
"custom_column_definitions": [
  {
    "id": "pyro",
    "name": "Pyrotechnics",
    "type": "text",
    "highlightColor": "#FF6B6B"
  },
  {
    "id": "automation",
    "name": "Automation",
    "type": "text",
    "highlightColor": "#4ECDC4"
  }
]
\`\`\`

## Conversion Guidelines:

1. **Time Calculation**: Use actual absolute wall-clock times for all start times. If the show starts at 7:00 PM (19:00), the first item should be "19:00:00", not "00:00:00". Calculate each subsequent startTime by adding the previous item's duration to its start time, plus any intentional gaps/buffers
2. **Section Organization**: Use headers to break the show into logical sections
3. **Color Coding**: Use highlight colors to help operators quickly identify different types of content
4. **Technical Details**: Include specific technical information that operators would need:
   - Mic numbers and assignments
   - Lighting scene numbers or DMX values
   - Video file names or camera positions
   - Sound effect cues with levels
5. **Production Flow**: Think about transitions between items:
   - Add notes about blackouts between scenes
   - Include pre-show and post-show items
   - Consider intermission timing
6. **Safety Notes**: Add any safety-critical information to privateNotes

## Example Enhancement:

**Basic Input:**
\`\`\`
Opening speech by CEO
Product demo
Q&A session
\`\`\`

**Enhanced Output (excerpt):**
\`\`\`json
{
  "name": "Product Launch Event",
  "items": [
    {
      "id": "header-1",
      "type": "header",
      "itemNumber": "",
      "startTime": "18:30:00",
      "headerTitle": "Pre-Show",
      "highlightColor": "#4A90E2"
    },
    {
      "id": "item-1",
      "type": "item",
      "itemNumber": "1",
      "startTime": "18:30:00",
      "preset": "Walk-in Music & House Open",
      "duration": "30:00",
      "privateNotes": "Loop playlist, check all wireless mics",
      "productionNotes": "Doors open, house lights at 50%",
      "audio": "Background music at -15dB, fade out at 29:30",
      "video": "Company logo on screens",
      "lights": "House preset - warm wash at 50%"
    },
    {
      "id": "item-2",
      "type": "item",
      "itemNumber": "2",
      "startTime": "19:00:00",
      "preset": "CEO Opening Speech",
      "duration": "10:00",
      "privateNotes": "CEO enters from stage left, mic check complete",
      "productionNotes": "Spotlight follow, record for archive",
      "audio": "Wireless mic 1 (CEO), room tone -20dB",
      "video": "IMAG camera 1, lower third graphics ready",
      "lights": "Spotlight center, house to 25%, cyc blue",
      "highlightColor": "#E74C3C"
    }
  ]
}
\`\`\`

---

**Please convert the following script/show flow to the SoundDocs JSON format, adding production details as needed:**

[PASTE YOUR SCRIPT OR SHOW FLOW HERE]`;

const ImportShowFlowModal: React.FC<ImportShowFlowModalProps> = ({ isOpen, onClose, onImport }) => {
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"instructions" | "import">("instructions");

  const handleCopyInstructions = async () => {
    try {
      await navigator.clipboard.writeText(LLM_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleImport = () => {
    try {
      setError("");

      if (!jsonInput.trim()) {
        setError("Please paste JSON data");
        return;
      }

      const data = JSON.parse(jsonInput);

      // Validate structure
      if (!data.name || typeof data.name !== "string") {
        setError("JSON must include a 'name' field");
        return;
      }

      if (!Array.isArray(data.items)) {
        setError("JSON must include an 'items' array");
        return;
      }

      // Validate each item has required fields
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (!item.id) {
          setError(`Item at index ${i} is missing 'id' field`);
          return;
        }
        if (!item.type || !["item", "header"].includes(item.type)) {
          setError(`Item at index ${i} has invalid type. Must be 'item' or 'header'`);
          return;
        }
      }

      const customColumns = data.custom_column_definitions || [];

      // Import the data
      onImport(data.name, data.items, customColumns);

      // Reset and close
      setJsonInput("");
      setError("");
      onClose();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON format. Please check your JSON syntax.");
      } else {
        setError("Failed to import data. Please check the format.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Import Show Flow from LLM
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab("instructions")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "instructions"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            1. Copy Instructions
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "import"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            2. Import JSON
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "instructions" ? (
            <div>
              <div className="mb-4">
                <p className="text-gray-300 mb-4">
                  Copy these instructions and paste them into your preferred LLM (ChatGPT, Claude,
                  etc.) along with your script or show flow to convert it to SoundDocs format.
                </p>
                <button
                  onClick={handleCopyInstructions}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Instructions for LLM
                    </>
                  )}
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {LLM_PROMPT}
                </pre>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-gray-300 mb-2">
                  Paste the JSON output from your LLM here to create a new Run of Show.
                </p>
                <p className="text-sm text-gray-500">
                  The JSON should include a "name" field and an "items" array with your show flow
                  data.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON here..."
                className="w-full h-96 p-4 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                spellCheck={false}
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Import Show Flow
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportShowFlowModal;
