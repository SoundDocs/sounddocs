import React, { forwardRef } from "react";
import {
  User,
  Mail,
  Phone,
  Mic,
  Volume2,
  Wrench,
  Users,
  Zap,
  Coffee,
  Bookmark,
} from "lucide-react";
import type { RiderForExport } from "../../lib/types";

interface RiderExportProps {
  rider: RiderForExport;
  forDisplay?: boolean;
}

const RiderExport = forwardRef<HTMLDivElement, RiderExportProps>(({ rider, forDisplay }, ref) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  const wrapperStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    background: "linear-gradient(to bottom, #111827, #0f172a)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  };

  if (forDisplay) {
    wrapperStyle.width = "100%";
  } else {
    wrapperStyle.width = "1600px";
    wrapperStyle.position = "absolute";
    wrapperStyle.left = "-9999px";
  }

  return (
    <div
      ref={ref}
      className="export-wrapper text-white p-8 rounded-lg shadow-xl"
      style={wrapperStyle}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center mb-8 pb-6 relative overflow-hidden"
        style={{
          borderBottom: "2px solid rgba(99, 102, 241, 0.4)",
          background: "linear-gradient(to right, rgba(15, 23, 42, 0.3), rgba(20, 30, 70, 0.2))",
          borderRadius: "10px",
          padding: "20px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%)",
            zIndex: 0,
          }}
        ></div>
        <div className="flex items-center z-10">
          <div
            className="p-3 rounded-lg mr-4"
            style={{
              background: "linear-gradient(145deg, #4f46e5, #4338ca)",
              boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)",
            }}
          >
            <Bookmark className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">SoundDocs</h1>
            <p className="text-indigo-400 font-medium">Technical Rider</p>
          </div>
        </div>
        <div className="text-right z-10">
          <h2 className="text-2xl font-bold text-white">{rider.artist_name || "Artist Name"}</h2>
          <p className="text-gray-400">
            {rider.genre && <span>{rider.genre} • </span>}
            Last Edited: {formatDate(rider.last_edited || rider.created_at)}
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center mb-4">
          <User className="h-6 w-6 text-indigo-400 mr-3" />
          <h2 className="text-2xl font-bold text-white">Primary Contact</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 text-gray-300">
          <div>
            <p className="text-sm text-gray-500 mb-1">Contact Name</p>
            <p className="font-medium">{rider.contact_name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium">{rider.contact_email || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Phone</p>
            <p className="font-medium">{rider.contact_phone || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Band Members */}
      {rider.band_members && rider.band_members.length > 0 && (
        <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 text-indigo-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Band Members</h2>
          </div>
          <div className="space-y-3">
            {rider.band_members.map((member) => (
              <div key={member.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="text-white font-medium">{member.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Instrument</p>
                    <p className="text-white font-medium">{member.instrument || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Input Needs</p>
                    <p className="text-white font-medium">{member.input_needs || "N/A"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input List */}
      {rider.input_list && rider.input_list.length > 0 && (
        <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Mic className="h-6 w-6 text-indigo-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Input/Channel List</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600 text-gray-400">
                <th className="text-left py-2 px-2">Ch #</th>
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Mic Type</th>
                <th className="text-center py-2 px-2">+48V</th>
                <th className="text-center py-2 px-2">DI</th>
                <th className="text-left py-2 px-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rider.input_list.map((input) => (
                <tr key={input.id} className="border-b border-gray-700 text-gray-300">
                  <td className="py-2 px-2 font-mono">{input.channel_number || "-"}</td>
                  <td className="py-2 px-2">{input.name || "-"}</td>
                  <td className="py-2 px-2">{input.type || "-"}</td>
                  <td className="py-2 px-2">{input.mic_type || "-"}</td>
                  <td className="py-2 px-2 text-center">{input.phantom_power ? "✓" : ""}</td>
                  <td className="py-2 px-2 text-center">{input.di_needed ? "✓" : ""}</td>
                  <td className="py-2 px-2 text-xs">{input.notes || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sound System Requirements */}
      <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center mb-4">
          <Volume2 className="h-6 w-6 text-indigo-400 mr-3" />
          <h2 className="text-2xl font-bold text-white">Sound System Requirements</h2>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-indigo-300 mb-2">PA System</p>
            <p className="text-gray-300 whitespace-pre-wrap">
              {rider.pa_requirements || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-300 mb-2">Monitor System</p>
            <p className="text-gray-300 whitespace-pre-wrap">
              {rider.monitor_requirements || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-300 mb-2">Console Requirements</p>
            <p className="text-gray-300 whitespace-pre-wrap">
              {rider.console_requirements || "Not specified"}
            </p>
          </div>
        </div>
      </div>

      {/* Backline Requirements */}
      {rider.backline_requirements && rider.backline_requirements.length > 0 && (
        <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Wrench className="h-6 w-6 text-indigo-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Venue Provided Backline</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600 text-gray-400">
                <th className="text-left py-2 px-2">Item</th>
                <th className="text-left py-2 px-2">Quantity</th>
                <th className="text-left py-2 px-2">Specifications</th>
              </tr>
            </thead>
            <tbody>
              {rider.backline_requirements.map((item) => (
                <tr key={item.id} className="border-b border-gray-700 text-gray-300">
                  <td className="py-2 px-2">{item.item || "-"}</td>
                  <td className="py-2 px-2">{item.quantity || "-"}</td>
                  <td className="py-2 px-2 text-xs">{item.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Artist Provided Gear */}
      {rider.artist_provided_gear && rider.artist_provided_gear.length > 0 && (
        <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Wrench className="h-6 w-6 text-indigo-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Artist Provided Equipment</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600 text-gray-400">
                <th className="text-left py-2 px-2">Item</th>
                <th className="text-left py-2 px-2">Quantity</th>
                <th className="text-left py-2 px-2">Specifications</th>
              </tr>
            </thead>
            <tbody>
              {rider.artist_provided_gear.map((item) => (
                <tr key={item.id} className="border-b border-gray-700 text-gray-300">
                  <td className="py-2 px-2">{item.item || "-"}</td>
                  <td className="py-2 px-2">{item.quantity || "-"}</td>
                  <td className="py-2 px-2 text-xs">{item.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Technical Staff */}
      {rider.required_staff && rider.required_staff.length > 0 && (
        <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 text-indigo-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Required Technical Staff</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600 text-gray-400">
                <th className="text-left py-2 px-2">Role</th>
                <th className="text-left py-2 px-2">Quantity</th>
                <th className="text-left py-2 px-2">Requirements</th>
              </tr>
            </thead>
            <tbody>
              {rider.required_staff.map((staff) => (
                <tr key={staff.id} className="border-b border-gray-700 text-gray-300">
                  <td className="py-2 px-2">{staff.role || "-"}</td>
                  <td className="py-2 px-2">{staff.quantity || "-"}</td>
                  <td className="py-2 px-2 text-xs">{staff.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Special Requirements */}
      <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center mb-4">
          <Zap className="h-6 w-6 text-indigo-400 mr-3" />
          <h2 className="text-2xl font-bold text-white">Special Requirements</h2>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-indigo-300 mb-2">Stage & Production</p>
            <p className="text-gray-300 whitespace-pre-wrap">
              {rider.special_requirements || "None specified"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-300 mb-2">Power Requirements</p>
            <p className="text-gray-300 whitespace-pre-wrap">
              {rider.power_requirements || "Standard power"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-300 mb-2">Lighting</p>
            <p className="text-gray-300 whitespace-pre-wrap">
              {rider.lighting_notes || "Standard lighting"}
            </p>
          </div>
        </div>
      </div>

      {/* Hospitality */}
      {rider.hospitality_notes && (
        <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center mb-4">
            <Coffee className="h-6 w-6 text-indigo-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Hospitality</h2>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap">{rider.hospitality_notes}</p>
        </div>
      )}

      {/* Additional Notes */}
      {rider.additional_notes && (
        <div className="mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-3">Additional Notes</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{rider.additional_notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-700 text-center text-sm text-gray-500">
        <p>Generated with SoundDocs • {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
});

RiderExport.displayName = "RiderExport";

export default RiderExport;
