import { memo } from "react";
import { DownloadCloud, Terminal } from "lucide-react";

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/SoundDocs/sounddocs/beta/agents/capture-agent-py/";

function AgentDownload() {
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
        <a
          href={`${GITHUB_RAW_URL}run.sh`}
          download="run.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 transition-colors"
        >
          Download for macOS / Linux
        </a>
        <a
          href={`${GITHUB_RAW_URL}run.bat`}
          download="run.bat"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 transition-colors"
        >
          Download for Windows
        </a>
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
            On macOS/Linux, first run: <code>chmod +x run.sh</code>
          </li>
          <li>Run the script from your Downloads folder.</li>
        </ol>
      </div>
    </div>
  );
}

export default memo(AgentDownload);
