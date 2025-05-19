import React, { forwardRef } from "react";
import {
  Bookmark,
  Calendar,
  Clock,
  ListChecks,
  Palette,
  UserCheck, 
  Building, 
  Phone, 
  Mail, 
  UserSquare, 
  CalendarDays,
  Users as UsersIcon,
} from "lucide-react";
import { ScheduleForExport, DetailedScheduleItem } from "../../pages/ProductionScheduleEditor"; 
import { CrewKeyItem } from "./ProductionScheduleCrewKey";

interface ProductionScheduleExportProps {
  schedule: ScheduleForExport; 
}

const ProductionScheduleExport = forwardRef<HTMLDivElement, ProductionScheduleExportProps>(
  ({ schedule }, ref) => {
    
    console.log("[Export] Received schedule prop:", schedule ? JSON.parse(JSON.stringify(schedule)) : schedule);

    const info = schedule?.info || {};
    const crewKey = schedule?.crew_key || [];
    const laborScheduleItems = schedule?.labor_schedule_items || []; 
    
    let detailedScheduleItemsToUse: DetailedScheduleItem[] = [];
    if (schedule && Array.isArray(schedule.detailed_schedule_items)) {
      detailedScheduleItemsToUse = schedule.detailed_schedule_items;
      console.log("[Export] Using schedule.detailed_schedule_items.");
    } else {
      console.log("[Export] schedule.detailed_schedule_items is missing or not an array.");
    }
    console.log("[Export] Extracted detailed_schedule_items (after robust check):", JSON.parse(JSON.stringify(detailedScheduleItemsToUse)));


    const formatDate = (dateString?: string, options?: Intl.DateTimeFormatOptions) => {
      if (!dateString || dateString.trim() === "") return "N/A";
      const defaultOptions: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
      const effectiveOptions = { ...defaultOptions, ...options };
      
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        try {
          const date = new Date(dateString + 'T00:00:00Z'); 
          return date.toLocaleDateString("en-US", effectiveOptions);
        } catch (e) { 
          console.error("Error formatting YYYY-MM-DD date:", e);
          return dateString; 
        } 
      }
      try {
        return new Date(dateString).toLocaleDateString("en-US", effectiveOptions);
      } catch (e) { 
        console.error("Error formatting date string:", e);
        return dateString; 
      } 
    };
    
    const formatTime = (timeString?: string) => {
        if (!timeString || timeString.trim() === "") return ""; 
        if (/^\d{2}:\d{2}$/.test(timeString)) { 
            return timeString;
        }
        try {
            const d = new Date(`1970-01-01T${timeString}Z`); 
            if(isNaN(d.getTime())) { 
                 const fullDate = new Date(timeString);
                 if(isNaN(fullDate.getTime())) return timeString; 
                 return fullDate.toLocaleTimeString("en-US", {
                    hour: "2-digit", minute: "2-digit", hour12: false, 
                });
            }
            return d.toLocaleTimeString("en-US", {
                hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" 
            });
        } catch (e) {
            const dateMatch = timeString.match(/\d{2}:\d{2}/);
            if (dateMatch) return dateMatch[0];
            return timeString; 
        }
    };
    
    const getCrewDisplay = (crewIds: string[], crewKeyData: CrewKeyItem[]) => {
      if (!crewIds || crewIds.length === 0) return <span className="text-gray-400">-</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {crewIds.map(id => {
            const crewMember = crewKeyData.find(c => c.id === id);
            if (!crewMember) return <span key={id} className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded-full">Unknown</span>;
            return (
              <span 
                key={id} 
                className="text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center"
                style={{ backgroundColor: `${crewMember.color}40`, color: crewMember.color }}
              >
                 <span className="w-2 h-2 rounded-full mr-1.5" style={{backgroundColor: crewMember.color}}></span>
                {crewMember.name}
              </span>
            );
          })}
        </div>
      );
    };

    const groupAndSortDetailedItems = (items: DetailedScheduleItem[]) => {
      console.log("[Export] groupAndSortDetailedItems input:", JSON.parse(JSON.stringify(items)));
      const groups: Record<string, DetailedScheduleItem[]> = {};
      (items || []).forEach(item => { 
        const dateStr = item.date || 'No Date Assigned';
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(item);
      });
      for (const dateKey in groups) {
        groups[dateKey].sort((a, b) => (a.start_time || "00:00").localeCompare(b.start_time || "00:00"));
      }
      const sortedGroups = Object.entries(groups).sort(([dateA], [dateB]) => {
        if (dateA === 'No Date Assigned') return 1;
        if (dateB === 'No Date Assigned') return -1;
        try { return new Date(dateA + 'T00:00:00Z').getTime() - new Date(dateB + 'T00:00:00Z').getTime(); } 
        catch (e) { return 0; }
      });
      console.log("[Export] groupAndSortDetailedItems output (grouped and sorted):", JSON.parse(JSON.stringify(sortedGroups)));
      return sortedGroups;
    };
    
    const groupedDetailedScheduleItems = groupAndSortDetailedItems(detailedScheduleItemsToUse);

    const sortedLaborScheduleItems = [...(laborScheduleItems || [])].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      const timeInA = a.time_in || '';
      const timeInB = b.time_in || '';
      if (timeInA < timeInB) return -1;
      if (timeInA > timeInB) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
    
    let currentLaborDayFormatted = ""; 

    console.log("[Export] Rendering with groupedDetailedScheduleItems count:", groupedDetailedScheduleItems.length);

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
              position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%)",
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
            <h2 className="text-2xl font-bold text-white">{schedule?.name || "Untitled Schedule"}</h2>
            <p className="text-gray-400">
              Last Edited: {formatDate(schedule?.last_edited || schedule?.created_at)}
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
              {info.date && formatDate(info.date) !== "N/A" && (<div><strong className="text-gray-400 block">Date:</strong> {formatDate(info.date)}</div>)}
              {(info.event_start || info.event_end) && (formatTime(info.event_start) || formatTime(info.event_end)) && (
                <div><strong className="text-gray-400 block">Event Time:</strong> 
                {formatTime(info.event_start)} {formatTime(info.event_start) && formatTime(info.event_end) ? `- ${formatTime(info.event_end)}` : formatTime(info.event_end)}
                </div>
              )}
              {info.load_in && formatTime(info.load_in) && (<div><strong className="text-gray-400 block">Load In:</strong> {formatTime(info.load_in)}</div>)}
              {info.strike_datetime && (formatDate(info.strike_datetime) !== "N/A" || formatTime(info.strike_datetime)) && (<div><strong className="text-gray-400 block">Strike:</strong> {formatDate(info.strike_datetime)} {formatTime(info.strike_datetime)}</div>)}
            </div>
          </div>

          <div className="bg-gray-800/80 p-6 rounded-lg shadow-md" style={{ borderLeft: "4px solid #4f46e5" }}>
            <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
              <Building className="h-5 w-5 mr-2" /> Venue &amp; Management
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {info.venue && (<div><strong className="text-gray-400 block">Venue:</strong> {info.venue}</div>)}
              {info.project_manager && (<div><strong className="text-gray-400 block">Project Manager:</strong> {info.project_manager}</div>)}
              {info.production_manager && (<div><strong className="text-gray-400 block">Production Manager:</strong> {info.production_manager}</div>)}
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
                  <span className="text-sm">{crew.name || "Unnamed Crew"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {groupedDetailedScheduleItems.length > 0 && (
          <div className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8" style={{ borderLeft: "4px solid #4f46e5" }}>
            <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-6">
              <ListChecks className="h-5 w-5 mr-2" /> Detailed Production Schedule
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: "linear-gradient(to right, #2d3748, #1e293b)", borderBottom: "2px solid rgba(99, 102, 241, 0.4)" }}>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm w-[8%]">Start</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm w-[8%]">End</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm w-[30%]">Activity</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm w-[30%]">Notes</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm w-[24%]">Crew</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedDetailedScheduleItems.map(([dateKey, itemsInGroup], groupIndex) => {
                    console.log(`[Export] Rendering group ${groupIndex} for date: ${dateKey}, items count: ${itemsInGroup.length}`);
                    return (
                    <React.Fragment key={dateKey}>
                      <tr style={{ background: "rgba(45, 55, 72, 0.6)", borderTop: "2px solid rgba(99, 102, 241, 0.3)", borderBottom: "1px solid rgba(99, 102, 241, 0.2)" }}>
                        <td colSpan={5} className="py-2 px-4 text-white font-semibold text-sm flex items-center whitespace-nowrap">
                          <CalendarDays size={16} className="mr-2 text-indigo-300 flex-shrink-0" />
                          {formatDate(dateKey, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </td>
                      </tr>
                      {itemsInGroup.map((item, index) => {
                        console.log(`[Export] Rendering item ${index} in group ${groupIndex}:`, JSON.parse(JSON.stringify(item)));
                        return (
                        <tr
                          key={item.id}
                          style={{
                            background: index % 2 === 0 ? "rgba(31, 41, 55, 0.7)" : "rgba(45, 55, 72, 0.4)",
                            borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                          }}
                        >
                          <td className="py-3 px-4 text-white align-top text-sm">{formatTime(item.start_time) || "-"}</td>
                          <td className="py-3 px-4 text-white align-top text-sm">{formatTime(item.end_time) || "-"}</td>
                          <td className="py-3 px-4 text-white align-top text-sm" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{item.activity || "-"}</td>
                          <td className="py-3 px-4 text-gray-300 align-top text-sm" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{item.notes || "-"}</td>
                          <td className="py-3 px-4 text-white align-top text-sm">{getCrewDisplay(item.assigned_crew_ids, crewKey)}</td>
                        </tr>
                        );
                      })}
                    </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {sortedLaborScheduleItems.length > 0 && (
          <div className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8" style={{ borderLeft: "4px solid #4f46e5" }}>
            <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-6">
              <UsersIcon className="h-5 w-5 mr-2" /> Labor Schedule
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: "linear-gradient(to right, #2d3748, #1e293b)", borderBottom: "2px solid rgba(99, 102, 241, 0.4)" }}>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm">Name</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm">Position</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm">Date</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm">Time In</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm">Time Out</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle text-sm">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLaborScheduleItems.map((item, index) => {
                    const itemDayDisplay = formatDate(item.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    const showDayHeader = item.date && itemDayDisplay !== "N/A" && itemDayDisplay !== currentLaborDayFormatted;
                    if (showDayHeader) {
                      currentLaborDayFormatted = itemDayDisplay;
                    }
                    return (
                      <React.Fragment key={item.id}>
                        {showDayHeader && (
                          <tr style={{ background: "rgba(45, 55, 72, 0.6)", borderTop: "2px solid rgba(99, 102, 241, 0.3)", borderBottom: "1px solid rgba(99, 102, 241, 0.2)" }}>
                            <td colSpan={6} className="py-2 px-4 text-white font-semibold text-sm flex items-center whitespace-nowrap">
                                <CalendarDays size={16} className="mr-2 text-indigo-300 flex-shrink-0" />
                                {currentLaborDayFormatted}
                            </td>
                          </tr>
                        )}
                        <tr
                          style={{
                            background: index % 2 === 0 ? "rgba(31, 41, 55, 0.7)" : "rgba(45, 55, 72, 0.4)",
                            borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                          }}
                        >
                          <td className="py-3 px-4 text-white align-middle text-sm font-medium">{item.name || "-"}</td>
                          <td className="py-3 px-4 text-white align-middle text-sm">{item.position || "-"}</td>
                          <td className="py-3 px-4 text-white align-middle text-sm">{formatDate(item.date, { month: 'short', day: 'numeric' })}</td>
                          <td className="py-3 px-4 text-white align-middle text-sm">{formatTime(item.time_in) || "-"}</td>
                          <td className="py-3 px-4 text-white align-middle text-sm">{formatTime(item.time_out) || "-"}</td>
                          <td className="py-3 px-4 text-gray-300 align-middle text-sm" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{item.notes || "-"}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}


        <div className="relative mt-12 pt-6 overflow-hidden">
          <div
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to right, rgba(31, 41, 55, 0.5), rgba(31, 41, 55, 0.7))",
              borderTop: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "8px", zIndex: -1,
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
              position: "absolute", bottom: "-30px", right: "-30px", opacity: "0.05",
              transform: "rotate(-15deg)", zIndex: -1,
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
