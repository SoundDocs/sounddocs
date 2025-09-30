import React, { forwardRef } from "react";
import type { RiderForExport } from "../../lib/types";

interface PrintRiderExportProps {
  rider: RiderForExport;
}

const PrintRiderExport = forwardRef<HTMLDivElement, PrintRiderExportProps>(({ rider }, ref) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateString;
    }
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
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "2px solid #ccc",
          paddingBottom: "20px",
          marginBottom: "30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>SoundDocs</h1>
          <p style={{ fontSize: "14px", color: "#555", margin: "5px 0 0 0" }}>Technical Rider</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
            {rider.artist_name || "Artist Name"}
          </h2>
          <p style={{ fontSize: "14px", color: "#555", margin: "5px 0 0 0" }}>
            {rider.genre && <span>{rider.genre} • </span>}
            Last Edited: {formatDate(rider.last_edited || rider.created_at)}
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div style={{ marginBottom: "20px", fontSize: "13px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            borderBottom: "1px solid #eee",
            paddingBottom: "8px",
            marginBottom: "10px",
          }}
        >
          Primary Contact
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "5px", width: "33%" }}>
                <strong>Contact Name:</strong> {rider.contact_name || "N/A"}
              </td>
              <td style={{ padding: "5px", width: "33%" }}>
                <strong>Email:</strong> {rider.contact_email || "N/A"}
              </td>
              <td style={{ padding: "5px", width: "34%" }}>
                <strong>Phone:</strong> {rider.contact_phone || "N/A"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Band Members */}
      {rider.band_members && rider.band_members.length > 0 && (
        <div style={{ marginBottom: "20px", fontSize: "13px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
              marginBottom: "10px",
            }}
          >
            Band Members
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Name</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Instrument</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Input Needs</th>
              </tr>
            </thead>
            <tbody>
              {rider.band_members.map((member) => (
                <tr key={member.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "6px 8px" }}>{member.name || "N/A"}</td>
                  <td style={{ padding: "6px 8px" }}>{member.instrument || "N/A"}</td>
                  <td style={{ padding: "6px 8px" }}>{member.input_needs || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Input List */}
      {rider.input_list && rider.input_list.length > 0 && (
        <div style={{ marginBottom: "20px", fontSize: "11px", pageBreakBefore: "auto" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
              marginBottom: "10px",
            }}
          >
            Input/Channel List
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <th style={{ textAlign: "left", padding: "4px" }}>Ch</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Name</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Type</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Mic</th>
                <th style={{ textAlign: "center", padding: "4px" }}>48V</th>
                <th style={{ textAlign: "center", padding: "4px" }}>DI</th>
                <th style={{ textAlign: "left", padding: "4px" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rider.input_list.map((input) => (
                <tr key={input.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "4px", fontFamily: "monospace" }}>
                    {input.channel_number || "-"}
                  </td>
                  <td style={{ padding: "4px" }}>{input.name || "-"}</td>
                  <td style={{ padding: "4px" }}>{input.type || "-"}</td>
                  <td style={{ padding: "4px" }}>{input.mic_type || "-"}</td>
                  <td style={{ padding: "4px", textAlign: "center" }}>
                    {input.phantom_power ? "✓" : ""}
                  </td>
                  <td style={{ padding: "4px", textAlign: "center" }}>
                    {input.di_needed ? "✓" : ""}
                  </td>
                  <td style={{ padding: "4px" }}>{input.notes || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sound System Requirements */}
      <div style={{ marginBottom: "20px", fontSize: "13px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            borderBottom: "1px solid #eee",
            paddingBottom: "8px",
            marginBottom: "10px",
          }}
        >
          Sound System Requirements
        </h3>
        <div style={{ marginBottom: "10px" }}>
          <strong>PA System:</strong>
          <p style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>
            {rider.pa_requirements || "Not specified"}
          </p>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Monitor System:</strong>
          <p style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>
            {rider.monitor_requirements || "Not specified"}
          </p>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Console Requirements:</strong>
          <p style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>
            {rider.console_requirements || "Not specified"}
          </p>
        </div>
      </div>

      {/* Backline Requirements */}
      {rider.backline_requirements && rider.backline_requirements.length > 0 && (
        <div style={{ marginBottom: "20px", fontSize: "13px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
              marginBottom: "10px",
            }}
          >
            Venue Provided Backline
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Item</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Qty</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Specifications</th>
              </tr>
            </thead>
            <tbody>
              {rider.backline_requirements.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "6px 8px" }}>{item.item || "-"}</td>
                  <td style={{ padding: "6px 8px" }}>{item.quantity || "-"}</td>
                  <td style={{ padding: "6px 8px", fontSize: "11px" }}>{item.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Artist Provided Gear */}
      {rider.artist_provided_gear && rider.artist_provided_gear.length > 0 && (
        <div style={{ marginBottom: "20px", fontSize: "13px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
              marginBottom: "10px",
            }}
          >
            Artist Provided Equipment
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Item</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Qty</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Specifications</th>
              </tr>
            </thead>
            <tbody>
              {rider.artist_provided_gear.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "6px 8px" }}>{item.item || "-"}</td>
                  <td style={{ padding: "6px 8px" }}>{item.quantity || "-"}</td>
                  <td style={{ padding: "6px 8px", fontSize: "11px" }}>{item.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Technical Staff */}
      {rider.required_staff && rider.required_staff.length > 0 && (
        <div style={{ marginBottom: "20px", fontSize: "13px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
              marginBottom: "10px",
            }}
          >
            Required Technical Staff
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Role</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Qty</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Requirements</th>
              </tr>
            </thead>
            <tbody>
              {rider.required_staff.map((staff) => (
                <tr key={staff.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "6px 8px" }}>{staff.role || "-"}</td>
                  <td style={{ padding: "6px 8px" }}>{staff.quantity || "-"}</td>
                  <td style={{ padding: "6px 8px", fontSize: "11px" }}>{staff.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Special Requirements */}
      <div style={{ marginBottom: "20px", fontSize: "13px", pageBreakBefore: "auto" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            borderBottom: "1px solid #eee",
            paddingBottom: "8px",
            marginBottom: "10px",
          }}
        >
          Special Requirements
        </h3>
        <div style={{ marginBottom: "10px" }}>
          <strong>Stage & Production:</strong>
          <p style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>
            {rider.special_requirements || "None specified"}
          </p>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Power Requirements:</strong>
          <p style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>
            {rider.power_requirements || "Standard power"}
          </p>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Lighting:</strong>
          <p style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>
            {rider.lighting_notes || "Standard lighting"}
          </p>
        </div>
      </div>

      {/* Hospitality */}
      {rider.hospitality_notes && (
        <div style={{ marginBottom: "20px", fontSize: "13px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
              marginBottom: "10px",
            }}
          >
            Hospitality
          </h3>
          <p style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>{rider.hospitality_notes}</p>
        </div>
      )}

      {/* Additional Notes */}
      {rider.additional_notes && (
        <div style={{ marginBottom: "20px", fontSize: "13px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
              marginBottom: "10px",
            }}
          >
            Additional Notes
          </h3>
          <p style={{ margin: "5px 0", whiteSpace: "pre-wrap" }}>{rider.additional_notes}</p>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: "30px",
          paddingTop: "15px",
          borderTop: "1px solid #ccc",
          textAlign: "center",
          fontSize: "11px",
          color: "#666",
        }}
      >
        <p>Generated with SoundDocs • {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
});

PrintRiderExport.displayName = "PrintRiderExport";

export default PrintRiderExport;
