import React, { forwardRef } from "react";
import { FullRunOfShowData } from "../../pages/AllRunOfShows";
import { RunOfShowItem } from "../../pages/RunOfShowEditor";
import { FileText, Calendar } from "lucide-react"; // Icons for branding

interface PrintRunOfShowExportProps {
  schedule: FullRunOfShowData;
}

const PrintRunOfShowExport = forwardRef<HTMLDivElement, PrintRunOfShowExportProps>(({ schedule }, ref) => {
  const defaultColumns: { key: keyof RunOfShowItem | string; label: string }[] = [
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

  const allColumns = [
    ...defaultColumns,
    ...(schedule.custom_column_definitions || []).map(col => ({ key: col.name, label: col.name }))
  ];

  const formatDate = (dateString: string | undefined, options?: Intl.DateTimeFormatOptions) => {
    if (!dateString) return "N/A";
    const defaultOpts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString("en-US", { ...defaultOpts, ...options });
  };

  return (
    <div 
      ref={ref} 
      className="p-8 bg-white text-black" 
      style={{ 
        width: '1100px', // Standard width for landscape A4 or Letter
        fontFamily: 'Arial, sans-serif',
        position: "absolute", // Keep off-screen for html2canvas/printing
        left: "-9999px",      // Keep off-screen for html2canvas/printing
      }}
    >
      <style>
        {`
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          .print-export-table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          .print-export-table th, .print-export-table td { 
            border: 1px solid #ccc; 
            padding: 8px 10px; 
            text-align: left; 
            font-size: 10pt; 
            vertical-align: top; 
            word-break: break-word; 
          }
          .print-export-table th { 
            background-color: #e9ecef; /* Lighter gray for print */
            color: #212529; /* Darker text for contrast */
            font-weight: bold; 
          }
          .print-export-table td { 
            background-color: #fff; 
            color: #000; 
          }
          .print-export-header h1 { 
            font-size: 24pt; 
            font-weight: bold; 
            margin: 0;
            color: #000; 
          }
          .print-export-header p { 
            font-size: 11pt; 
            color: #555; 
            margin: 4px 0 0 0;
          }
          .print-export-subheader h2 {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #000;
          }
          .print-export-info p { 
            margin-bottom: 4px; 
            font-size: 10pt; 
            color: #333; 
          }
          .print-export-info strong { 
            color: #000; 
            font-weight: bold;
          }
          .print-export-footer {
            margin-top: 30px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            font-size: 9pt;
            color: #555;
            display: flex;
            justify-content: space-between;
          }
          .print-export-empty-row td {
            text-align: center;
            padding: 20px;
            font-style: italic;
            color: #777;
          }
        `}
      </style>

      {/* Branded Header */}
      <div className="print-export-header" style={{ borderBottom: "2px solid #ccc", paddingBottom: "15px", marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1>SoundDocs</h1>
          <p>Run of Show</p>
        </div>
        <div style={{ textAlign: "right" }} className="print-export-info">
           <p style={{ fontSize: '12pt', fontWeight: 'bold', color: '#000' }}>{schedule.name || "Untitled Run of Show"}</p>
        </div>
      </div>
      
      {/* Document Info */}
      <div className="print-export-info" style={{ marginBottom: "20px" }}>
        <p><strong>Created:</strong> {formatDate(schedule.created_at, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        {schedule.last_edited && <p><strong>Last Edited:</strong> {formatDate(schedule.last_edited, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
      </div>


      <table className="print-export-table">
        <thead>
          <tr>
            {allColumns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(schedule.items || []).map((item, index) => (
            <tr key={item.id || `item-${index}`}>
              {allColumns.map(col => (
                <td key={`${item.id || `item-${index}`}-${col.key}`}>
                  {String(item[col.key as keyof RunOfShowItem] || '')}
                </td>
              ))}
            </tr>
          ))}
          {(schedule.items || []).length === 0 && (
            <tr className="print-export-empty-row">
              <td colSpan={allColumns.length}>
                No items in this run of show.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Branded Footer */}
      <div className="print-export-footer">
        <span>SoundDocs | Professional Audio Documentation</span>
        <span>Generated on {formatDate(new Date().toISOString(), { month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>
    </div>
  );
});

PrintRunOfShowExport.displayName = "PrintRunOfShowExport";
export default PrintRunOfShowExport;
