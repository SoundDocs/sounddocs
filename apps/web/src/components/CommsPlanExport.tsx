import { forwardRef } from "react";
import { Bookmark, Radio, MapPin, Users, Clock } from "lucide-react";
import { CommsPlan } from "../lib/commsTypes";
import CommsCanvas from "./comms-planner/CommsCanvas";
import { CommsElementProps } from "./comms-planner/CommsElement";
import { CommsBeltpackProps } from "./comms-planner/CommsBeltpack";

interface CommsPlanExportProps {
  commsPlan: CommsPlan;
}

const CommsPlanExport = forwardRef<HTMLDivElement, CommsPlanExportProps>(({ commsPlan }, ref) => {
  // Early return if commsPlan is null or undefined
  if (!commsPlan) {
    return (
      <div
        ref={ref}
        className="export-wrapper text-white p-8 rounded-lg shadow-xl"
        style={{
          width: "1800px",
          minHeight: "100vh",
          position: "absolute",
          left: "-9999px",
          fontFamily: "Inter, sans-serif",
          background: "linear-gradient(to bottom, #111827, #0f172a)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div className="text-center py-12">
          <p className="text-gray-400">Loading comms plan...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
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

  // Convert comms plan data to CommsCanvas format
  const elements: CommsElementProps[] = (commsPlan.transceivers || []).map((tx) => ({
    id: tx.id,
    systemType: tx.systemType,
    model: tx.model,
    label: tx.label,
    x: tx.x,
    y: tx.y,
    z: tx.z,
    band: tx.band,
    channels: tx.channels,
    coverageRadius: tx.coverageRadius || 150, // Fallback to default coverage radius
    currentBeltpacks: tx.currentBeltpacks,
    maxBeltpacks: tx.maxBeltpacks,
    poeClass: tx.poeClass,
    dfsEnabled: tx.dfsEnabled,
    zoneId: tx.zoneId,
    overrideFlags: tx.overrideFlags,
  }));

  if (commsPlan.baseStation) {
    const bs = commsPlan.baseStation;
    elements.push({
      id: bs.id,
      systemType: bs.systemType,
      model: bs.model,
      label: bs.label,
      x: bs.x,
      y: bs.y,
      z: bs.z,
      band: bs.systemType === "FSII-Base" ? "1.9GHz" : "2.4GHz", // Default band for base stations
      coverageRadius: 0, // Base stations don't have wireless coverage
      currentBeltpacks: 0,
      maxBeltpacks: 0,
      poeClass: 0,
    });
  }

  const beltpacks: CommsBeltpackProps[] = (commsPlan.beltpacks || []).map((bp) => ({
    id: bp.id,
    label: bp.label,
    x: bp.x,
    y: bp.y,
    transceiverRef: bp.transceiverRef,
    selected: false,
    signalStrength: bp.signalStrength || 100,
    batteryLevel: bp.batteryLevel || 100,
    online: bp.online !== false,
    channelAssignments: bp.channelAssignments,
  }));

  return (
    <div
      ref={ref}
      className="export-wrapper text-white p-8 rounded-lg shadow-xl"
      style={{
        width: "1800px",
        minHeight: "100vh",
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
            <p className="text-indigo-400 font-medium">Professional Event Documentation</p>
          </div>
        </div>
        <div className="text-right z-10">
          <h2 className="text-2xl font-bold text-white">{commsPlan.name}</h2>
          <p className="text-gray-400">
            {commsPlan.lastEdited
              ? `Last Edited: ${formatDate(commsPlan.lastEdited)}`
              : `Created: ${formatDate(commsPlan.createdAt || new Date())}`}
          </p>
        </div>
      </div>

      {/* Venue Overview */}
      <div
        className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8"
        style={{
          borderLeft: "4px solid #4f46e5",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
          <MapPin className="h-5 w-5 mr-2" />
          Venue Overview
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Venue Size</p>
            <p className="text-white font-medium">
              {commsPlan.venueGeometry?.width || 0}' × {commsPlan.venueGeometry?.height || 0}'
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Transceivers</p>
            <p className="text-white font-medium">{(commsPlan.transceivers || []).length} units</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Beltpacks</p>
            <p className="text-white font-medium">{(commsPlan.beltpacks || []).length} units</p>
          </div>
        </div>
      </div>

      {/* Venue Map/Canvas */}
      <div
        className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8"
        style={{
          borderLeft: "4px solid #4f46e5",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
          <MapPin className="h-5 w-5 mr-2" />
          Venue Layout
        </h3>
        <div
          className="bg-gray-900 rounded-lg overflow-hidden"
          style={{
            width: "100%",
            height: "900px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
          }}
        >
          <div
            className="export-canvas-container"
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              border: "2px solid rgba(79, 70, 229, 0.3)",
              borderRadius: "8px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CommsCanvas
              key={`export-${commsPlan.id}-${Date.now()}`}
              elements={elements}
              beltpacks={beltpacks}
              zones={[]}
              selectedElementId={null}
              onSelectElement={() => {}}
              onElementDragStop={() => {}}
              onBeltpackDragStop={() => {}}
              venueWidthFt={commsPlan.venueGeometry?.width || 100}
              venueHeightFt={commsPlan.venueGeometry?.height || 80}
              showGrid={true}
              showCoverage={true}
              showHeatmap={false}
              renderCoverageOnCanvas={true}
              fitMode="fit"
            />
          </div>
        </div>
      </div>

      {/* Transceivers Table */}
      <div
        className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8"
        style={{
          borderLeft: "4px solid #4f46e5",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
          <Radio className="h-5 w-5 mr-2" />
          Transceivers
        </h3>
        {(commsPlan.transceivers || []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  style={{
                    background: "linear-gradient(to right, #2d3748, #1e293b)",
                    borderBottom: "2px solid rgba(99, 102, 241, 0.4)",
                  }}
                >
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Label</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Model</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Band</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Coverage</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
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
                        background:
                          index % 2 === 0 ? "rgba(31, 41, 55, 0.7)" : "rgba(45, 55, 72, 0.4)",
                        borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                      }}
                    >
                      <td className="py-3 px-4 text-white align-middle font-medium">
                        {transceiver.label}
                      </td>
                      <td className="py-3 px-4 text-white align-middle">{transceiver.model}</td>
                      <td className="py-3 px-4 text-white align-middle">{transceiver.band}</td>
                      <td className="py-3 px-4 text-white align-middle">
                        {transceiver.coverageRadius}' radius
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        {connectedBeltpacks.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">No transceivers defined.</p>
        )}
      </div>

      {/* Beltpacks Table */}
      <div
        className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8"
        style={{
          borderLeft: "4px solid #4f46e5",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
          <Users className="h-5 w-5 mr-2" />
          Beltpacks
        </h3>
        {(commsPlan.beltpacks || []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  style={{
                    background: "linear-gradient(to right, #2d3748, #1e293b)",
                    borderBottom: "2px solid rgba(99, 102, 241, 0.4)",
                  }}
                >
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Label</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
                    Connected To
                  </th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">
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
                        background:
                          index % 2 === 0 ? "rgba(31, 41, 55, 0.7)" : "rgba(45, 55, 72, 0.4)",
                        borderBottom: "1px solid rgba(55, 65, 81, 0.5)",
                      }}
                    >
                      <td className="py-3 px-4 text-white align-middle font-medium">
                        {beltpack.label}
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        {transceiver ? (
                          <div className="font-medium">{transceiver.label}</div>
                        ) : (
                          "Not Connected"
                        )}
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        {beltpack.channelAssignments && beltpack.channelAssignments.length > 0 ? (
                          <div className="space-y-1">
                            {beltpack.channelAssignments.map((assignment, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="text-indigo-300">{assignment.channel}:</span>{" "}
                                {assignment.assignment}
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
          <p className="text-gray-400">No beltpacks defined.</p>
        )}
      </div>

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
});

CommsPlanExport.displayName = "CommsPlanExport";
export default CommsPlanExport;
