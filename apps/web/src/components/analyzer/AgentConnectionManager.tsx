import { memo, useEffect } from "react";
import { useCaptureAgent } from "@/stores/agentStore";
import { Wifi, WifiOff } from "lucide-react";

function AgentConnectionManager() {
  const { status, connect, disconnect } = useCaptureAgent();

  useEffect(() => {
    // Attempt to connect when the component mounts
    connect();
  }, [connect]);

  const renderStatus = () => {
    switch (status) {
      case "connected":
        return (
          <div className="flex items-center gap-2 text-green-400">
            <Wifi size={16} />
            <span>Agent Connected</span>
            <button
              className="px-2 py-1 text-sm border border-gray-600 rounded-md hover:bg-gray-700"
              onClick={disconnect}
            >
              Disconnect
            </button>
          </div>
        );
      case "connecting":
        return <div className="text-yellow-400">Connecting to Agent...</div>;
      case "disconnected":
      case "error":
        return (
          <div className="flex flex-col items-start gap-2 p-4 rounded-lg bg-gray-800 border border-gray-700">
            <div className="flex items-center gap-2 text-red-400">
              <WifiOff size={16} />
              <span>Agent Not Detected</span>
            </div>
            <p className="text-sm text-gray-400">
              For dual-channel analysis, download and run the local capture agent.
            </p>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 text-sm border border-gray-600 rounded-md hover:bg-gray-700"
                onClick={connect}
              >
                Retry Connection
              </button>
              <button
                onClick={() => {
                  const GITHUB_RAW_URL =
                    "https://raw.githubusercontent.com/SoundDocs/sounddocs/beta/agents/capture-agent-py/";
                  const downloadFile = async (filename: string) => {
                    try {
                      const response = await fetch(`${GITHUB_RAW_URL}${filename}`);
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
                      window.open(`${GITHUB_RAW_URL}${filename}`, "_blank");
                    }
                  };
                  downloadFile("README.md");
                }}
                className="px-2 py-1 text-sm bg-gray-600 border border-gray-600 rounded-md hover:bg-gray-500"
              >
                Download Instructions
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="p-2">{renderStatus()}</div>;
}

export default memo(AgentConnectionManager);
