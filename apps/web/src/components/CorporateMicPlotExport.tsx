import React, { forwardRef } from "react";
import {
  Bookmark,
  Clock,
  Mic,
  Users,
  Hash,
  MapPin,
  RefreshCw,
  FileText,
  Radio,
  Wifi,
  WifiOff,
  Image as ImageIcon,
} from "lucide-react";

interface Presenter {
  id: string;
  presenter_name?: string;
  session_segment?: string;
  mic_type?: string;
  element_channel_number?: string;
  tx_pack_location?: string;
  backup_element?: string;
  sound_check_time?: string;
  notes?: string;
  presentation_type?: string;
  remote_participation?: boolean;
  photo_url?: string | null;
}

interface CorporateMicPlot {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  presenters?: Presenter[];
}

interface CorporateMicPlotExportProps {
  micPlot: CorporateMicPlot;
}

const CorporateMicPlotExport = forwardRef<HTMLDivElement, CorporateMicPlotExportProps>(
  ({ micPlot }, ref) => {
    if (!micPlot) {
      return (
        <div ref={ref} className="p-8 bg-gray-900 text-white">
          Mic plot data not available.
        </div>
      );
    }

    const formatDate = (dateString?: string) => {
      if (!dateString) return "N/A";
      try {
        return new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch (e) {
        return dateString;
      }
    };

    const formatTime = (timeString?: string) => {
      if (!timeString) return "-";
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return timeString;
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } catch (e) {
        return timeString;
      }
    };

    const renderField = (
      IconComponent: React.ElementType,
      label: string,
      value?: string | null | boolean,
      isTime: boolean = false,
    ) => {
      let shouldRender = true;
      if (value === undefined || value === null) {
        shouldRender = false;
      } else if (typeof value === "string" && value.trim() === "") {
        if (label !== "Notes") {
          shouldRender = false;
        }
      }

      if (!shouldRender) return null;

      let displayValueNode: React.ReactNode;

      if (label === "Remote Participation" && typeof value === "boolean") {
        displayValueNode = value ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-700/30 text-green-300 text-xs font-semibold">
            <Wifi size={14} className="mr-1.5" /> Remote
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-700/30 text-red-300 text-xs font-semibold">
            <WifiOff size={14} className="mr-1.5" /> On-Site
          </span>
        );
      } else if (typeof value === "boolean") {
        displayValueNode = value ? "Yes" : "No";
      } else if (isTime) {
        displayValueNode = formatTime(String(value));
      } else {
        displayValueNode = String(value);
      }

      return (
        <div className="flex items-start text-sm mb-3">
          <IconComponent size={16} className="text-indigo-400 mr-3 mt-px flex-shrink-0" />
          <div className="flex-grow min-w-0">
            <span className="font-semibold text-gray-400">{label}:</span>
            <span className="ml-1.5 text-gray-200 break-words">{displayValueNode}</span>
          </div>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className="p-10 bg-gradient-to-br from-gray-900 to-slate-900 text-white min-w-[1000px] font-inter"
      >
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            .font-inter { font-family: 'Inter', sans-serif; }
            .presenter-card {
              background: linear-gradient(145deg, rgba(31, 41, 55, 0.7), rgba(55, 65, 81, 0.5));
              border: 1px solid rgba(75, 85, 99, 0.5);
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 20px;
              box-shadow: 0 10px 20px rgba(0,0,0,0.3), 0 6px 6px rgba(0,0,0,0.25);
              transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .presenter-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 15px 30px rgba(0,0,0,0.4), 0 10px 10px rgba(0,0,0,0.3);
            }
            .presenter-photo {
              width: 140px; /* Increased size */
              height: 140px; /* Increased size */
              object-fit: cover;
              border-radius: 8px;
              border: 2px solid rgba(99, 102, 241, 0.7);
              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            .photo-placeholder {
              width: 140px; /* Increased size */
              height: 140px; /* Increased size */
              background-color: rgba(55, 65, 81, 0.8);
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-size: 0.8rem;
              color: #9CA3AF;
              border: 2px dashed rgba(75, 85, 99, 0.7);
            }
          `}
        </style>

        <div className="flex justify-between items-center mb-10 pb-6 border-b-2 border-indigo-500/40">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg mr-4 shadow-lg">
              <Bookmark className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-indigo-400">SoundDocs</h1>
              <p className="text-indigo-300 font-medium text-lg">Corporate Mic Plot</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-100">{micPlot.name}</h2>
            <p className="text-sm text-gray-400">
              Last Edited: {formatDate(micPlot.last_edited || micPlot.created_at)}
            </p>
          </div>
        </div>

        {micPlot.presenters && micPlot.presenters.length > 0 ? (
          <div className="space-y-6">
            {micPlot.presenters.map((presenter, index) => (
              <div key={presenter.id || index} className="presenter-card">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-shrink-0 sm:w-[180px] flex flex-col items-center sm:items-start">
                    {" "}
                    {/* Adjusted width for larger photo */}
                    {presenter.photo_url ? (
                      <img
                        src={presenter.photo_url}
                        alt={presenter.presenter_name || "Presenter"}
                        className="presenter-photo"
                      />
                    ) : (
                      <div className="photo-placeholder">
                        <ImageIcon size={40} className="mb-1 text-gray-500" />{" "}
                        {/* Increased icon size */}
                        No Photo
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-indigo-300 mt-3 text-center sm:text-left break-words w-full">
                      {presenter.presenter_name || "Unnamed Presenter"}
                    </h3>
                    <p className="text-sm text-gray-400 text-center sm:text-left break-words w-full">
                      {presenter.session_segment || "No Session Info"}
                    </p>
                  </div>

                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                    {renderField(Mic, "Mic Type", presenter.mic_type)}
                    {renderField(Hash, "Element/Channel #", presenter.element_channel_number)}
                    {renderField(MapPin, "TX Pack Location", presenter.tx_pack_location)}
                    {renderField(RefreshCw, "Backup Element", presenter.backup_element)}
                    {renderField(Clock, "Sound Check Time", presenter.sound_check_time, true)}
                    {renderField(Users, "Presentation Type", presenter.presentation_type)}
                    {renderField(Radio, "Remote Participation", presenter.remote_participation)}
                    {renderField(FileText, "Notes", presenter.notes)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Mic size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-xl text-gray-500">No presenters listed for this mic plot.</p>
          </div>
        )}

        <div className="mt-12 pt-8 border-t-2 border-indigo-500/40">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center text-indigo-400">
              <Bookmark size={18} className="mr-2" /> SoundDocs Professional Event Documentation
            </div>
            <div className="text-gray-500">Generated on {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    );
  },
);

CorporateMicPlotExport.displayName = "CorporateMicPlotExport";
export default CorporateMicPlotExport;
