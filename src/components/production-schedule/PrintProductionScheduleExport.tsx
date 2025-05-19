import React, { forwardRef } from "react";
import { Calendar, ListChecks, Palette, UserCheck, Building, Phone, Mail, UserSquare, CalendarDays, Users as UsersIcon } from "lucide-react"; 
import { ScheduleForExport, DetailedScheduleItem } from "../../pages/ProductionScheduleEditor"; 
import { CrewKeyItem } from "./ProductionScheduleCrewKey";

interface PrintProductionScheduleExportProps {
  schedule: ScheduleForExport; 
}

const PrintProductionScheduleExport = forwardRef<HTMLDivElement, PrintProductionScheduleExportProps>(
  ({ schedule }, ref) => {

    console.log("[PrintExport] Received schedule prop:", schedule ? JSON.parse(JSON.stringify(schedule)) : schedule);

    const info = schedule?.info || {};
    const crewKey = schedule?.crew_key || [];
    const laborScheduleItems = schedule?.labor_schedule_items || []; 
    
    let detailedScheduleItemsToUse: DetailedScheduleItem[] = [];
    if (schedule && Array.isArray(schedule.detailed_schedule_items)) {
      detailedScheduleItemsToUse = schedule.detailed_schedule_items;
      console.log("[PrintExport] Using schedule.detailed_schedule_items.");
    } else {
      console.log("[PrintExport] schedule.detailed_schedule_items is missing or not an array.");
    }
    console.log("[PrintExport] Extracted detailed_schedule_items (after robust check):", JSON.parse(JSON.stringify(detailedScheduleItemsToUse)));


    const formatDate = (dateString?: string, options?: Intl.DateTimeFormatOptions) => {
      if (!dateString || dateString.trim() === "") return "N/A";
      const defaultOptions: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
      const effectiveOptions = { ...defaultOptions, ...options };

      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
         try {
          const date = new Date(dateString + 'T00:00:00Z'); 
          return date.toLocaleDateString("en-US", effectiveOptions);
        } catch (e) { 
          console.error("Error formatting YYYY-MM-DD date (print):", e);
          return dateString; 
        }
      }
      try {
        return new Date(dateString).toLocaleDateString("en-US", effectiveOptions);
      } catch (e) { 
        console.error("Error formatting date string (print):", e);
        return dateString; 
      }
    };

    const formatTime = (timeString?: string) => {
        if (!timeString || timeString.trim() === "") return "";
        if (/^\d{2}:\d{2}$/.test(timeString)) { return timeString; }
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

    const getCrewNames = (crewIds: string[], crewKeyData: CrewKeyItem[]): string => {
      if (!crewIds || crewIds.length === 0) return "-";
      return crewIds
        .map(id => crewKeyData.find(c => c.id === id)?.name || "Unknown")
        .join(", ");
    };

    const groupAndSortDetailedItems = (items: DetailedScheduleItem[]) => {
      console.log("[PrintExport] groupAndSortDetailedItems input:", JSON.parse(JSON.stringify(items)));
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
      console.log("[PrintExport] groupAndSortDetailedItems output (grouped and sorted):", JSON.parse(JSON.stringify(sortedGroups)));
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
    console.log("[PrintExport] Rendering with groupedDetailedScheduleItems count:", groupedDetailedScheduleItems.length);

    return (
      <div
        ref={ref}
        className="export-wrapper print-version"
        style={{
          width: "1200px", 
          position: "absolute",
          left: "-9999px",
          fontFamily: "Arial, sans-serif",
          backgroundColor: "white",
          color: "#000", 
          padding: "40px",
        }}
      >
        <div style={{ borderBottom: "2px solid #ccc", paddingBottom: "20px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>SoundDocs</h1>
            <p style={{ fontSize: "14px", color: "#555", margin: "5px 0 0 0" }}>Production Schedule</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{schedule?.name || "Untitled Schedule"}</h2>
            <p style={{ fontSize: "14px", color: "#555", margin: "5px 0 0 0" }}>
              Last Edited: {formatDate(schedule?.last_edited || schedule?.created_at)}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: "20px", fontSize: "13px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "10px" }}>
                <Calendar size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} /> Event Details
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                    {info.event_name && (<tr><td style={{padding: "4px 0", fontWeight: "bold", width: "150px"}}>Event:</td><td>{info.event_name}</td></tr>)}
                    {info.job_number && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Job #:</td><td>{info.job_number}</td></tr>)}
                    {info.date && formatDate(info.date) !== "N/A" && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Date:</td><td>{formatDate(info.date)}</td></tr>)}
                    {/* Event Time Removed */}
                    {info.load_in && formatTime(info.load_in) && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Load In:</td><td>{formatTime(info.load_in)}</td></tr>)}
                    {info.strike_datetime && (formatDate(info.strike_datetime) !== "N/A" || formatTime(info.strike_datetime)) && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Strike:</td><td>{formatDate(info.strike_datetime)} {formatTime(info.strike_datetime)}</td></tr>)}
                </tbody>
            </table>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginBottom: "20px", fontSize: "13px" }}>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "10px" }}>
                    <Building size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} /> Venue &amp; Management
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        {info.venue && (<tr><td style={{padding: "4px 0", fontWeight: "bold", width: "150px"}}>Venue:</td><td>{info.venue}</td></tr>)}
                        {info.project_manager && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Project Manager:</td><td>{info.project_manager}</td></tr>)}
                        {info.production_manager && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Production Manager:</td><td>{info.production_manager}</td></tr>)}
                        {info.account_manager && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Account Manager:</td><td>{info.account_manager}</td></tr>)}
                    </tbody>
                </table>
            </div>

            {(info.contact_name || info.contact_email || info.contact_phone) && (
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "10px" }}>
                    <UserCheck size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} /> Contact
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        {info.contact_name && (<tr><td style={{padding: "4px 0", fontWeight: "bold", width: "120px"}}>Name:</td><td>{info.contact_name}</td></tr>)}
                        {info.contact_email && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Email:</td><td>{info.contact_email}</td></tr>)}
                        {info.contact_phone && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Phone:</td><td>{info.contact_phone}</td></tr>)}
                    </tbody>
                </table>
            </div>
            )}
        </div>

        {crewKey.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "10px" }}>
              <Palette size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} /> Crew Key
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", fontSize: "13px" }}>
              {crewKey.map((crew) => (
                <div key={crew.id} style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ width: "14px", height: "14px", borderRadius: "3px", marginRight: "6px", border: "1px solid #999", backgroundColor: crew.color }}></span>
                  <span>{crew.name || "Unnamed Crew"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedDetailedScheduleItems.length > 0 && (
          <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "10px" }}>
              <ListChecks size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} /> Detailed Production Schedule
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "1px solid #ccc" }}>
                  <th style={{ padding: "6px", textAlign: "left", fontWeight: "bold", width: "8%" }}>Start</th>
                  <th style={{ padding: "6px", textAlign: "left", fontWeight: "bold", width: "8%" }}>End</th>
                  <th style={{ padding: "6px", textAlign: "left", fontWeight: "bold", width: "30%" }}>Activity</th>
                  <th style={{ padding: "6px", textAlign: "left", fontWeight: "bold", width: "30%" }}>Notes</th>
                  <th style={{ padding: "6px", textAlign: "left", fontWeight: "bold", width: "24%" }}>Crew</th>
                </tr>
              </thead>
              <tbody>
                {groupedDetailedScheduleItems.map(([dateKey, itemsInGroup], groupIndex) => {
                  console.log(`[PrintExport] Rendering group ${groupIndex} for date: ${dateKey}, items count: ${itemsInGroup.length}`);
                  return (
                  <React.Fragment key={dateKey}>
                    <tr style={{ backgroundColor: "#e2e8f0", borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>
                      <td colSpan={5} style={{ padding: "6px 8px", fontWeight: "bold", textAlign: "left", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
                        <CalendarDays size={14} style={{ display: "inline-block", marginRight: "6px", verticalAlign: "middle", flexShrink: 0 }} />
                        <span style={{ display: "inline-block" }}>
                          {formatDate(dateKey, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                    {itemsInGroup.map((item, index) => {
                      console.log(`[PrintExport] Rendering item ${index} in group ${groupIndex}:`, JSON.parse(JSON.stringify(item)));
                      return (
                      <tr key={item.id} style={{ borderBottom: "1px solid #eee", backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9", pageBreakInside: "avoid" }}>
                        <td style={{ padding: "6px", verticalAlign: "top" }}>{formatTime(item.start_time) || "-"}</td>
                        <td style={{ padding: "6px", verticalAlign: "top" }}>{formatTime(item.end_time) || "-"}</td>
                        <td style={{ padding: "6px", verticalAlign: "top", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.activity || "-"}</td>
                        <td style={{ padding: "6px", verticalAlign: "top", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.notes || "-"}</td>
                        <td style={{ padding: "6px", verticalAlign: "top", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{getCrewNames(item.assigned_crew_ids, crewKey)}</td>
                      </tr>
                      );
                    })}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}


        {sortedLaborScheduleItems.length > 0 && (
          <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "10px" }}>
              <UsersIcon size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} /> Labor Schedule
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "1px solid #ccc" }}>
                  <th style={{ padding: "6px", textAlign: "left", fontWeight: "bold", width: "20%" }}>Name</th>
                  <th style={{ padding: "6px", textAlign: "left", fontWeight: "bold", width: "20%" }}>Position</th>
                  <th style={{ padding: "6px", textAlign: "left", fontWeight: "bold", width: "15%" }}>Date</th>
                  <th style={{ padding: "6px", textAlign: "left", fontWeight: "bold", width: "10%" }}>Time In</th>
                  <th style={{ padding: "6px", textAlign: "left", fontWeight: "bold", width: "10%" }}>Time Out</th>
                  <th style={{ padding: "6px", textAlign: "left", fontWeight: "bold", width: "25%" }}>Notes</th>
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
                        <tr style={{ backgroundColor: "#e2e8f0", borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>
                          <td
                            colSpan={6}
                            style={{ padding: "6px 8px", fontWeight: "bold", textAlign: "left", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}
                          >
                            <CalendarDays size={14} style={{ display: "inline-block", marginRight: "6px", verticalAlign: "middle", flexShrink: 0 }} />
                            <span style={{ display: "inline-block" }}>{currentLaborDayFormatted}</span>
                          </td>
                        </tr>
                      )}
                      <tr style={{ borderBottom: "1px solid #eee", backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9", pageBreakInside: "avoid" }}>
                        <td style={{ padding: "6px", verticalAlign: "top", fontWeight: "500" }}>{item.name || "-"}</td>
                        <td style={{ padding: "6px", verticalAlign: "top" }}>{item.position || "-"}</td>
                        <td style={{ padding: "6px", verticalAlign: "top" }}>{formatDate(item.date, { month: 'short', day: 'numeric' })}</td>
                        <td style={{ padding: "6px", verticalAlign: "top" }}>{formatTime(item.time_in) || "-"}</td>
                        <td style={{ padding: "6px", verticalAlign: "top" }}>{formatTime(item.time_out) || "-"}</td>
                        <td style={{ padding: "6px", verticalAlign: "top", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.notes || "-"}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}


        <div style={{ marginTop: "40px", borderTop: "1px solid #ccc", paddingTop: "15px", fontSize: "12px", color: "#555", display: "flex", justifyContent: "space-between" }}>
          <span>SoundDocs | Professional Audio Documentation</span>
          <span>Generated on {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    );
  }
);

PrintProductionScheduleExport.displayName = "PrintProductionScheduleExport";
export default PrintProductionScheduleExport;
