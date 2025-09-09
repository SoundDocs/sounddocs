import { forwardRef } from "react";
import { Radio, Users, MapPin } from "lucide-react";
import { CommsPlan } from "../lib/commsTypes";

interface PrintCommsPlanExportProps {
  commsPlan: CommsPlan;
}

const PrintCommsPlanExport = forwardRef<HTMLDivElement, PrintCommsPlanExportProps>(
  ({ commsPlan }, ref) => {
    // Early return if commsPlan is null or undefined
    if (!commsPlan) {
      return (
        <div
          ref={ref}
          className="export-wrapper print-version"
          style={{
            width: "1800px",
            position: "absolute",
            left: "-9999px",
            fontFamily: "Inter, sans-serif",
            backgroundColor: "white",
            color: "#111",
            padding: "40px",
          }}
        >
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#666" }}>Loading comms plan...</p>
          </div>
        </div>
      );
    }

    const formatDate = (dateString: string | Date) => {
      if (!dateString) return "";
      const date = typeof dateString === "string" ? new Date(dateString) : dateString;
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const getConnectedBeltpacks = (transceiverId: string) => {
      return (commsPlan.beltpacks || []).filter((bp) => bp.transceiverRef === transceiverId);
    };

    return (
      <div
        ref={ref}
        className="export-wrapper print-version"
        style={{
          width: "1800px",
          position: "absolute",
          left: "-9999px",
          fontFamily: "Inter, sans-serif",
          backgroundColor: "white",
          color: "#111",
          padding: "40px",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "2px solid #ddd",
            padding: "20px",
            marginBottom: "30px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ marginRight: "15px", fontWeight: "bold", fontSize: "28px" }}>
              SoundDocs
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "5px" }}>
              {commsPlan.name}
            </h2>
            <p style={{ fontSize: "14px", color: "#666" }}>
              {commsPlan.lastEdited
                ? `Last edited: ${formatDate(commsPlan.lastEdited)}`
                : `Created: ${formatDate(commsPlan.createdAt || new Date())}`}
            </p>
          </div>
        </div>

        {/* Venue Overview */}
        <div style={{ marginBottom: "30px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "15px",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
            }}
          >
            <MapPin
              style={{ height: "18px", width: "18px", display: "inline", marginRight: "8px" }}
            />
            Venue Overview
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            <div>
              <p style={{ fontSize: "14px", color: "#666", marginBottom: "5px" }}>Venue Size</p>
              <p style={{ fontSize: "16px", fontWeight: "600" }}>
                {commsPlan.venueGeometry?.width || 0}' × {commsPlan.venueGeometry?.height || 0}'
              </p>
            </div>
            <div>
              <p style={{ fontSize: "14px", color: "#666", marginBottom: "5px" }}>Transceivers</p>
              <p style={{ fontSize: "16px", fontWeight: "600" }}>
                {(commsPlan.transceivers || []).length} units
              </p>
            </div>
            <div>
              <p style={{ fontSize: "14px", color: "#666", marginBottom: "5px" }}>Beltpacks</p>
              <p style={{ fontSize: "16px", fontWeight: "600" }}>
                {(commsPlan.beltpacks || []).length} units
              </p>
            </div>
          </div>
        </div>

        {/* Transceivers Table */}
        <div style={{ marginBottom: "30px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "15px",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
            }}
          >
            <Radio
              style={{ height: "18px", width: "18px", display: "inline", marginRight: "8px" }}
            />
            Transceivers
          </h3>
          {(commsPlan.transceivers || []).length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>Label</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>Model</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>Band</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Coverage
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Channels
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Connected Beltpacks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(commsPlan.transceivers || []).map((transceiver, index) => {
                    const connectedBeltpacks = getConnectedBeltpacks(transceiver.id);

                    return (
                      <tr
                        key={transceiver.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <td style={{ padding: "10px", fontWeight: "600" }}>{transceiver.label}</td>
                        <td style={{ padding: "10px" }}>{transceiver.model}</td>
                        <td style={{ padding: "10px" }}>{transceiver.band}</td>
                        <td style={{ padding: "10px" }}>{transceiver.coverageRadius}' radius</td>
                        <td style={{ padding: "10px" }}>
                          {transceiver.channels?.primary || "N/A"}
                          {transceiver.channels?.secondary &&
                            ` / ${transceiver.channels.secondary}`}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {connectedBeltpacks.length} / {transceiver.maxBeltpacks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "#666" }}>No transceivers defined.</p>
          )}
        </div>

        {/* Beltpacks Table */}
        <div style={{ marginBottom: "30px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "15px",
              borderBottom: "1px solid #eee",
              paddingBottom: "8px",
            }}
          >
            <Users
              style={{ height: "18px", width: "18px", display: "inline", marginRight: "8px" }}
            />
            Beltpacks
          </h3>
          {(commsPlan.beltpacks || []).length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>Label</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Connected To
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Channel Assignments
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(commsPlan.beltpacks || []).map((beltpack, index) => {
                    const transceiver = (commsPlan.transceivers || []).find(
                      (t) => t.id === beltpack.transceiverRef,
                    );

                    return (
                      <tr
                        key={beltpack.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <td style={{ padding: "10px", fontWeight: "600" }}>{beltpack.label}</td>
                        <td style={{ padding: "10px" }}>
                          {transceiver ? transceiver.label : "Not Connected"}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {beltpack.channelAssignments && beltpack.channelAssignments.length > 0 ? (
                            <div>
                              {beltpack.channelAssignments.map((assignment, idx) => (
                                <div key={idx} style={{ marginBottom: "2px" }}>
                                  {assignment.channel}: {assignment.assignment}
                                </div>
                              ))}
                            </div>
                          ) : (
                            "No assignments"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "#666" }}>No beltpacks defined.</p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "40px",
            paddingTop: "20px",
            borderTop: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "14px", color: "#666" }}>
            SoundDocs | Professional Audio Documentation
          </div>
          <div style={{ fontSize: "12px", color: "#999" }}>
            Generated on {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  },
);

PrintCommsPlanExport.displayName = "PrintCommsPlanExport";
export default PrintCommsPlanExport;
