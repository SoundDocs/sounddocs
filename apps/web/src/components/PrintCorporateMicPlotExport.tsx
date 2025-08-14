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

interface PrintCorporateMicPlotExportProps {
  micPlot: CorporateMicPlot;
}

const PrintCorporateMicPlotExport = forwardRef<HTMLDivElement, PrintCorporateMicPlotExportProps>(
  ({ micPlot }, ref) => {
    if (!micPlot) {
      return (
        <div ref={ref} className="p-6 bg-white text-black">
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-[11px] font-medium border border-gray-400">
            <Wifi size={12} className="mr-1" /> Remote
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium border border-gray-300">
            <WifiOff size={12} className="mr-1" /> On-Site
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
        <div className="flex items-start text-xs mb-2">
          <IconComponent size={14} className="text-gray-700 mr-2 mt-px flex-shrink-0" />{" "}
          {/* Icon color changed */}
          <div className="flex-grow min-w-0">
            <span className="font-semibold text-gray-700">{label}:</span>
            <span className="ml-1 text-black break-words">{displayValueNode}</span>
          </div>
        </div>
      );
    };

    return (
      <div ref={ref} className="p-8 bg-white text-black min-w-[1024px] font-sans">
        <style>
          {`
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .presenter-photo-print {
                /* Ensures photo prints in color if possible */
                print-color-adjust: exact !important; 
                -webkit-print-color-adjust: exact !important;
              }
            }
            .font-sans { font-family: Arial, Helvetica, sans-serif; }
            .presenter-card-print {
              border: 1px solid #ccc;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 16px;
              page-break-inside: avoid;
            }
            .presenter-photo-print {
              width: 110px; /* Increased size */
              height: 110px; /* Increased size */
              object-fit: cover;
              border-radius: 6px;
              border: 1px solid #ddd;
            }
            .photo-placeholder-print {
              width: 110px; /* Increased size */
              height: 110px; /* Increased size */
              background-color: #f0f0f0;
              border-radius: 6px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-size: 0.7rem;
              color: #888;
              border: 1px dashed #ccc;
            }
          `}
        </style>

        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-300">
          <div className="flex items-center">
            <div className="p-2 bg-gray-200 rounded-md mr-3">
              {" "}
              {/* Header icon bg color changed */}
              <Bookmark className="h-8 w-8 text-gray-700" /> {/* Header icon color changed */}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">SoundDocs</h1>{" "}
              {/* Header title color changed */}
              <p className="text-gray-600 text-md">Corporate Mic Plot</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-800">{micPlot.name}</h2>
            <p className="text-xs text-gray-500">
              Last Edited: {formatDate(micPlot.last_edited || micPlot.created_at)}
            </p>
          </div>
        </div>

        {micPlot.presenters && micPlot.presenters.length > 0 ? (
          <div className="space-y-4">
            {micPlot.presenters.map((presenter, index) => (
              <div key={presenter.id || index} className="presenter-card-print">
                <div className="flex flex-row gap-4">
                  <div className="flex-shrink-0 w-[130px]">
                    {" "}
                    {/* Adjusted width for larger photo */}
                    {presenter.photo_url ? (
                      <img
                        src={presenter.photo_url}
                        alt={presenter.presenter_name || "Presenter"}
                        className="presenter-photo-print"
                      />
                    ) : (
                      <div className="photo-placeholder-print">
                        <ImageIcon size={30} className="mb-1 text-gray-400" />{" "}
                        {/* Increased icon size */}
                        No Photo
                      </div>
                    )}
                    <h3 className="text-md font-semibold text-black mt-2 break-words w-full">
                      {presenter.presenter_name || "N/A"}
                    </h3>{" "}
                    {/* Presenter name color changed */}
                    <p className="text-xs text-gray-600 break-words w-full">
                      {presenter.session_segment || "N/A"}
                    </p>
                  </div>

                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
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
          <div className="text-center py-10">
            <p className="text-lg text-gray-500">No presenters listed for this mic plot.</p>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-gray-300">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center text-gray-700">
              {" "}
              {/* Footer text color changed */}
              <Bookmark size={14} className="mr-1.5" /> SoundDocs
            </div>
            <div className="text-gray-500">Generated on {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    );
  },
);

PrintCorporateMicPlotExport.displayName = "PrintCorporateMicPlotExport";
export default PrintCorporateMicPlotExport;
