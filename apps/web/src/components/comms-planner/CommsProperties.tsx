import React from "react";
import { CommsElementProps } from "./CommsElement";
import { CommsBeltpackProps } from "./CommsBeltpack";
import {
  POE_CLASSES,
  FREQUENCY_BANDS,
  SystemModel,
  MODEL_DEFAULTS,
  RFBand,
  validateBeltpackChannels,
} from "../../lib/commsTypes";

interface CommsPropertiesProps {
  selectedElement: (CommsElementProps | CommsBeltpackProps) | null;
  onPropertyChange: (id: string, property: string, value: any) => void;
  onDeleteElement: (id: string) => void;
  dfsEnabled?: boolean;
  beltpacks?: CommsBeltpackProps[]; // For channel validation
}

const CommsProperties: React.FC<CommsPropertiesProps> = ({
  selectedElement,
  onPropertyChange,
  onDeleteElement,
  dfsEnabled = false,
  beltpacks = [],
}) => {
  if (!selectedElement) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-4">Properties</h3>
        <div className="text-center text-gray-400">
          <p>Select an element to see its properties.</p>
        </div>
      </div>
    );
  }

  // Check if selected element is a beltpack
  const isBeltpack = "transceiverRef" in selectedElement || "signalStrength" in selectedElement;

  if (isBeltpack) {
    const beltpack = selectedElement as CommsBeltpackProps;
    return (
      <div className="bg-gray-800 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-white">Beltpack Properties</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Label</label>
            <input
              type="text"
              value={beltpack.label}
              onChange={(e) => onPropertyChange(beltpack.id, "label", e.target.value)}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Connected Transceiver</label>
            <input
              type="text"
              value={beltpack.transceiverRef || "Not connected"}
              readOnly
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white px-3 py-2 sm:text-sm cursor-not-allowed opacity-75"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Battery Level (%)</label>
            <input
              type="number"
              value={beltpack.batteryLevel || ""}
              min={0}
              max={100}
              onChange={(e) => {
                const value = e.target.value === "" ? 100 : parseInt(e.target.value);
                onPropertyChange(beltpack.id, "batteryLevel", value);
              }}
              onBlur={(e) => {
                if (e.target.value === "") {
                  onPropertyChange(beltpack.id, "batteryLevel", 100);
                }
              }}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Channel Planning */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-white mb-3">Channel Planning</h4>
            <div className="space-y-3">
              {["A", "B", "C", "D"].map((channel) => {
                const assignment = beltpack.channelAssignments?.find(
                  (ca) => ca.channel === channel,
                );
                return (
                  <div key={channel} className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 w-6">Ch {channel}:</span>
                    <input
                      type="text"
                      value={assignment?.assignment || ""}
                      onChange={(e) => {
                        const newAssignment = e.target.value;
                        const currentAssignments = beltpack.channelAssignments || [];
                        const updatedAssignments = currentAssignments.filter(
                          (ca) => ca.channel !== channel,
                        );

                        if (newAssignment.trim()) {
                          updatedAssignments.push({
                            channel: channel as "A" | "B" | "C" | "D",
                            assignment: newAssignment.trim(),
                          });
                        }

                        onPropertyChange(beltpack.id, "channelAssignments", updatedAssignments);
                      }}
                      placeholder={`Assign channel ${channel}...`}
                      className="flex-1 bg-gray-700 border-gray-600 rounded-md shadow-sm text-white px-2 py-1 text-xs focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Assign each channel to a specific purpose (e.g., Production, Audio, Video, Program)
            </p>
          </div>

          {/* Channel Validation Messages */}
          {(() => {
            const validationResults = validateBeltpackChannels(beltpacks);
            const beltpackValidations = validationResults.filter((v) => v.id === beltpack.id);
            return beltpackValidations.length > 0 ? (
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-white mb-2">Channel Validation</h4>
                <div className="space-y-1">
                  {beltpackValidations.map((validation, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-2 rounded ${
                        validation.type === "error"
                          ? "bg-red-500/20 text-red-300"
                          : validation.type === "warning"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {validation.message}
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Read-only status information */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-white mb-2">Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Signal Strength:</span>
                <span
                  className={`font-medium ${
                    beltpack.signalStrength && beltpack.signalStrength > 75
                      ? "text-green-400"
                      : beltpack.signalStrength && beltpack.signalStrength > 50
                        ? "text-yellow-400"
                        : beltpack.signalStrength && beltpack.signalStrength > 25
                          ? "text-orange-400"
                          : "text-red-400"
                  }`}
                >
                  {Math.round(beltpack.signalStrength || 0)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Online:</span>
                <span
                  className={`font-medium ${beltpack.online ? "text-green-400" : "text-gray-500"}`}
                >
                  {beltpack.online ? "Connected" : "Offline"}
                </span>
              </div>
              {beltpack.transceiverRef && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Connected to:</span>
                  <span className="text-white">Transceiver</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <button
              onClick={() => onDeleteElement(beltpack.id)}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Delete Beltpack
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Now we know selectedElement is a CommsElementProps
  const element = selectedElement as CommsElementProps;

  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-4">
      <h3 className="text-lg font-medium text-white">{element.systemType} Properties</h3>

      {/* Basic Properties */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">Label</label>
          <input
            type="text"
            value={element.label}
            onChange={(e) => onPropertyChange(element.id, "label", e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Model selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300">Model</label>
          <select
            value={element.model || "FSII_E1_19"}
            onChange={(e) => onPropertyChange(element.id, "model", e.target.value as SystemModel)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md text-white px-3 py-2"
          >
            {element.systemType === "FSII" && (
              <>
                <option value="FSII_E1_19">FSII E1 1.9 GHz (5 BP/ant)</option>
                <option value="FSII_IP_19">FSII-IPT 1.9 GHz (10 BP/ant, PoE)</option>
                <option value="FSII_24">FSII 2.4 GHz (4 BP/ant)</option>
              </>
            )}
            {element.systemType === "FSII-Base" && (
              <>
                <option value="FSII_BASE_19">FSII Base Station 1.9 GHz</option>
                <option value="FSII_BASE_24">FSII Base Station 2.4 GHz</option>
              </>
            )}
            {element.systemType === "Edge" && (
              <option value="EDGE_5G">Edge 5 GHz (10 BP/ant)</option>
            )}
            {element.systemType === "Bolero" && (
              <>
                <option value="BOLERO_19">Bolero 1.9 GHz (10 BP/ant)</option>
                <option value="BOLERO_24">Bolero 2.4 GHz (8 BP/ant)</option>
              </>
            )}
          </select>
        </div>

        {/* Height control */}
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Height (ft)
            <span className="text-xs text-gray-500 ml-2">
              (target: {element.model ? MODEL_DEFAULTS[element.model].placement.targetHeightFt : 9}
              ft)
            </span>
          </label>
          <input
            type="number"
            value={element.z || ""}
            min={6}
            max={40}
            onChange={(e) => {
              const value = e.target.value === "" ? "" : parseFloat(e.target.value);
              onPropertyChange(element.id, "z", value);
            }}
            onBlur={(e) => {
              if (e.target.value === "") {
                onPropertyChange(
                  element.id,
                  "z",
                  element.model ? MODEL_DEFAULTS[element.model].placement.targetHeightFt : 9,
                );
              }
            }}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* RF Band (computed from model) */}
        <div>
          <label className="block text-sm font-medium text-gray-300">
            RF Band
            <span className="text-xs text-gray-500 ml-2">(computed from model)</span>
          </label>
          <div className="mt-1 flex items-center space-x-2">
            <span className="block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm text-gray-400 px-3 py-2 sm:text-sm">
              {element.model ? MODEL_DEFAULTS[element.model].band : "1.9GHz"}
            </span>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={element.overrideFlags?.band || false}
                onChange={(e) =>
                  onPropertyChange(element.id, "overrideFlags.band", e.target.checked)
                }
                className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-xs text-gray-400">Override</span>
            </label>
          </div>
          {element.overrideFlags?.band && (
            <select
              value={element.band || "1.9GHz"}
              onChange={(e) => onPropertyChange(element.id, "band", e.target.value as RFBand)}
              className="mt-2 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="1.9GHz">1.9 GHz (DECT)</option>
              <option value="2.4GHz">2.4 GHz</option>
              <option value="5GHz">5 GHz</option>
            </select>
          )}
        </div>

        {/* Channel configuration for Edge */}
        {element.systemType === "Edge" && (
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Primary Channel{" "}
              {dfsEnabled && (
                <span className="text-xs text-gray-500 ml-2">(backup auto-assigned)</span>
              )}
            </label>
            <select
              value={element.channels?.primary ?? 36}
              onChange={(e) =>
                onPropertyChange(element.id, "channels.primary", parseInt(e.target.value))
              }
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md text-white px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {FREQUENCY_BANDS["5GHz"].nonDFS.map((ch) => (
                <option key={ch} value={ch}>
                  Ch {ch}
                </option>
              ))}
              {dfsEnabled &&
                FREQUENCY_BANDS["5GHz"].dfs.map((ch) => (
                  <option key={ch} value={ch}>
                    Ch {ch} (DFS)
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Adjacent cells should be ≥6–8 channels apart.
            </p>
          </div>
        )}

        {/* PoE Class (computed from model) */}
        <div>
          <label className="block text-sm font-medium text-gray-300">
            PoE Class
            <span className="text-xs text-gray-500 ml-2">(computed from model)</span>
          </label>
          <div className="mt-1 flex items-center space-x-2">
            <span className="block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm text-gray-400 px-3 py-2 sm:text-sm">
              Class {element.model ? MODEL_DEFAULTS[element.model].poeClass : 0} (
              {POE_CLASSES[element.model ? MODEL_DEFAULTS[element.model].poeClass : 0]}W)
            </span>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={false} // PoE class override not implemented yet
                onChange={() => {}} // Placeholder
                className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                disabled
              />
              <span className="ml-2 text-xs text-gray-500">Override (future)</span>
            </label>
          </div>
        </div>

        {/* Beltpack capacity */}
        {(element.systemType === "FSII" ||
          element.systemType === "Edge" ||
          element.systemType === "Bolero") && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Max Beltpacks
                <span className="text-xs text-gray-500 ml-2">(computed from model)</span>
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <span className="block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm text-gray-400 px-3 py-2 sm:text-sm">
                  {element.model ? MODEL_DEFAULTS[element.model].maxBeltpacks : 5}
                </span>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={element.overrideFlags?.maxBeltpacks || false}
                    onChange={(e) =>
                      onPropertyChange(element.id, "overrideFlags.maxBeltpacks", e.target.checked)
                    }
                    className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-xs text-gray-400">Override</span>
                </label>
              </div>
              {element.overrideFlags?.maxBeltpacks && (
                <input
                  type="number"
                  value={element.maxBeltpacks || 5}
                  min={1}
                  max={20}
                  onChange={(e) =>
                    onPropertyChange(element.id, "maxBeltpacks", parseInt(e.target.value))
                  }
                  className="mt-2 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Current Beltpacks</label>
              <input
                type="number"
                value={element.currentBeltpacks || ""}
                min={0}
                max={element.maxBeltpacks || 5}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                  onPropertyChange(element.id, "currentBeltpacks", value);
                }}
                onBlur={(e) => {
                  if (e.target.value === "") {
                    onPropertyChange(element.id, "currentBeltpacks", 0);
                  }
                }}
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </>
        )}

        {/* Coverage radius (computed from model) */}
        {element.systemType !== "FSII-Base" && (
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Coverage Radius (ft)
              <span className="text-xs text-gray-500 ml-2">(computed from model)</span>
            </label>
            <div className="mt-1 flex items-center space-x-2">
              <span className="block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm text-gray-400 px-3 py-2 sm:text-sm">
                {element.model ? MODEL_DEFAULTS[element.model].coverageRadiusFt : 300} ft
              </span>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={element.overrideFlags?.coverage || false}
                  onChange={(e) =>
                    onPropertyChange(element.id, "overrideFlags.coverage", e.target.checked)
                  }
                  className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-xs text-gray-400">Override</span>
              </label>
            </div>
            {element.overrideFlags?.coverage && (
              <input
                type="number"
                value={element.coverageRadius || 300}
                min={50}
                max={1000}
                onChange={(e) =>
                  onPropertyChange(element.id, "coverageRadius", parseFloat(e.target.value))
                }
                className="mt-2 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <button
          onClick={() => onDeleteElement(element.id)}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
        >
          Delete Element
        </button>
      </div>

      {/* Validation messages */}
      {element.validationErrors && element.validationErrors.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-white mb-2">Validation Issues</h4>
          <div className="space-y-1">
            {element.validationErrors.map((error: any, idx: number) => (
              <div
                key={idx}
                className={`text-xs p-2 rounded ${
                  error.type === "error"
                    ? "bg-red-500/20 text-red-300"
                    : error.type === "warning"
                      ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-blue-500/20 text-blue-300"
                }`}
              >
                {error.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommsProperties;
