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
    <div className="bg-yellow-800/30 border border-yellow-600 text-yellow-200 px-4 py-3 rounded-lg relative flex items-start space-x-3">
      <AlertCircle className="h-5 w-5 text-yellow-400 mt-1" />
      <div className="flex-1">
        <strong className="font-bold">Update Required</strong>
        <p className="block sm:inline">{message}</p>
        <a
          href="https://github.com/SoundDocs/sounddocs/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 sm:mt-0 sm:ml-4 inline-flex items-center bg-yellow-500 text-gray-900 hover:bg-yellow-600 font-semibold py-1 px-3 rounded-md text-sm transition-colors duration-300"
        >
          <Download className="h-4 w-4 mr-2" />
          Get Update
        </a>
      </div>
    </div>
  );
};

export default AgentUpdateNotification;
