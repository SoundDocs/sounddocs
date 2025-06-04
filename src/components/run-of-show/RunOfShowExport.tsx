import React, { forwardRef } from "react";
import { FullRunOfShowData } from "../../pages/AllRunOfShows";
import { RunOfShowItem } from "../../pages/RunOfShowEditor";
import { Bookmark, Clock } from "lucide-react"; 

interface RunOfShowExportProps {
  schedule: FullRunOfShowData;
}

const RunOfShowExport = forwardRef<HTMLDivElement, RunOfShowExportProps>(({ schedule }, ref) => {
  const defaultColumnsConfig: { key: keyof RunOfShowItem | string; label: string }[] = [
    { key: "itemNumber", label: "Item #" },
    { key: "startTime", label: "Start Time" },
    { key: "preset", label: "Preset / Scene" },
    { key: "duration", label: "Duration (mm:ss)" },
    { key: "privateNotes", label: "Private Notes" },
    { key: "productionNotes", label: "Production Notes" },
    { key: "audio", label: "Audio Cues" },
    { key: "video", label: "Video Cues" },
    { key: "lights", label: "Lighting Cues" },
  ];

  const allTableColumns = [
    ...defaultColumnsConfig,
    ...(schedule.custom_column_definitions || []).map(col => ({ key: col.name, label: col.name }))
  ];

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  return (
    <div 
      ref={ref} 
      className="export-wrapper text-white p-8 rounded-lg shadow-xl"
      style={{ 
        width: '1600px', 
        fontFamily: 'Inter, sans-serif',
        background: "linear-gradient(to bottom, #111827, #0f172a)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        position: "absolute", 
        left: "-9999px",      
      }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          .font-inter { font-family: 'Inter', sans-serif; }
          
          .export-wrapper table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-top: 1.5rem; 
          }
          .export-wrapper th, .export-wrapper td { 
            border: 1px solid rgba(55, 65, 81, 0.7); 
            padding: 0.75rem 1rem; 
            text-align: left; 
            font-size: 0.875rem; 
            line-height: 1.25rem; 
            vertical-align: top; 
            word-break: break-word; 
          }
          .export-wrapper th { 
            background: linear-gradient(to right, #2d3748, #1e293b); 
            color: #cbd5e1; 
            font-weight: 600; 
            border-bottom: 2px solid rgba(99, 102, 241, 0.4); 
          }
          .export-wrapper tbody tr:nth-child(odd) td:not(.header-cell) { 
            background-color: rgba(31, 41, 55, 0.7); 
          }
          .export-wrapper tbody tr:nth-child(even) td:not(.header-cell) { 
            background-color: rgba(45, 55, 72, 0.4); 
          }
          .export-wrapper td { 
            color: #e2e8f0; 
          }
          .export-wrapper .header-row td.header-cell {
            background: linear-gradient(to right, #374151, #1f2937); /* Slightly different gradient for header rows */
            color: #f3f4f6; /* Lighter text for header */
            font-size: 1.125rem; /* Larger font for header */
            font-weight: 600;
            padding: 1rem 1rem;
            border-left: 4px solid #6366f1; /* Indigo accent line */
          }
          .export-wrapper .header-row td.header-cell-meta {
             background: linear-gradient(to right, #374151, #1f2937);
             color: #d1d5db;
             font-size: 0.875rem;
             padding: 1rem 1rem;
             text-align: right;
             border-left: none;
          }
          .export-wrapper h1 { 
            font-size: 1.875rem; 
            font-weight: 700; 
            margin-bottom: 0.5rem; 
            color: #f1f5f9; 
          }
          .export-wrapper .header-info p { 
            margin-bottom: 0.25rem; 
            font-size: 0.875rem; 
            color: #94a3b8; 
          }
          .export-wrapper .header-info strong { 
            color: #cbd5e1; 
            font-weight: 500;
          }
          .export-wrapper .empty-row td {
            text-align: center;
            padding: 2rem; 
            color: #9ca3af; 
            font-style: italic;
          }
        `}
      </style>

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
            <h1 className="text-3xl font-bold" style={{color: "#fff", marginBottom: "0.25rem"}}>SoundDocs</h1>
            <p className="text-indigo-400 font-medium">Professional Audio Documentation</p>
          </div>
        </div>
        <div className="text-right z-10 header-info">
          <h2 className="text-2xl font-bold text-white" style={{marginBottom: "0.25rem"}}>{schedule.name || "Run of Show"}</h2>
          <p><strong>Created:</strong> {formatDate(schedule.created_at)}</p>
          {schedule.last_edited && <p><strong>Last Edited:</strong> {formatDate(schedule.last_edited)}</p>}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            {allTableColumns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(schedule.items || []).map((item, index) => {
            const currentItem = item as RunOfShowItem; // Cast to ensure 'type' and 'headerTitle' are accessible
            if (currentItem.type === 'header') {
              return (
                <tr key={currentItem.id || `item-${index}`} className="header-row">
                  <td className="header-cell-meta">{currentItem.itemNumber || ''}</td>
                  <td className="header-cell-meta">{currentItem.startTime || ''}</td>
                  <td colSpan={allTableColumns.length - 2} className="header-cell">
                    {currentItem.headerTitle || "Section Header"}
                  </td>
                </tr>
              );
            }
            return (
              <tr key={currentItem.id || `item-${index}`}>
                {allTableColumns.map(col => (
                  <td key={`${currentItem.id || `item-${index}`}-${col.key}`}>
                    {String(currentItem[col.key as keyof RunOfShowItem] || '')}
                  </td>
                ))}
              </tr>
            );
          })}
          {(schedule.items || []).length === 0 && (
            <tr className="empty-row">
              <td colSpan={allTableColumns.length}>
                No items in this run of show.
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
            <span>Generated on {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
});

RunOfShowExport.displayName = "RunOfShowExport";
export default RunOfShowExport;
