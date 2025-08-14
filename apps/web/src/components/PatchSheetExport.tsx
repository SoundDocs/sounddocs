import React, { forwardRef } from "react";
import {
  Bookmark,
  // Calendar, MapPin, User, Users, Settings, Music, // Icons related to Info tab removed
  Clock,
  Mic,
  Headphones, // Corrected: Headphones was already used for Output List
  Link,
} from "lucide-react";

interface PatchSheetExportProps {
  patchSheet: any;
}

const PatchSheetExport = forwardRef<HTMLDivElement, PatchSheetExportProps>(
  ({ patchSheet }, ref) => {
    // const info = patchSheet.info || {}; // Info object still exists but is not rendered
    const inputs = patchSheet.inputs || [];
    const outputs = patchSheet.outputs || [];

    const formatDate = (dateString: string) => {
      if (!dateString) return "N/A";
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
        className="export-wrapper text-white p-8 rounded-lg shadow-xl"
        style={{
          width: "1600px",
          position: "absolute",
          left: "-9999px",
          fontFamily: "Inter, sans-serif",
          background: "linear-gradient(to bottom, #111827, #0f172a)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Header with enhanced branding */}
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
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%)",
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
              <h1 className="text-3xl font-bold">SoundDocs</h1>
              <p className="text-indigo-400 font-medium">Professional Audio Documentation</p>
            </div>
          </div>
          <div className="text-right z-10">
            <h2 className="text-2xl font-bold text-white">{patchSheet.name}</h2>
            <p className="text-gray-400">
              {patchSheet.last_edited
                ? `Last Edited: ${formatDate(patchSheet.last_edited)}`
                : `Created: ${formatDate(patchSheet.created_at)}`}
            </p>
          </div>
        </div>

        {/* Event Information, Artist, Technical Staff, Equipment Information Panels REMOVED */}

        {/* Input List */}
        <div
          className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8"
          style={{
            borderLeft: "4px solid #4f46e5",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
            <Mic className="h-5 w-5 mr-2" />
            Input List
          </h3>
          {inputs && inputs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    style={{
                      background: "linear-gradient(to right, #2d3748, #1e293b)",
                      borderBottom: "2px solid rgba(99, 102, 241, 0.4)",
                    }}
                  >
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Ch</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Name</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Type</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Device</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Connection
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Snake Type
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Snake Input
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Console Type
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Console Input
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Network Type
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Network Patch
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">48V</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Notes</th>
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
                        ? `${input.connectionDetails?.snakeType || "N/A"}`
                        : "N/A";
                    const snakeInput =
                      input.connection &&
                      ["Analog Snake", "Digital Snake"].includes(input.connection)
                        ? input.connectionDetails?.inputNumber
                          ? `#${input.connectionDetails.inputNumber}`
                          : "N/A"
                        : "N/A";
                    const consoleType =
                      input.connection &&
                      ["Analog Snake", "Console Direct"].includes(input.connection)
                        ? `${input.connectionDetails?.consoleType || "N/A"}`
                        : input.connection &&
                            ["Digital Snake", "Digital Network"].includes(input.connection)
                          ? "-"
                          : "N/A";
                    const consoleInput =
                      input.connection &&
                      ["Analog Snake", "Console Direct"].includes(input.connection)
                        ? input.connectionDetails?.consoleInputNumber
                          ? `#${input.connectionDetails.consoleInputNumber}`
                          : "N/A"
                        : input.connection &&
                            ["Digital Snake", "Digital Network"].includes(input.connection)
                          ? "-"
                          : "N/A";
                    const networkType =
                      input.connection &&
                      ["Digital Snake", "Digital Network"].includes(input.connection)
                        ? `${input.connectionDetails?.networkType || "N/A"}`
                        : "N/A";
                    const networkPatch =
                      input.connection &&
                      ["Digital Snake", "Digital Network"].includes(input.connection)
                        ? input.connectionDetails?.networkPatch
                          ? `#${input.connectionDetails.networkPatch}`
                          : "N/A"
                        : "N/A";

                    return (
                      <tr
                        key={input.id}
                        style={{
                          background:
                            index % 2 === 0 ? "rgba(31, 41, 55, 0.7)" : "rgba(45, 55, 72, 0.4)",
                          borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                          ...(input.isStereo
                            ? { borderLeft: "3px solid rgba(99, 102, 241, 0.6)" }
                            : {}),
                        }}
                      >
                        <td className="py-3 px-4 text-white align-middle font-medium">
                          {input.channelNumber}
                        </td>
                        <td className="py-3 px-4 text-white font-medium align-middle">
                          {input.name || ""}
                          {input.isStereo && linkedChannel && (
                            <div className="text-indigo-300 text-xs flex items-center mt-1">
                              <Link className="h-3 w-3 mr-1" />
                              <span>Stereo w/ Ch {linkedChannel.channelNumber}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-white align-middle">{input.type || ""}</td>
                        <td className="py-3 px-4 text-white align-middle">{input.device || ""}</td>
                        <td className="py-3 px-4 text-white align-middle">
                          {input.connection || ""}
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {snakeType === "N/A" ? "" : snakeType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {snakeInput === "N/A" ? "" : snakeInput}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {consoleType === "N/A" ? "" : consoleType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {consoleInput === "N/A" ? "" : consoleInput}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {networkType === "N/A" ? "" : networkType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {networkPatch === "N/A" ? "" : networkPatch}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${input.phantom ? "bg-indigo-500/20 text-indigo-300" : "bg-gray-700 text-gray-400"}`}
                          >
                            {input.phantom ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">{input.notes || ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No inputs defined.</p>
          )}
        </div>

        {/* Output List */}
        <div
          className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8"
          style={{
            borderLeft: "4px solid #4f46e5",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
            <Headphones className="h-5 w-5 mr-2" />
            Output List
          </h3>
          {outputs && outputs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    style={{
                      background: "linear-gradient(to right, #2d3748, #1e293b)",
                      borderBottom: "2px solid rgba(99, 102, 241, 0.4)",
                    }}
                  >
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Ch</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Name</th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Source Type
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Snake Type
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Snake Output
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Console Type
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Console Output
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Network Type
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Network Patch
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                      Destination
                    </th>
                    <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Notes</th>
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
                        ? `${output.sourceDetails?.snakeType || "N/A"}`
                        : "N/A";
                    const snakeOutput =
                      output.sourceType &&
                      ["Analog Snake", "Digital Snake"].includes(output.sourceType)
                        ? output.sourceDetails?.outputNumber
                          ? `#${output.sourceDetails.outputNumber}`
                          : "N/A"
                        : "N/A";
                    const consoleType =
                      (output.sourceType === "Console Output" ||
                        output.sourceType === "Analog Snake") &&
                      output.sourceDetails?.consoleType
                        ? output.sourceDetails.consoleType
                        : output.sourceType === "Digital Snake" ||
                            output.sourceType === "Digital Network"
                          ? "-"
                          : "N/A";
                    const consoleOutput =
                      (output.sourceType === "Console Output" ||
                        output.sourceType === "Analog Snake") &&
                      output.sourceDetails?.consoleOutputNumber
                        ? `#${output.sourceDetails.consoleOutputNumber}`
                        : output.sourceType === "Digital Snake" ||
                            output.sourceType === "Digital Network"
                          ? "-"
                          : "N/A";
                    const networkType =
                      output.sourceType &&
                      ["Digital Snake", "Digital Network"].includes(output.sourceType)
                        ? `${output.sourceDetails?.networkType || "N/A"}`
                        : "N/A";
                    const networkPatch =
                      output.sourceType &&
                      ["Digital Snake", "Digital Network"].includes(output.sourceType)
                        ? output.sourceDetails?.networkPatch
                          ? `#${output.sourceDetails.networkPatch}`
                          : "N/A"
                        : "N/A";

                    return (
                      <tr
                        key={output.id}
                        style={{
                          background:
                            index % 2 === 0 ? "rgba(31, 41, 55, 0.7)" : "rgba(45, 55, 72, 0.4)",
                          borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                          ...(output.isStereo
                            ? { borderLeft: "3px solid rgba(99, 102, 241, 0.6)" }
                            : {}),
                        }}
                      >
                        <td className="py-3 px-4 text-white align-middle font-medium">
                          {output.channelNumber}
                        </td>
                        <td className="py-3 px-4 text-white font-medium align-middle">
                          {output.name || ""}
                          {output.isStereo && linkedChannel && (
                            <div className="text-indigo-300 text-xs flex items-center mt-1">
                              <Link className="h-3 w-3 mr-1" />
                              <span>Stereo w/ Ch {linkedChannel.channelNumber}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          {output.sourceType || ""}
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {snakeType === "N/A" ? "" : snakeType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {snakeOutput === "N/A" ? "" : snakeOutput}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {consoleType === "N/A" ? "" : consoleType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {consoleOutput === "N/A" ? "" : consoleOutput}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {networkType === "N/A" ? "" : networkType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <span className="text-indigo-300">
                            {networkPatch === "N/A" ? "" : networkPatch}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white align-middle">
                          <div className="font-medium">{output.destinationType || ""}</div>
                          {output.destinationGear && (
                            <div className="text-gray-400 text-sm">{output.destinationGear}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-white align-middle">{output.notes || ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No outputs defined.</p>
          )}
        </div>

        {/* Notes section (if it was from patchSheet.info.notes) is removed. 
            If notes are part of inputs/outputs, they remain.
            If there was a general notes field for the whole patch sheet (outside inputs/outputs),
            and it was part of `patchSheet.info.notes`, it's now removed from the export.
        */}
        {/* Example: if patchSheet.info.notes was displayed, it would be removed like this:
          {patchSheet.info && patchSheet.info.notes && (
            <div
              className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8"
              style={{
                borderLeft: "4px solid #4f46e5",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
            >
              <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
                <Music className="h-5 w-5 mr-2" /> // Music icon was for notes
                Additional Notes
              </h3>
              <p className="text-white">{patchSheet.info.notes}</p>
            </div>
          )}
        */}

        {/* Footer with enhanced branding */}
        <div className="relative mt-12 pt-6 overflow-hidden">
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to right, rgba(31, 41, 55, 0.5), rgba(31, 41, 55, 0.7))",
              borderTop: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "8px",
              zIndex: -1,
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
              <span>Generated on {new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "-30px",
              right: "-30px",
              opacity: "0.05",
              transform: "rotate(-15deg)",
              zIndex: -1,
            }}
          >
            <Bookmark className="h-40 w-40" />
          </div>
        </div>
      </div>
    );
  },
);

PatchSheetExport.displayName = "PatchSheetExport";
export default PatchSheetExport;
