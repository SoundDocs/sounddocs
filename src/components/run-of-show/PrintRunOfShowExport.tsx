import React, { forwardRef } from "react";
import { FullRunOfShowData } from "../../pages/AllRunOfShows";
import { RunOfShowItem } from "../../pages/RunOfShowEditor";

interface PrintRunOfShowExportProps {
  schedule: FullRunOfShowData;
}

const PrintRunOfShowExport = forwardRef<HTMLDivElement, PrintRunOfShowExportProps>(({ schedule }, ref) => {
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
    <div ref={ref} className="p-8 bg-white text-black font-arial" style={{ width: '1100px', fontFamily: 'Arial, sans-serif' }}>
      <style>
        {`
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          .font-arial { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 6px; text-align: left; font-size: 10pt; vertical-align: top; word-break: break-word; }
          th { background-color: #f0f0f0; color: #333; font-weight: bold; }
          td { background-color: #fff; color: #000; }
          h1 { font-size: 20pt; font-weight: bold; margin-bottom: 12px; color: #000; }
          .header-info p { margin-bottom: 3px; font-size: 10pt; color: #333; }
          .header-info strong { color: #000; }
        `}
      </style>
      <div className="mb-4 header-info">
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
              <td colSpan={allColumns.length} style={{ textAlign: 'center', padding: '15px' }}>
                No items in this run of show.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});

PrintRunOfShowExport.displayName = "PrintRunOfShowExport";
export default PrintRunOfShowExport;
