import React from "react";
import { Download, AlertTriangle } from "lucide-react";

interface AgentUpdateNotificationProps {
  latestVersion: string;
}

export const AgentUpdateNotification: React.FC<AgentUpdateNotificationProps> = ({
  latestVersion,
}) => {
  return (
    <div
      className="bg-yellow-800/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg relative mb-4"
      role="alert"
    >
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 mr-3" />
        <div>
          <strong className="font-bold">Update Available!</strong>
          <span className="block sm:inline ml-2">
            A new version of the capture agent ({latestVersion}) is available.
          </span>
        </div>
        <a
          href="https://github.com/SoundDocs/sounddocs/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto bg-yellow-600 text-white hover:bg-yellow-700 font-semibold py-2 px-4 rounded-md inline-flex items-center transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-px"
        >
          <Download className="h-5 w-5 mr-2" />
          Download
        </a>
      </div>
    </div>
  );
};

export default AgentUpdateNotification;
