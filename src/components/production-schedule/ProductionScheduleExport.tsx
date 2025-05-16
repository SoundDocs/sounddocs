import React, { forwardRef } from "react";
import {
  Bookmark,
  Calendar,
  // MapPin, // Not used directly, can remove if not needed elsewhere
  // Users, // Not used directly
  // Settings, // Not used directly
  Clock,
  ListChecks,
  Palette,
  UserCheck,
  Building,
  // Phone, // Not used directly
  // Mail, // Not used directly
  UserCog,
  Briefcase, // For Job Number
  UserCircle, // For Project Manager / Account Manager
} from "lucide-react";

interface ProductionScheduleInfo {
  event_name?: string;
  event_type?: string;
  date?: string;
  event_start?: string;
  event_end?: string;
  load_in?: string;
  sound_check?: string;
  venue?: string;
  room?: string;
  address?: string;
  client_artist?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  production_manager?: string;
  project_manager?: string; 
  job_number?: string;     
  account_manager?: string; 
  foh_engineer?: string;
  monitor_engineer?: string;
}

interface ProductionSchedule {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  info?: ProductionScheduleInfo;
  crew_key?: Array<{ id: string; name: string; color: string }>;
  schedule_items?: Array<{
    id: string;
    start_time: string;
    end_time: string;
    activity: string;
    notes: string;
    crew_ids: string[];
  }>;
}

interface ProductionScheduleExportProps {
  schedule: ProductionSchedule;
}

const ProductionScheduleExport = forwardRef<HTMLDivElement, ProductionScheduleExportProps>(
  ({ schedule }, ref) => {
    const info = schedule.info || {};
    const crewKey = schedule.crew_key || [];
    const scheduleItems = schedule.schedule_items || [];

    const formatDate = (dateString?: string) => {
      if (!dateString) return "N/A";
      try {
        // Check if it's just a date string (YYYY-MM-DD) or full ISO
        if (dateString.length === 10 && dateString.includes('-')) {
            const [year, month, day] = dateString.split('-');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        }
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
        if (!timeString) return "";
        if (/^\d{2}:\d{2}$/.test(timeString)) {
            return timeString;
        }
        try {
            return new Date(timeString).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false, 
            });
        } catch (e) {
            return timeString; 
        }
    };

    const getCrewDetails = (crewId: string) => {
      return crewKey.find(crew => crew.id === crewId);
    };

    return (
      <div
        ref={ref}
        className="export-wrapper text-white p-8 rounded-lg shadow-xl"
        style={{
          width: "1600px", 
          position: "absolute",
          left: "-9999px", 
          fontFamily: "Inter, sans-serif",
          background: "linear-gradient(to bottom, #111827, #0f172a)", 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
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
              <p className="text-indigo-400 font-medium">Professional Audio Documentation</p>
            </div>
          </div>
          <div className="text-right z-10">
            <h2 className="text-2xl font-bold text-white">{schedule.name}</h2>
            <p className="text-gray-400">
              Last Edited: {formatDate(schedule.last_edited || schedule.created_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/80 p-6 rounded-lg shadow-md" style={{ borderLeft: "4px solid #4f46e5" }}>
            <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
              <Calendar className="h-5 w-5 mr-2" /> Event Details
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {info.event_name && (<div><strong className="text-gray-400 block">Event:</strong> {info.event_name}</div>)}
              {info.job_number && (<div><strong className="text-gray-400 block">Job #:</strong> {info.job_number}</div>)}
              {info.event_type && (<div><strong className="text-gray-400 block">Type:</strong> {info.event_type}</div>)}
              {info.date && (<div><strong className="text-gray-400 block">Date:</strong> {formatDate(info.date)}</div>)}
              {(info.event_start || info.event_end) && (
                <div><strong className="text-gray-400 block">Time:</strong> 
                {formatTime(info.event_start)} {info.event_start && info.event_end ? `- ${formatTime(info.event_end)}` : ""}
                </div>
              )}
              {info.load_in && (<div><strong className="text-gray-400 block">Load In:</strong> {formatTime(info.load_in)}</div>)}
              {info.sound_check && (<div><strong className="text-gray-400 block">Sound Check:</strong> {formatTime(info.sound_check)}</div>)}
            </div>
          </div>

          <div className="bg-gray-800/80 p-6 rounded-lg shadow-md" style={{ borderLeft: "4px solid #4f46e5" }}>
            <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
              <Building className="h-5 w-5 mr-2" /> Venue & Client
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {info.venue && (<div><strong className="text-gray-400 block">Venue:</strong> {info.venue}</div>)}
              {info.room && (<div><strong className="text-gray-400 block">Room:</strong> {info.room}</div>)}
              {info.address && (<div className="col-span-2"><strong className="text-gray-400 block">Address:</strong> {info.address}</div>)}
              {info.client_artist && (<div><strong className="text-gray-400 block">Client/Artist:</strong> {info.client_artist}</div>)}
              {info.account_manager && (<div><strong className="text-gray-400 block">Account Manager:</strong> {info.account_manager}</div>)}
            </div>
          </div>
          
           {(info.contact_name || info.contact_email || info.contact_phone) && (
            <div className="bg-gray-800/80 p-6 rounded-lg shadow-md" style={{ borderLeft: "4px solid #4f46e5" }}>
                <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
                <UserCheck className="h-5 w-5 mr-2" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 gap-y-3 text-sm">
                {info.contact_name && (<div><strong className="text-gray-400 block">Name:</strong> {info.contact_name}</div>)}
                {info.contact_email && (<div><strong className="text-gray-400 block">Email:</strong> <a href={`mailto:${info.contact_email}`} className="text-indigo-300 hover:underline">{info.contact_email}</a></div>)}
                {info.contact_phone && (<div><strong className="text-gray-400 block">Phone:</strong> <a href={`tel:${info.contact_phone}`} className="text-indigo-300 hover:underline">{info.contact_phone}</a></div>)}
                </div>
            </div>
           )}

          {(info.production_manager || info.project_manager || info.foh_engineer || info.monitor_engineer) && (
            <div className="bg-gray-800/80 p-6 rounded-lg shadow-md" style={{ borderLeft: "4px solid #4f46e5" }}>
                <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
                <UserCog className="h-5 w-5 mr-2" /> Technical Staff
                </h3>
                <div className="grid grid-cols-1 gap-y-3 text-sm">
                {info.production_manager && (<div><strong className="text-gray-400 block">Production Manager:</strong> {info.production_manager}</div>)}
                {info.project_manager && (<div><strong className="text-gray-400 block">Project Manager:</strong> {info.project_manager}</div>)}
                {info.foh_engineer && (<div><strong className="text-gray-400 block">FOH Engineer:</strong> {info.foh_engineer}</div>)}
                {info.monitor_engineer && (<div><strong className="text-gray-400 block">Monitor Engineer:</strong> {info.monitor_engineer}</div>)}
                </div>
            </div>
          )}
        </div>

        {crewKey.length > 0 && (
          <div className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8" style={{ borderLeft: "4px solid #4f46e5" }}>
            <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
              <Palette className="h-5 w-5 mr-2" /> Crew Key
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {crewKey.map((crew) => (
                <div key={crew.id} className="flex items-center">
                  <span
                    className="w-4 h-4 rounded-sm mr-2 border border-gray-600"
                    style={{ backgroundColor: crew.color }}
                  ></span>
                  <span className="text-sm">{crew.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-800/80 p-6 rounded-lg shadow-md" style={{ borderLeft: "4px solid #4f46e5" }}>
          <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-6">
            <ListChecks className="h-5 w-5 mr-2" /> Production Schedule
          </h3>
          {scheduleItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: "linear-gradient(to right, #2d3748, #1e293b)", borderBottom: "2px solid rgba(99, 102, 241, 0.4)" }}>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm">Start</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm">End</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm">Activity</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm">Notes</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm">Crew</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleItems.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        background: index % 2 === 0 ? "rgba(31, 41, 55, 0.7)" : "rgba(45, 55, 72, 0.4)",
                        borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                      }}
                    >
                      <td className="py-3 px-4 text-white align-middle text-sm">{formatTime(item.start_time)}</td>
                      <td className="py-3 px-4 text-white align-middle text-sm">{formatTime(item.end_time)}</td>
                      <td className="py-3 px-4 text-white align-middle text-sm font-medium">{item.activity}</td>
                      <td className="py-3 px-4 text-gray-300 align-middle text-sm" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{item.notes}</td>
                      <td className="py-3 px-4 text-white align-middle text-sm">
                        <div className="flex flex-wrap gap-1">
                          {item.crew_ids?.map(crewId => {
                            const crewMember = getCrewDetails(crewId);
                            return crewMember ? (
                              <span
                                key={crewId}
                                className="px-2 py-0.5 rounded-full text-xs font-medium border"
                                style={{
                                  backgroundColor: `${crewMember.color}33`, 
                                  borderColor: crewMember.color,
                                  color: crewMember.color, 
                                }}
                              >
                                {crewMember.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No schedule items defined.</p>
          )}
        </div>

        <div className="relative mt-12 pt-6 overflow-hidden">
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to right, rgba(31, 41, 55, 0.5), rgba(31, 41, 55, 0.7))",
              borderTop: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "8px",
              zIndex: -1,
            }}
          ></div>
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center">
              <div
                className="p-2 rounded-md mr-2"
                style={{
                  background: "linear-gradient(145deg, #4f46e5, #4338ca)",
                  boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)",
                }}
              >
                <Bookmark className="h-5 w-5 text-white" />
              </div>
              <span className="text-indigo-400 font-medium">SoundDocs</span>
            </div>
            <div className="text-gray-400 text-sm flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>Generated on {new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "-30px",
              right: "-30px",
              opacity: "0.05",
              transform: "rotate(-15deg)",
              zIndex: -1,
            }}
          >
            <Bookmark className="h-40 w-40 text-gray-500" />
          </div>
        </div>
      </div>
    );
  }
);

ProductionScheduleExport.displayName = "ProductionScheduleExport";
export default ProductionScheduleExport;
