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
import { ActorEntry } from "./ActorEntryCard"; // Assuming this is the correct path and export

interface TheaterMicPlot {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  actors?: ActorEntry[];
}

interface TheaterMicPlotExportProps {
  micPlot: TheaterMicPlot;
}

const TheaterMicPlotExport = forwardRef<HTMLDivElement, TheaterMicPlotExportProps>(
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
        <div className={`flex items-start text-sm mb-3 ${fullWidth ? "col-span-2" : ""}`}>
          <IconComponent size={16} className="text-purple-400 mr-3 mt-px flex-shrink-0" />
          <div className="flex-grow min-w-0">
            <span className="font-semibold text-gray-400">{label}:</span>
            <span className="ml-1.5 text-gray-200 break-words whitespace-pre-wrap">
              {String(value)}
            </span>
          </div>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className="p-10 bg-gradient-to-br from-gray-900 to-slate-800 text-white min-w-[1000px] font-inter"
      >
        <style>
          {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                .font-inter { font-family: 'Inter', sans-serif; }
                .actor-card {
                  background: linear-gradient(145deg, rgba(42, 32, 68, 0.7), rgba(60, 45, 90, 0.5)); /* Purpleish gradient */
                  border: 1px solid rgba(128, 90, 213, 0.5); /* Purple border */
                  border-radius: 12px;
                  padding: 20px;
                  margin-bottom: 20px;
                  box-shadow: 0 10px 20px rgba(0,0,0,0.3), 0 6px 6px rgba(0,0,0,0.25);
                }
                .actor-photo {
                  width: 140px;
                  height: 140px;
                  object-fit: cover;
                  border-radius: 8px;
                  border: 2px solid rgba(167, 139, 250, 0.7); /* Lighter purple border */
                  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
                .photo-placeholder {
                  width: 140px;
                  height: 140px;
                  background-color: rgba(55, 65, 81, 0.8);
                  border-radius: 8px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  font-size: 0.8rem;
                  color: #9CA3AF;
                  border: 2px dashed rgba(128, 90, 213, 0.7); /* Purple dashed border */
                }
              `}
        </style>

        <div className="flex justify-between items-center mb-10 pb-6 border-b-2 border-purple-500/40">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg mr-4 shadow-lg">
              <Drama className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-purple-400">SoundDocs</h1>
              <p className="text-purple-300 font-medium text-lg">Theater Mic Plot</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-100">{micPlot.name}</h2>
            <p className="text-sm text-gray-400">
              Last Edited: {formatDate(micPlot.last_edited || micPlot.created_at)}
            </p>
          </div>
        </div>

        {micPlot.actors && micPlot.actors.length > 0 ? (
          <div className="space-y-6">
            {micPlot.actors.map((actor, index) => (
              <div key={actor.id || index} className="actor-card">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-shrink-0 sm:w-[180px] flex flex-col items-center sm:items-start">
                    {actor.photo_url ? (
                      <img
                        src={actor.photo_url}
                        alt={actor.actor_name || "Actor"}
                        className="actor-photo"
                      />
                    ) : (
                      <div className="photo-placeholder">
                        <ImageIcon size={40} className="mb-1 text-gray-500" />
                        No Photo
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-purple-300 mt-3 text-center sm:text-left break-words w-full">
                      {actor.actor_name || "Unnamed Actor"}
                    </h3>
                    {actor.character_names && (
                      <p className="text-sm text-gray-400 text-center sm:text-left break-words w-full">
                        {actor.character_names}
                      </p>
                    )}
                  </div>

                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
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
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-600 mb-4 h-12 w-12" />
            <p className="text-xl text-gray-500">No actors listed for this mic plot.</p>
          </div>
        )}

        <div className="mt-12 pt-8 border-t-2 border-purple-500/40">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center text-purple-400">
              <Drama size={18} className="mr-2" /> SoundDocs Professional Audio Documentation
            </div>
            <div className="text-gray-500">Generated on {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    );
  },
);

TheaterMicPlotExport.displayName = "TheaterMicPlotExport";
export default TheaterMicPlotExport;
