import React, { useState, useRef, useEffect } from "react";
import { EqSetting } from "../../lib/dsp";
import { Trash2, Plus } from "lucide-react";

interface EqControlsProps {
  measurement: {
    id: string;
    eq_settings?: EqSetting[];
  } | null;
  onEqChange: (id: string, eq_settings: EqSetting[]) => void;
}

const EqControls: React.FC<EqControlsProps> = ({ measurement, onEqChange }) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"top" | "bottom">("bottom");
  const addButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isAddMenuOpen && addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      if (window.innerHeight - rect.bottom < 200) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [isAddMenuOpen]);

  if (!measurement) {
    return null;
  }

  const handleAddFilter = (type: EqSetting["type"]) => {
    let newFilter: EqSetting;
    switch (type) {
      case "coda_human":
        newFilter = { id: crypto.randomUUID(), type, gain: 0, isEnabled: true };
        break;
      case "dandb_cpl":
        newFilter = { id: crypto.randomUUID(), type, value: 0, isEnabled: true };
        break;
      case "dandb_hfc":
        newFilter = { id: crypto.randomUUID(), type, value: "HFC1", isEnabled: true };
        break;
      case "jbl_asc":
        newFilter = { id: crypto.randomUUID(), type, gain: 0, isEnabled: true };
        break;
      case "jbl_hf_throw":
        newFilter = { id: crypto.randomUUID(), type, gain: 0, isEnabled: true };
        break;
      case "lacoustics_air_comp":
        newFilter = { id: crypto.randomUUID(), type, gain: 0, isEnabled: true };
        break;
      case "coda_low_boost":
        newFilter = { id: crypto.randomUUID(), type, gain: 0, isEnabled: true };
        break;
      case "coda_subsonic":
        newFilter = { id: crypto.randomUUID(), type, gain: 0, isEnabled: true };
        break;
      case "coda_hf_shelf":
        newFilter = { id: crypto.randomUUID(), type, gain: 0, isEnabled: true };
        break;
      default:
        newFilter = {
          id: crypto.randomUUID(),
          type: "peaking",
          freq: 1000,
          gain: 0,
          q: 1,
          isEnabled: true,
        };
    }
    const newSettings = [...(measurement.eq_settings || []), newFilter];
    onEqChange(measurement.id, newSettings);
    setIsAddMenuOpen(false);
  };

  const handleRemoveFilter = (id: string) => {
    const newSettings = (measurement.eq_settings || []).filter((f) => f.id !== id);
    onEqChange(measurement.id, newSettings);
  };

  const handleFilterChange = (id: string, newValues: Partial<EqSetting>) => {
    const newSettings = (measurement.eq_settings || []).map((f) =>
      f.id === id ? { ...f, ...newValues } : f,
    ) as EqSetting[];
    onEqChange(measurement.id, newSettings);
  };

  const renderFilterControls = (filter: EqSetting) => {
    const isShelf = filter.type === "low_shelf" || filter.type === "high_shelf";
    const isPass = filter.type === "low_pass" || filter.type === "high_pass";
    const showGain = !isPass; // no Gain for HP/LP
    const showQ = filter.type === "peaking" || isPass; // hide Q for shelves (since S=1 in math)

    switch (filter.type) {
      case "peaking":
      case "low_shelf":
      case "high_shelf":
      case "low_pass":
      case "high_pass":
        return (
          <>
            <select
              value={filter.type}
              onChange={(e) => handleFilterChange(filter.id, { type: e.target.value as any })}
              className="bg-gray-800 text-white p-1 rounded-md text-xs w-24"
            >
              <option value="peaking">Peaking</option>
              <option value="low_shelf">Low Shelf</option>
              <option value="high_shelf">High Shelf</option>
              <option value="low_pass">Low Pass</option>
              <option value="high_pass">High Pass</option>
            </select>
            <div className="flex items-center space-x-1">
              <label className="text-xs text-gray-400">Freq</label>
              <input
                type="number"
                value={filter.freq}
                onChange={(e) => handleFilterChange(filter.id, { freq: Number(e.target.value) })}
                className="bg-gray-800 text-white p-1 rounded-md text-xs w-20"
              />
            </div>
            {showGain && (
              <div className="flex items-center space-x-1">
                <label className="text-xs text-gray-400">Gain</label>
                <input
                  type="number"
                  step="0.5"
                  value={filter.gain}
                  onChange={(e) => handleFilterChange(filter.id, { gain: Number(e.target.value) })}
                  className="bg-gray-800 text-white p-1 rounded-md text-xs w-16"
                />
              </div>
            )}
            {showQ && (
              <div className="flex items-center space-x-1">
                <label className="text-xs text-gray-400">{isPass ? "Q" : "Q"}</label>
                <input
                  type="number"
                  step="0.1"
                  value={filter.q}
                  onChange={(e) => handleFilterChange(filter.id, { q: Number(e.target.value) })}
                  className="bg-gray-800 text-white p-1 rounded-md text-xs w-16"
                />
              </div>
            )}
            {isPass && (
              <div className="flex items-center space-x-1">
                <label className="text-xs text-gray-400">Slope</label>
                <select
                  value={filter.slope ?? 12}
                  onChange={(e) =>
                    handleFilterChange(filter.id, {
                      slope: Number(e.target.value) as 12 | 24 | 48,
                    })
                  }
                  className="bg-gray-800 text-white p-1 rounded-md text-xs w-24"
                >
                  <option value={12}>12 dB/oct</option>
                  <option value={24}>24 dB/oct</option>
                  <option value={48}>48 dB/oct</option>
                </select>
              </div>
            )}
          </>
        );
      case "coda_human":
        return (
          <>
            <span className="text-xs text-white w-24">CODA Human</span>
            <div className="flex items-center space-x-1">
              <label className="text-xs text-gray-400">Gain</label>
              <input
                type="number"
                step="0.5"
                value={filter.gain}
                onChange={(e) => handleFilterChange(filter.id, { gain: Number(e.target.value) })}
                className="bg-gray-800 text-white p-1 rounded-md text-xs w-16"
              />
            </div>
          </>
        );
      case "dandb_cpl":
        return (
          <>
            <span className="text-xs text-white w-24">d&b CPL</span>
            <div className="flex items-center space-x-1">
              <label className="text-xs text-gray-400">Value</label>
              <input
                type="number"
                step="0.5"
                value={filter.value}
                onChange={(e) => handleFilterChange(filter.id, { value: Number(e.target.value) })}
                className="bg-gray-800 text-white p-1 rounded-md text-xs w-16"
              />
            </div>
          </>
        );
      case "dandb_hfc":
        return (
          <>
            <span className="text-xs text-white w-24">d&b HFC</span>
            <select
              value={filter.value}
              onChange={(e) =>
                handleFilterChange(filter.id, { value: e.target.value as "HFC1" | "HFC2" })
              }
              className="bg-gray-800 text-white p-1 rounded-md text-xs w-24"
            >
              <option value="HFC1">HFC1</option>
              <option value="HFC2">HFC2</option>
            </select>
          </>
        );
      case "jbl_asc":
      case "jbl_hf_throw":
      case "lacoustics_air_comp":
      case "coda_low_boost":
      case "coda_subsonic":
      case "coda_hf_shelf":
        return (
          <>
            <span className="text-xs text-white w-24">
              {filter.type.replace(/_/g, " ").toUpperCase()}
            </span>
            <div className="flex items-center space-x-1">
              <label className="text-xs text-gray-400">Gain</label>
              <input
                type="number"
                step="0.5"
                value={filter.gain}
                onChange={(e) => handleFilterChange(filter.id, { gain: Number(e.target.value) })}
                className="bg-gray-800 text-white p-1 rounded-md text-xs w-16"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-2 relative">
        <button
          ref={addButtonRef}
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className="bg-indigo-500 text-white hover:bg-indigo-600 font-semibold py-1 px-3 rounded-md text-sm inline-flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Filter
        </button>
        {isAddMenuOpen && (
          <div
            className={`absolute z-10 w-48 bg-gray-800 rounded-md shadow-lg ${
              dropdownPosition === "top" ? "bottom-full mb-1" : "mt-1"
            }`}
          >
            <button
              onClick={() => handleAddFilter("peaking")}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              Parametric EQ
            </button>
            <button
              onClick={() => handleAddFilter("coda_human")}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              CODA Human
            </button>
            <button
              onClick={() => handleAddFilter("dandb_cpl")}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              d&b CPL
            </button>
            <button
              onClick={() => handleAddFilter("dandb_hfc")}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              d&b HFC
            </button>
            <button
              onClick={() => handleAddFilter("jbl_asc")}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              JBL ASC
            </button>
            <button
              onClick={() => handleAddFilter("jbl_hf_throw")}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              JBL HF Throw
            </button>
            <button
              onClick={() => handleAddFilter("lacoustics_air_comp")}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              L-Acoustics Air Comp
            </button>
            <button
              onClick={() => handleAddFilter("coda_low_boost")}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              CODA Low Boost
            </button>
            <button
              onClick={() => handleAddFilter("coda_subsonic")}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              CODA Subsonic
            </button>
            <button
              onClick={() => handleAddFilter("coda_hf_shelf")}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              CODA HF Shelf
            </button>
          </div>
        )}
      </div>
      <div className="flex-grow overflow-y-auto">
        <div className="space-y-2">
          {(measurement.eq_settings || []).map((filter) => (
            <div key={filter.id} className="bg-gray-700 p-2 rounded-md flex items-center space-x-2">
              {renderFilterControls(filter)}
              <button
                onClick={() => handleRemoveFilter(filter.id)}
                className="p-1 hover:bg-gray-600 rounded-full ml-auto"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EqControls;
