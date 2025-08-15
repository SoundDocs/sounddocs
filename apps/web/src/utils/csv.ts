interface LeqMeasurement {
  id: string;
  measured_at: string;
  leq_value: number;
  duration_seconds: number;
  calibration_offset: number;
  sample_rate: number;
  session_id: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export function generateLeqCsv(measurements: LeqMeasurement[]): string {
  const headers = [
    "Timestamp",
    "LEQ (dB)",
    "Duration (s)",
    "Calibration Offset (dB)",
    "Sample Rate (Hz)",
    "Session ID",
    "Location",
    "Notes",
  ];

  const rows = measurements.map((measurement) => [
    new Date(measurement.measured_at).toISOString(),
    measurement.leq_value.toFixed(1),
    measurement.duration_seconds.toString(),
    measurement.calibration_offset.toFixed(1),
    measurement.sample_rate.toString(),
    measurement.session_id,
    measurement.location || "",
    measurement.notes || "",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape cells containing commas, quotes, or newlines
          if (
            typeof cell === "string" &&
            (cell.includes(",") || cell.includes('"') || cell.includes("\n"))
          ) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(","),
    ),
  ].join("\n");

  return csvContent;
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    // Create download link
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  }
}

export function generateLeqCsvFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").split("T")[0];
  return `sounddocs-leq-measurements-${timestamp}.csv`;
}
