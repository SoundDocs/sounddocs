import React, { forwardRef } from "react";
// Icons related to Info tab removed: Calendar, MapPin, Settings, Music
import { Headphones, Mic, Link } from "lucide-react";

interface PrintPatchSheetExportProps {
  patchSheet: any;
}

const PrintPatchSheetExport = forwardRef<HTMLDivElement, PrintPatchSheetExportProps>(
  ({ patchSheet }, ref) => {
    // const info = patchSheet.info || {}; // Info object still exists but is not rendered
    const inputs = patchSheet.inputs || [];
    const outputs = patchSheet.outputs || [];

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const findStereoLink = (channelNumber: string, array: any[]) => {
      return array.find((item) => item.channelNumber === channelNumber && item.isStereo);
    };

    return (
      <div
        ref={ref}
        className="export-wrapper print-version"
        style={{
          width: "1600px",
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
              {patchSheet.name}
            </h2>
            <p style={{ fontSize: "14px", color: "#666" }}>
              {patchSheet.last_edited
                ? `Last edited: ${formatDate(patchSheet.last_edited)}`
                : `Created: ${formatDate(patchSheet.created_at)}`}
            </p>
          </div>
        </div>

        {/* Event Information, Venue, Equipment Information Panels REMOVED */}

        {/* Input List */}
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
            <Mic style={{ height: "18px", width: "18px", display: "inline", marginRight: "8px" }} />
            Input List
          </h3>
          {inputs && inputs.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>Ch</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>Name</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>Type</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Device
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Connection
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Snake Type
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Snake Input
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Console Type
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Console Input
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Network Type
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Network Patch
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>48V</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {inputs.map((input: any, index: number) => {
                    const linkedChannel =
                      input.isStereo && input.stereoChannelNumber
                        ? findStereoLink(input.stereoChannelNumber, inputs)
                        : null;
                    const snakeType =
                      input.connection &&
                      ["Analog Snake", "Digital Snake"].includes(input.connection)
                        ? `${input.connectionDetails?.snakeType || ""}`
                        : "";
                    const snakeInput =
                      input.connection &&
                      ["Analog Snake", "Digital Snake"].includes(input.connection)
                        ? input.connectionDetails?.inputNumber
                          ? `#${input.connectionDetails.inputNumber}`
                          : ""
                        : "";
                    const consoleType =
                      input.connection &&
                      ["Analog Snake", "Console Direct"].includes(input.connection)
                        ? `${input.connectionDetails?.consoleType || ""}`
                        : input.connection &&
                            ["Digital Snake", "Digital Network"].includes(input.connection)
                          ? "-"
                          : "";
                    const consoleInput =
                      input.connection &&
                      ["Analog Snake", "Console Direct"].includes(input.connection)
                        ? input.connectionDetails?.consoleInputNumber
                          ? `#${input.connectionDetails.consoleInputNumber}`
                          : ""
                        : input.connection &&
                            ["Digital Snake", "Digital Network"].includes(input.connection)
                          ? "-"
                          : "";
                    const networkType =
                      input.connection &&
                      ["Digital Snake", "Digital Network"].includes(input.connection)
                        ? `${input.connectionDetails?.networkType || ""}`
                        : "";
                    const networkPatch =
                      input.connection &&
                      ["Digital Snake", "Digital Network"].includes(input.connection)
                        ? input.connectionDetails?.networkPatch
                          ? `#${input.connectionDetails.networkPatch}`
                          : ""
                        : "";
                    const rowStyle = {
                      backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa",
                      borderBottom: "1px solid #eee",
                      ...(input.isStereo ? { borderLeft: "2px solid #666" } : {}),
                    };

                    return (
                      <tr key={input.id} style={rowStyle}>
                        <td style={{ padding: "10px", verticalAlign: "middle", fontWeight: "500" }}>
                          {input.channelNumber}
                        </td>
                        <td style={{ padding: "10px", verticalAlign: "middle", fontWeight: "500" }}>
                          {input.name || ""}
                          {input.isStereo && linkedChannel && (
                            <div style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>
                              <span>Stereo w/ Ch {linkedChannel.channelNumber}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>
                          {input.type || ""}
                        </td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>
                          {input.device || ""}
                        </td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>
                          {input.connection || ""}
                        </td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>{snakeType}</td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>{snakeInput}</td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>{consoleType}</td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>{consoleInput}</td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>{networkType}</td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>{networkPatch}</td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "500",
                              backgroundColor: input.phantom ? "#eee" : "#f5f5f5",
                              color: "#333",
                            }}
                          >
                            {input.phantom ? "Yes" : "No"}
                          </span>
                        </td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>
                          {input.notes || ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "#666" }}>No inputs defined.</p>
          )}
        </div>

        {/* Output List */}
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
            <Headphones
              style={{ height: "18px", width: "18px", display: "inline", marginRight: "8px" }}
            />
            Output List
          </h3>
          {outputs && outputs.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>Ch</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>Name</th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Source Type
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Snake Type
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Snake Output
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Console Type
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Console Output
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Network Type
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Network Patch
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>
                      Destination
                    </th>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "600" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {outputs.map((output: any, index: number) => {
                    const linkedChannel =
                      output.isStereo && output.stereoChannelNumber
                        ? findStereoLink(output.stereoChannelNumber, outputs)
                        : null;
                    const snakeType =
                      output.sourceType &&
                      ["Analog Snake", "Digital Snake"].includes(output.sourceType)
                        ? `${output.sourceDetails?.snakeType || ""}`
                        : "";
                    const snakeOutput =
                      output.sourceType &&
                      ["Analog Snake", "Digital Snake"].includes(output.sourceType)
                        ? output.sourceDetails?.outputNumber
                          ? `#${output.sourceDetails.outputNumber}`
                          : ""
                        : "";
                    const consoleType =
                      (output.sourceType === "Console Output" ||
                        output.sourceType === "Analog Snake") &&
                      output.sourceDetails?.consoleType
                        ? output.sourceDetails.consoleType
                        : output.sourceType === "Digital Snake" ||
                            output.sourceType === "Digital Network"
                          ? "-"
                          : "";
                    const consoleOutput =
                      (output.sourceType === "Console Output" ||
                        output.sourceType === "Analog Snake") &&
                      output.sourceDetails?.consoleOutputNumber
                        ? `#${output.sourceDetails.consoleOutputNumber}`
                        : output.sourceType === "Digital Snake" ||
                            output.sourceType === "Digital Network"
                          ? "-"
                          : "";
                    const networkType =
                      output.sourceType &&
                      ["Digital Snake", "Digital Network"].includes(output.sourceType)
                        ? `${output.sourceDetails?.networkType || ""}`
                        : "";
                    const networkPatch =
                      output.sourceType &&
                      ["Digital Snake", "Digital Network"].includes(output.sourceType)
                        ? output.sourceDetails?.networkPatch
                          ? `#${output.sourceDetails.networkPatch}`
                          : ""
                        : "";
                    const rowStyle = {
                      backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa",
                      borderBottom: "1px solid #eee",
                      ...(output.isStereo ? { borderLeft: "2px solid #666" } : {}),
                    };

                    return (
                      <tr key={output.id} style={rowStyle}>
                        <td style={{ padding: "10px", verticalAlign: "middle", fontWeight: "500" }}>
                          {output.channelNumber}
                        </td>
                        <td style={{ padding: "10px", verticalAlign: "middle", fontWeight: "500" }}>
                          {output.name || ""}
                          {output.isStereo && linkedChannel && (
                            <div style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>
                              <span>Stereo w/ Ch {linkedChannel.channelNumber}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>
                          {output.sourceType || ""}
                        </td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>{snakeType}</td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>{snakeOutput}</td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>{consoleType}</td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>
                          {consoleOutput}
                        </td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>{networkType}</td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>{networkPatch}</td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: "500" }}>{output.destinationType || ""}</div>
                          {output.destinationGear && (
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              {output.destinationGear}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px", verticalAlign: "middle" }}>
                          {output.notes || ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "#666" }}>No outputs defined.</p>
          )}
        </div>

        {/* Notes section (if it was from patchSheet.info.notes) is removed. */}
        {/* Example:
          {patchSheet.info && patchSheet.info.notes && (
            <div
              style={{
                marginBottom: "30px",
                border: "1px solid #eee",
                padding: "20px",
                borderRadius: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginBottom: "15px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "8px",
                }}
              >
                <Music // Music icon was for notes
                  style={{ height: "18px", width: "18px", display: "inline", marginRight: "8px" }}
                />
                Additional Notes
              </h3>
              <p>{patchSheet.info.notes}</p>
            </div>
          )}
        */}

        {/* Footer */}
        <div style={{ marginTop: "40px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
              color: "#666",
            }}
          >
            <div>
              <span style={{ fontWeight: "bold" }}>SoundDocs</span> | Professional Audio
              Documentation
            </div>
            <div>Generated on {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    );
  },
);

PrintPatchSheetExport.displayName = "PrintPatchSheetExport";
export default PrintPatchSheetExport;
