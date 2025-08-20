import { memo } from "react";
import { DownloadCloud, Terminal } from "lucide-react";

// GitHub Releases URL for installer downloads
const GITHUB_RELEASES_URL = "https://github.com/SoundDocs/sounddocs/releases/latest/download/";

function AgentDownload() {
  const downloadInstaller = (platform: 'macos' | 'windows') => {
    const filename = platform === 'macos' 
      ? 'SoundDocsAgent-macOS.pkg' 
      : 'SoundDocsAgent-Windows.exe';
    
    // Direct download from GitHub releases
    window.open(`${GITHUB_RELEASES_URL}${filename}`, '_blank');
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
          onClick={() => downloadInstaller("macos")}
          className="flex-1 px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 transition-colors"
        >
          Download for macOS (.pkg)
        </button>
        <button
          onClick={() => downloadInstaller("windows")}
          className="flex-1 px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 transition-colors"
        >
          Download for Windows (.exe)
        </button>
      </div>
      <div className="text-xs text-gray-500">
        <h4 className="font-semibold text-gray-400 mb-2 flex items-center">
          <Terminal size={14} className="mr-2" />
          How to Run
        </h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Download the installer for your operating system.</li>
          <li>
            <strong>macOS:</strong> Double-click the .pkg file and follow the installer prompts.
          </li>
          <li>
            <strong>Windows:</strong> Run the .exe file as administrator and follow the setup wizard.
          </li>
          <li>
            Launch "SoundDocs Capture Agent" from your Applications folder or Start Menu.
          </li>
        </ol>
      </div>
    </div>
  );
}

export default memo(AgentDownload);
