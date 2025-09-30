import React from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { BacklineItem } from "../../lib/types";

interface RiderEquipmentProps {
  paRequirements: string;
  monitorRequirements: string;
  consoleRequirements: string;
  backlineRequirements: BacklineItem[];
  artistProvidedGear: BacklineItem[];
  onUpdatePaRequirements: (value: string) => void;
  onUpdateMonitorRequirements: (value: string) => void;
  onUpdateConsoleRequirements: (value: string) => void;
  onUpdateBacklineRequirements: (items: BacklineItem[]) => void;
  onUpdateArtistProvidedGear: (items: BacklineItem[]) => void;
}

const RiderEquipment: React.FC<RiderEquipmentProps> = ({
  paRequirements,
  monitorRequirements,
  consoleRequirements,
  backlineRequirements,
  artistProvidedGear,
  onUpdatePaRequirements,
  onUpdateMonitorRequirements,
  onUpdateConsoleRequirements,
  onUpdateBacklineRequirements,
  onUpdateArtistProvidedGear,
}) => {
  const handleAddBacklineItem = () => {
    const newItem: BacklineItem = {
      id: uuidv4(),
      item: "",
      quantity: "",
      notes: "",
    };
    onUpdateBacklineRequirements([...backlineRequirements, newItem]);
  };

  const handleDeleteBacklineItem = (id: string) => {
    onUpdateBacklineRequirements(backlineRequirements.filter((item) => item.id !== id));
  };

  const handleUpdateBacklineItem = (id: string, field: keyof BacklineItem, value: string) => {
    onUpdateBacklineRequirements(
      backlineRequirements.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleAddArtistGear = () => {
    const newItem: BacklineItem = {
      id: uuidv4(),
      item: "",
      quantity: "",
      notes: "",
    };
    onUpdateArtistProvidedGear([...artistProvidedGear, newItem]);
  };

  const handleDeleteArtistGear = (id: string) => {
    onUpdateArtistProvidedGear(artistProvidedGear.filter((item) => item.id !== id));
  };

  const handleUpdateArtistGear = (id: string, field: keyof BacklineItem, value: string) => {
    onUpdateArtistProvidedGear(
      artistProvidedGear.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Sound System Requirements Section */}
      <div className="border-b border-gray-700 pb-2 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-white">Sound System Requirements</h2>
        <p className="text-gray-400 text-xs md:text-sm">PA, monitors, and console specifications</p>
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="pa_requirements">
          PA System
        </label>
        <textarea
          id="pa_requirements"
          name="pa_requirements"
          rows={3}
          value={paRequirements}
          onChange={(e) => onUpdatePaRequirements(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., L-Acoustics K2 or equivalent, minimum 10kW per side, full range coverage"
        />
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="monitor_requirements">
          Monitor System
        </label>
        <textarea
          id="monitor_requirements"
          name="monitor_requirements"
          rows={3}
          value={monitorRequirements}
          onChange={(e) => onUpdateMonitorRequirements(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., 6x wedge monitors (d&b M4 or equivalent), 4x IEM systems (Sennheiser G4)"
        />
      </div>

      <div>
        <label className="block text-gray-300 text-sm mb-2" htmlFor="console_requirements">
          Console Requirements
        </label>
        <textarea
          id="console_requirements"
          name="console_requirements"
          rows={3}
          value={consoleRequirements}
          onChange={(e) => onUpdateConsoleRequirements(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="e.g., FOH: DiGiCo SD12 or Avid S6L with 48+ channels, Monitors: Separate console preferred"
        />
      </div>

      {/* Venue Provided Backline Section */}
      <div className="border-t border-b border-gray-700 py-2 my-6 md:my-8">
        <h2 className="text-lg md:text-xl font-semibold text-white">
          Venue Provided Backline (Required)
        </h2>
        <p className="text-gray-400 text-xs md:text-sm">
          Equipment the artist needs the venue to provide
        </p>
      </div>

      <div className="space-y-4">
        {backlineRequirements.map((item, index) => (
          <div
            key={item.id}
            className="bg-gray-700 p-4 rounded-lg border border-gray-600 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-white font-medium">Item #{index + 1}</h3>
              <button
                onClick={() => handleDeleteBacklineItem(item.id)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Remove Item"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm mb-2" htmlFor={`item_${item.id}`}>
                  Item
                </label>
                <input
                  id={`item_${item.id}`}
                  type="text"
                  value={item.item}
                  onChange={(e) => handleUpdateBacklineItem(item.id, "item", e.target.value)}
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Drum Kit, Guitar Amp"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2" htmlFor={`quantity_${item.id}`}>
                  Quantity
                </label>
                <input
                  id={`quantity_${item.id}`}
                  type="text"
                  value={item.quantity}
                  onChange={(e) => handleUpdateBacklineItem(item.id, "quantity", e.target.value)}
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., 1, 2x"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2" htmlFor={`notes_${item.id}`}>
                Specifications/Notes
              </label>
              <input
                id={`notes_${item.id}`}
                type="text"
                value={item.notes}
                onChange={(e) => handleUpdateBacklineItem(item.id, "notes", e.target.value)}
                className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Must be 5-piece kit with double bass pedal"
              />
            </div>
          </div>
        ))}

        <button
          onClick={handleAddBacklineItem}
          className="w-full md:w-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add Backline Item
        </button>
      </div>

      {/* Artist Provided Gear Section */}
      <div className="border-t border-b border-gray-700 py-2 my-6 md:my-8">
        <h2 className="text-lg md:text-xl font-semibold text-white">Artist Provided Equipment</h2>
        <p className="text-gray-400 text-xs md:text-sm">
          Equipment the artist will bring to the venue
        </p>
      </div>

      <div className="space-y-4">
        {artistProvidedGear.map((item, index) => (
          <div
            key={item.id}
            className="bg-gray-700 p-4 rounded-lg border border-gray-600 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-white font-medium">Item #{index + 1}</h3>
              <button
                onClick={() => handleDeleteArtistGear(item.id)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Remove Item"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-gray-300 text-sm mb-2"
                  htmlFor={`artist_item_${item.id}`}
                >
                  Item
                </label>
                <input
                  id={`artist_item_${item.id}`}
                  type="text"
                  value={item.item}
                  onChange={(e) => handleUpdateArtistGear(item.id, "item", e.target.value)}
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Custom Pedal Board, Keyboards"
                />
              </div>

              <div>
                <label
                  className="block text-gray-300 text-sm mb-2"
                  htmlFor={`artist_quantity_${item.id}`}
                >
                  Quantity
                </label>
                <input
                  id={`artist_quantity_${item.id}`}
                  type="text"
                  value={item.quantity}
                  onChange={(e) => handleUpdateArtistGear(item.id, "quantity", e.target.value)}
                  className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., 1, 2x"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-gray-300 text-sm mb-2"
                htmlFor={`artist_notes_${item.id}`}
              >
                Specifications/Notes
              </label>
              <input
                id={`artist_notes_${item.id}`}
                type="text"
                value={item.notes}
                onChange={(e) => handleUpdateArtistGear(item.id, "notes", e.target.value)}
                className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Requires 2x AC outlets on stage"
              />
            </div>
          </div>
        ))}

        <button
          onClick={handleAddArtistGear}
          className="w-full md:w-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add Artist Equipment
        </button>
      </div>
    </div>
  );
};

export default RiderEquipment;
