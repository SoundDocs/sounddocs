import React, { forwardRef } from "react";
import { FullRunOfShowData } from "../../pages/AllRunOfShows";
import { RunOfShowItem } from "../../pages/RunOfShowEditor"; // Ensure RunOfShowItem includes highlightColor

interface PrintRunOfShowExportProps {
  schedule: FullRunOfShowData;
}

// Basic function to determine if a color is light or dark.
// Returns true for light colors (suggesting dark text), false for dark colors (suggesting light text).
const isColorLight = (hexColor?: string): boolean => {
  if (!hexColor) return true;
  try {
    const color = hexColor.startsWith("#") ? hexColor.substring(1) : hexColor;
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return hsp > 127.5;
  } catch (e) {
    return true;
  }
};

const PrintRunOfShowExport = forwardRef<HTMLDivElement, PrintRunOfShowExportProps>(({ schedule }, ref) => {
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
        width: '1100px', 
        fontFamily: 'Arial, sans-serif',
        position: "absolute", 
        left: "-9999px",      
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
            background-color: #e9ecef; 
            color: #212529; 
            font-weight: bold; 
          }
          .print-export-table td { 
            background-color: #fff; /* Default, will be overridden by highlight */
            color: #000; 
          }
          .print-export-table .header-row {
            background-color: #f8f9fa; /* Very light gray for header section */
          }
          .print-export-table .header-row td { /* General styling for cells in header row */
            color: #333;
            font-size: 10pt;
            font-weight: normal;
          }
          .print-export-table .header-row td.header-cell-title { /* Specific for the title cell (now first column for headers) */
            color: #000;
            font-size: 12pt;
            font-weight: bold;
            padding: 10px 10px;
            border-left: 3px solid #6c757d; /* Darker gray accent */
          }
           .print-export-table .header-row td.header-cell-meta { /* For Start Time of header */
            font-weight: normal; /* Or bold if preferred */
          }
          .print-export-table .header-row td.header-cell-empty { /* For empty cells in header row */
            color: #777; 
            font-style: italic;
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

      <div className="print-export-header" style={{ borderBottom: "2px solid #ccc", paddingBottom: "15px", marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1>SoundDocs</h1>
          <p>Run of Show</p>
        </div>
        <div style={{ textAlign: "right" }} className="print-export-info">
           <p style={{ fontSize: '12pt', fontWeight: 'bold', color: '#000' }}>{schedule.name || "Untitled Run of Show"}</p>
        </div>
      </div>
      
      <div className="print-export-info" style={{ marginBottom: "20px" }}>
        <p><strong>Created:</strong> {formatDate(schedule.created_at, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        {schedule.last_edited && <p><strong>Last Edited:</strong> {formatDate(schedule.last_edited, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
      </div>

      <table className="print-export-table">
        <thead>
          <tr>
            {allTableColumns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(schedule.items || []).map((item, index) => {
            const currentItem = item as RunOfShowItem;
             if (currentItem.type === 'header') {
              return (
                <tr key={currentItem.id || `item-${index}`} className="header-row">
                  <td className="header-cell-title">
                    {currentItem.headerTitle || "Section Header"}
                  </td>
                  <td className="header-cell-meta">{currentItem.startTime || ''}</td>
                  <td className="header-cell-empty">N/A</td>
                  {defaultColumnsConfig.slice(3).map(colDef => (
                     <td key={`print-header-empty-default-${colDef.key}`} className="header-cell-empty">N/A</td>
                  ))}
                  {(schedule.custom_column_definitions || []).map(customCol => (
                    <td key={`print-header-empty-custom-${customCol.id}`} className="header-cell-empty">N/A</td>
                  ))}
                </tr>
              );
            }
            // Regular item row
            const cellStyle: React.CSSProperties = {};
            if (currentItem.highlightColor) {
              cellStyle.backgroundColor = currentItem.highlightColor;
              if (!isColorLight(currentItem.highlightColor)) {
                cellStyle.color = '#FFFFFF'; // Light text for dark backgrounds
              } else {
                cellStyle.color = '#000000'; // Dark text for light backgrounds
              }
            }

            return (
              <tr key={currentItem.id || `item-${index}`}>
                {allTableColumns.map(col => (
                  <td 
                    key={`${currentItem.id || `item-${index}`}-${col.key}`}
                    style={cellStyle} // Apply style to each cell
                  >
                    {String(currentItem[col.key as keyof RunOfShowItem] || '')}
                  </td>
                ))}
              </tr>
            );
          })}
          {(schedule.items || []).length === 0 && (
            <tr className="print-export-empty-row">
              <td colSpan={allTableColumns.length}>
                No items in this run of show.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="print-export-footer">
        <span>SoundDocs | Professional Audio Documentation</span>
        <span>Generated on {formatDate(new Date().toISOString(), { month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>
    </div>
  );
});

PrintRunOfShowExport.displayName = "PrintRunOfShowExport";
export default PrintRunOfShowExport;
