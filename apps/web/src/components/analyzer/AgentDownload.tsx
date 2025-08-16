import { memo } from "react";
import { DownloadCloud, Terminal } from "lucide-react";

// Use GitHub's blob URLs for better download compatibility
const GITHUB_BASE_URL = "https://github.com/SoundDocs/sounddocs/blob/beta/agents/capture-agent-py/";

function AgentDownload() {
  const downloadFile = async (filename: string) => {
    try {
      const response = await fetch(`${GITHUB_BASE_URL}${filename}?raw=true`);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to direct link
      window.open(`${GITHUB_BASE_URL}${filename}?raw=true`, "_blank");
    }
  };
  return (
    <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
        <DownloadCloud className="mr-2 text-indigo-400" />
        Enable Pro Mode
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Download our local capture agent to unlock dual-channel Transfer Function analysis,
        coherence, and other professional measurement tools.
      </p>
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => downloadFile("run.sh")}
          className="flex-1 px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 transition-colors"
        >
          Download for macOS / Linux
        </button>
        <button
          onClick={() => downloadFile("run.bat")}
          className="flex-1 px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 transition-colors"
        >
          Download for Windows
        </button>
      </div>
      <div className="text-xs text-gray-500">
        <h4 className="font-semibold text-gray-400 mb-2 flex items-center">
          <Terminal size={14} className="mr-2" />
          How to Run
        </h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Download the script for your operating system.</li>
          <li>Open your terminal (or Command Prompt on Windows).</li>
          <li>
            On macOS/Linux, first run:{" "}
            <code className="bg-gray-900 px-1 rounded">chmod +x run.sh</code>
          </li>
          <li>Run the script from your Downloads folder.</li>
        </ol>
      </div>
    </div>
  );
}

export default memo(AgentDownload);
