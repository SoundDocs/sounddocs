import React from "react";
import { AlertCircle, Download } from "lucide-react";

interface AgentUpdateNotificationProps {
  connectedVersion?: string;
  latestVersion: string;
}

const AgentUpdateNotification: React.FC<AgentUpdateNotificationProps> = ({
  connectedVersion,
  latestVersion,
}) => {
  const message = connectedVersion
    ? `Your capture agent (v${connectedVersion}) is outdated. Please update to v${latestVersion} for the best experience.`
    : `No capture agent version was detected. Please update to the latest version (v${latestVersion}).`;

  return (
    <div className="bg-gray-800/50 border border-blue-500/30 text-gray-300 px-4 py-3 rounded-lg relative flex items-center space-x-4">
      <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
      <div className="flex-1">
        <strong className="font-bold text-blue-300 mr-2">Update Required</strong>
        <p className="block sm:inline text-sm">{message}</p>
      </div>
      <a
        href="https://github.com/SoundDocs/sounddocs/releases"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center bg-blue-600 text-white hover:bg-blue-700 font-semibold py-1 px-3 rounded-md text-sm transition-colors duration-300 flex-shrink-0"
      >
        <Download className="h-4 w-4 mr-2" />
        Get Update
      </a>
    </div>
  );
};

export default AgentUpdateNotification;
