import React from "react";
import { PlusCircle, Trash2, Copy } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { InputChannel } from "../../lib/types";

interface RiderInputListProps {
  inputList: InputChannel[];
  onUpdateInputList: (inputs: InputChannel[]) => void;
}

const RiderInputList: React.FC<RiderInputListProps> = ({ inputList, onUpdateInputList }) => {
  const handleAddInput = () => {
    const newInput: InputChannel = {
      id: uuidv4(),
      channel_number: "",
      name: "",
      type: "",
      mic_type: "",
      phantom_power: false,
      di_needed: false,
      notes: "",
    };
    onUpdateInputList([...inputList, newInput]);
  };

  const handleDeleteInput = (id: string) => {
    onUpdateInputList(inputList.filter((input) => input.id !== id));
  };

  const handleDuplicateInput = (id: string) => {
    const inputToDuplicate = inputList.find((input) => input.id === id);
    if (inputToDuplicate) {
      const duplicated: InputChannel = {
        ...inputToDuplicate,
        id: uuidv4(),
      };
      const index = inputList.findIndex((input) => input.id === id);
      const newList = [...inputList];
      newList.splice(index + 1, 0, duplicated);
      onUpdateInputList(newList);
    }
  };

  const handleUpdateInput = (id: string, field: keyof InputChannel, value: string | boolean) => {
    onUpdateInputList(
      inputList.map((input) => (input.id === id ? { ...input, [field]: value } : input)),
    );
  };

  const inputClass =
    "bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm w-full";

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header with section title */}
      <div className="border-b border-gray-700 pb-2 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-white">Input/Channel List</h2>
        <p className="text-gray-400 text-xs md:text-sm">
          Detailed list of all required inputs and channels
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-750 text-left">
              <th className="p-3 text-gray-300 font-semibold text-sm">#</th>
              <th className="p-3 text-gray-300 font-semibold text-sm">Ch #</th>
              <th className="p-3 text-gray-300 font-semibold text-sm">Name</th>
              <th className="p-3 text-gray-300 font-semibold text-sm">Type</th>
              <th className="p-3 text-gray-300 font-semibold text-sm">Mic Type</th>
              <th className="p-3 text-gray-300 font-semibold text-sm text-center">+48V</th>
              <th className="p-3 text-gray-300 font-semibold text-sm text-center">DI</th>
              <th className="p-3 text-gray-300 font-semibold text-sm">Notes</th>
              <th className="p-3 text-gray-300 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inputList.map((input, index) => (
              <tr key={input.id} className="border-b border-gray-700 hover:bg-gray-750/30">
                <td className="p-3 text-gray-400 text-sm">{index + 1}</td>
                <td className="p-3">
                  <input
                    type="text"
                    value={input.channel_number}
                    onChange={(e) => handleUpdateInput(input.id, "channel_number", e.target.value)}
                    className={inputClass}
                    placeholder="1"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={input.name}
                    onChange={(e) => handleUpdateInput(input.id, "name", e.target.value)}
                    className={inputClass}
                    placeholder="Kick Drum"
                  />
                </td>
                <td className="p-3">
                  <select
                    value={input.type}
                    onChange={(e) => handleUpdateInput(input.id, "type", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select...</option>
                    <option value="Vocal">Vocal</option>
                    <option value="Instrument">Instrument</option>
                    <option value="DI">DI</option>
                    <option value="Line">Line</option>
                    <option value="Playback">Playback</option>
                    <option value="Other">Other</option>
                  </select>
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={input.mic_type || ""}
                    onChange={(e) => handleUpdateInput(input.id, "mic_type", e.target.value)}
                    className={inputClass}
                    placeholder="SM57"
                  />
                </td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={input.phantom_power}
                    onChange={(e) => handleUpdateInput(input.id, "phantom_power", e.target.checked)}
                    className="w-5 h-5 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500"
                  />
                </td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={input.di_needed}
                    onChange={(e) => handleUpdateInput(input.id, "di_needed", e.target.checked)}
                    className="w-5 h-5 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={input.notes}
                    onChange={(e) => handleUpdateInput(input.id, "notes", e.target.value)}
                    className={inputClass}
                    placeholder="Additional notes"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDuplicateInput(input.id)}
                      className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteInput(input.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {inputList.map((input, index) => (
          <div
            key={input.id}
            className="bg-gray-700 p-4 rounded-lg border border-gray-600 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-white font-medium">Input #{index + 1}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDuplicateInput(input.id)}
                  className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                  title="Duplicate"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={() => handleDeleteInput(input.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-xs mb-1">Channel #</label>
                <input
                  type="text"
                  value={input.channel_number}
                  onChange={(e) => handleUpdateInput(input.id, "channel_number", e.target.value)}
                  className={inputClass}
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-xs mb-1">Type</label>
                <select
                  value={input.type}
                  onChange={(e) => handleUpdateInput(input.id, "type", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  <option value="Vocal">Vocal</option>
                  <option value="Instrument">Instrument</option>
                  <option value="DI">DI</option>
                  <option value="Line">Line</option>
                  <option value="Playback">Playback</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-xs mb-1">Name</label>
              <input
                type="text"
                value={input.name}
                onChange={(e) => handleUpdateInput(input.id, "name", e.target.value)}
                className={inputClass}
                placeholder="Kick Drum"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-xs mb-1">Mic Type</label>
              <input
                type="text"
                value={input.mic_type || ""}
                onChange={(e) => handleUpdateInput(input.id, "mic_type", e.target.value)}
                className={inputClass}
                placeholder="SM57"
              />
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 text-gray-300 text-sm">
                <input
                  type="checkbox"
                  checked={input.phantom_power}
                  onChange={(e) => handleUpdateInput(input.id, "phantom_power", e.target.checked)}
                  className="w-5 h-5 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500"
                />
                <span>+48V Phantom Power</span>
              </label>
              <label className="flex items-center space-x-2 text-gray-300 text-sm">
                <input
                  type="checkbox"
                  checked={input.di_needed}
                  onChange={(e) => handleUpdateInput(input.id, "di_needed", e.target.checked)}
                  className="w-5 h-5 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500"
                />
                <span>DI Needed</span>
              </label>
            </div>

            <div>
              <label className="block text-gray-300 text-xs mb-1">Notes</label>
              <input
                type="text"
                value={input.notes}
                onChange={(e) => handleUpdateInput(input.id, "notes", e.target.value)}
                className={inputClass}
                placeholder="Additional notes"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddInput}
        className="w-full md:w-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
      >
        <PlusCircle className="h-5 w-5 mr-2" />
        Add Input Channel
      </button>
    </div>
  );
};

export default RiderInputList;
