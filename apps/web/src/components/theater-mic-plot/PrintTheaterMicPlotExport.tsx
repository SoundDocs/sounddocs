import React, { forwardRef } from "react";
import {
  Drama, // Theater icon
  Calendar,
  User,
  Users as CharacterIcon,
  Mic,
  Palette,
  MapPin, // Using for transmitter/element location
  RefreshCw, // For backup element
  Tv, // For scene numbers
  Shirt, // For costume notes
  Scissors, // For wig/hair notes
  ImageIcon, // For photo placeholder
} from "lucide-react";
import { ActorEntry } from "./ActorEntryCard";

interface TheaterMicPlot {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  actors?: ActorEntry[];
}

interface PrintTheaterMicPlotExportProps {
  micPlot: TheaterMicPlot;
}

const PrintTheaterMicPlotExport = forwardRef<HTMLDivElement, PrintTheaterMicPlotExportProps>(
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

    const renderField = (
      IconComponent: React.ElementType,
      label: string,
      value?: string | null,
      fullWidth: boolean = false,
    ) => {
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return null;
      }

      return (
        <div className={`flex items-start text-xs mb-2 ${fullWidth ? "col-span-2" : ""}`}>
          <IconComponent size={14} className="text-gray-700 mr-2 mt-px flex-shrink-0" />
          <div className="flex-grow min-w-0">
            <span className="font-semibold text-gray-700">{label}:</span>
            <span className="ml-1 text-black break-words whitespace-pre-wrap">{String(value)}</span>
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
                  .actor-photo-print {
                    print-color-adjust: exact !important; 
                    -webkit-print-color-adjust: exact !important;
                  }
                }
                .font-sans { font-family: Arial, Helvetica, sans-serif; }
                .actor-card-print {
                  border: 1px solid #ccc;
                  border-radius: 8px;
                  padding: 16px;
                  margin-bottom: 16px;
                  page-break-inside: avoid;
                }
                .actor-photo-print {
                  width: 110px;
                  height: 110px;
                  object-fit: cover;
                  border-radius: 6px;
                  border: 1px solid #ddd;
                }
                .photo-placeholder-print {
                  width: 110px;
                  height: 110px;
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
              <Drama className="h-8 w-8 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">SoundDocs</h1>
              <p className="text-gray-600 text-md">Theater Mic Plot</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-800">{micPlot.name}</h2>
            <p className="text-xs text-gray-500">
              Last Edited: {formatDate(micPlot.last_edited || micPlot.created_at)}
            </p>
          </div>
        </div>

        {micPlot.actors && micPlot.actors.length > 0 ? (
          <div className="space-y-4">
            {micPlot.actors.map((actor, index) => (
              <div key={actor.id || index} className="actor-card-print">
                <div className="flex flex-row gap-4">
                  <div className="flex-shrink-0 w-[130px]">
                    {actor.photo_url ? (
                      <img
                        src={actor.photo_url}
                        alt={actor.actor_name || "Actor"}
                        className="actor-photo-print"
                      />
                    ) : (
                      <div className="photo-placeholder-print">
                        <ImageIcon size={30} className="mb-1 text-gray-400" />
                        No Photo
                      </div>
                    )}
                    <h3 className="text-md font-semibold text-black mt-2 break-words w-full">
                      {actor.actor_name || "N/A"}
                    </h3>
                    {actor.character_names && (
                      <p className="text-xs text-gray-600 break-words w-full">
                        {actor.character_names}
                      </p>
                    )}
                  </div>

                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                    {renderField(Mic, "Element/Channel #", actor.element_channel_number)}
                    {renderField(Palette, "Element Color", actor.element_color)}
                    {renderField(MapPin, "Transmitter Location", actor.transmitter_location)}
                    {renderField(MapPin, "Element Location", actor.element_location)}
                    {renderField(RefreshCw, "Backup Element", actor.backup_element)}
                    {renderField(Tv, "Scene Numbers", actor.scene_numbers)}
                    {renderField(Shirt, "Costume Notes", actor.costume_notes, true)}
                    {renderField(Scissors, "Wig/Hair Notes", actor.wig_hair_notes, true)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Users className="mx-auto text-gray-500 mb-4 h-10 w-10" />
            <p className="text-lg text-gray-500">No actors listed for this mic plot.</p>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-gray-300">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center text-gray-700">
              <Drama size={14} className="mr-1.5" /> SoundDocs
            </div>
            <div className="text-gray-500">Generated on {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    );
  },
);

PrintTheaterMicPlotExport.displayName = "PrintTheaterMicPlotExport";
export default PrintTheaterMicPlotExport;
