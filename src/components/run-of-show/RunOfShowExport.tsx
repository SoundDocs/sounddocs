import React, { forwardRef } from "react";
import { FullRunOfShowData } from "../../pages/AllRunOfShows"; // Using FullRunOfShowData from AllRunOfShows
import { RunOfShowItem } from "../../pages/RunOfShowEditor";

interface RunOfShowExportProps {
  schedule: FullRunOfShowData;
}

const RunOfShowExport = forwardRef<HTMLDivElement, RunOfShowExportProps>(({ schedule }, ref) => {
  const defaultColumns: { key: keyof RunOfShowItem | string; label: string }[] = [
    { key: "itemNumber", label: "Item" },
    { key: "startTime", label: "Start" },
    { key: "preset", label: "Preset" },
    { key: "duration", label: "Duration" },
    { key: "privateNotes", label: "Private Notes" },
    { key: "productionNotes", label: "Production Notes" },
    { key: "audio", label: "Audio" },
    { key: "video", label: "Video" },
    { key: "lights", label: "Lights" },
  ];

  const allColumns = [
    ...defaultColumns,
    ...(schedule.custom_column_definitions || []).map(col => ({ key: col.name, label: col.name }))
  ];
  
  return (
    <div ref={ref} className="p-8 bg-slate-900 text-slate-100 font-inter" style={{ width: '1280px', fontFamily: 'Inter, sans-serif' }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          .font-inter { font-family: 'Inter', sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #334155; padding: 8px; text-align: left; font-size: 0.875rem; vertical-align: top; word-break: break-word; }
          th { background-color: #1e293b; color: #cbd5e1; font-weight: 600; }
          td { background-color: #0f172a; color: #e2e8f0; }
          h1 { font-size: 1.875rem; font-weight: 700; margin-bottom: 1rem; color: #f1f5f9; }
          .header-info p { margin-bottom: 0.25rem; font-size: 0.875rem; color: #94a3b8; }
          .header-info strong { color: #cbd5e1; }
        `}
      </style>
      <div className="mb-6 header-info">
        <h1>{schedule.name || "Run of Show"}</h1>
        <p><strong>Created:</strong> {new Date(schedule.created_at).toLocaleString()}</p>
        {schedule.last_edited && <p><strong>Last Edited:</strong> {new Date(schedule.last_edited).toLocaleString()}</p>}
      </div>

      <table>
        <thead>
          <tr>
            {allColumns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(schedule.items || []).map((item) => (
            <tr key={item.id}>
              {allColumns.map(col => (
                <td key={`${item.id}-${col.key}`}>
                  {String(item[col.key as keyof RunOfShowItem] || '')}
                </td>
              ))}
            </tr>
          ))}
          {(schedule.items || []).length === 0 && (
            <tr>
              <td colSpan={allColumns.length} style={{ textAlign: 'center', padding: '20px' }}>
                No items in this run of show.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});

RunOfShowExport.displayName = "RunOfShowExport";
export default RunOfShowExport;
