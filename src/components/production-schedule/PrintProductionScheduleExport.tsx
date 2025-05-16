import React, { forwardRef } from "react";
import { Calendar, ListChecks, Palette, UserCheck, Building, UserCog, Briefcase, UserCircle } from "lucide-react";

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

interface PrintProductionScheduleExportProps {
  schedule: ProductionSchedule;
}

const PrintProductionScheduleExport = forwardRef<HTMLDivElement, PrintProductionScheduleExportProps>(
  ({ schedule }, ref) => {
    const info = schedule.info || {};
    const crewKey = schedule.crew_key || [];
    const scheduleItems = schedule.schedule_items || [];

    const formatDate = (dateString?: string) => {
      if (!dateString) return "N/A";
       try {
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

    const getCrewName = (crewId: string) => {
      const crewMember = crewKey.find(crew => crew.id === crewId);
      return crewMember ? crewMember.name : "Unknown";
    };

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
            <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{schedule.name}</h2>
            <p style={{ fontSize: "14px", color: "#555", margin: "5px 0 0 0" }}>
              Last Edited: {formatDate(schedule.last_edited || schedule.created_at)}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: "20px", fontSize: "13px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "10px" }}>
                <Calendar size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} /> Event & Venue Details
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                    {info.event_name && (<tr><td style={{padding: "4px 0", fontWeight: "bold", width: "150px"}}>Event:</td><td>{info.event_name}</td></tr>)}
                    {info.job_number && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Job #:</td><td>{info.job_number}</td></tr>)}
                    {info.event_type && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Type:</td><td>{info.event_type}</td></tr>)}
                    {info.date && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Date:</td><td>{formatDate(info.date)}</td></tr>)}
                    {(info.event_start || info.event_end) && (
                        <tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Time:</td><td>{formatTime(info.event_start)} {info.event_start && info.event_end ? `- ${formatTime(info.event_end)}` : ""}</td></tr>
                    )}
                    {info.load_in && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Load In:</td><td>{formatTime(info.load_in)}</td></tr>)}
                    {info.sound_check && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Sound Check:</td><td>{formatTime(info.sound_check)}</td></tr>)}
                    {info.venue && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Venue:</td><td>{info.venue}</td></tr>)}
                    {info.room && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Room:</td><td>{info.room}</td></tr>)}
                    {info.address && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Address:</td><td>{info.address}</td></tr>)}
                </tbody>
            </table>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginBottom: "20px", fontSize: "13px" }}>
            {(info.client_artist || info.contact_name || info.contact_email || info.contact_phone || info.account_manager) && (
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "10px" }}>
                    <UserCheck size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} /> Client & Contact
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        {info.client_artist && (<tr><td style={{padding: "4px 0", fontWeight: "bold", width: "120px"}}>Client/Artist:</td><td>{info.client_artist}</td></tr>)}
                        {info.account_manager && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Account Manager:</td><td>{info.account_manager}</td></tr>)}
                        {info.contact_name && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Contact Name:</td><td>{info.contact_name}</td></tr>)}
                        {info.contact_email && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Email:</td><td>{info.contact_email}</td></tr>)}
                        {info.contact_phone && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Phone:</td><td>{info.contact_phone}</td></tr>)}
                    </tbody>
                </table>
            </div>
            )}

            {(info.production_manager || info.project_manager || info.foh_engineer || info.monitor_engineer) && (
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "10px" }}>
                    <UserCog size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} /> Technical Staff
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        {info.production_manager && (<tr><td style={{padding: "4px 0", fontWeight: "bold", width: "150px"}}>Production Manager:</td><td>{info.production_manager}</td></tr>)}
                        {info.project_manager && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Project Manager:</td><td>{info.project_manager}</td></tr>)}
                        {info.foh_engineer && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>FOH Engineer:</td><td>{info.foh_engineer}</td></tr>)}
                        {info.monitor_engineer && (<tr><td style={{padding: "4px 0", fontWeight: "bold"}}>Monitor Engineer:</td><td>{info.monitor_engineer}</td></tr>)}
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
                  <span>{crew.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "10px" }}>
            <ListChecks size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} /> Production Schedule
          </h3>
          {scheduleItems.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "1px solid #ccc" }}>
                  <th style={{ padding: "8px", textAlign: "left", fontWeight: "bold", width: "10%" }}>Start</th>
                  <th style={{ padding: "8px", textAlign: "left", fontWeight: "bold", width: "10%" }}>End</th>
                  <th style={{ padding: "8px", textAlign: "left", fontWeight: "bold", width: "30%" }}>Activity</th>
                  <th style={{ padding: "8px", textAlign: "left", fontWeight: "bold", width: "30%" }}>Notes</th>
                  <th style={{ padding: "8px", textAlign: "left", fontWeight: "bold", width: "20%" }}>Crew</th>
                </tr>
              </thead>
              <tbody>
                {scheduleItems.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #eee", backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                    <td style={{ padding: "8px", verticalAlign: "top" }}>{formatTime(item.start_time)}</td>
                    <td style={{ padding: "8px", verticalAlign: "top" }}>{formatTime(item.end_time)}</td>
                    <td style={{ padding: "8px", verticalAlign: "top", fontWeight: "500" }}>{item.activity}</td>
                    <td style={{ padding: "8px", verticalAlign: "top", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.notes}</td>
                    <td style={{ padding: "8px", verticalAlign: "top" }}>
                      {item.crew_ids?.map(crewId => getCrewName(crewId)).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "#555", textAlign: "center", padding: "10px 0" }}>No schedule items defined.</p>
          )}
        </div>

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
