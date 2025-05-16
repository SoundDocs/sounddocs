import React, { useState } from "react";
import { PlusCircle, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { CrewKeyItem } from "./ProductionScheduleCrewKey"; // Assuming this is where CrewKeyItem is defined
import { v4 as uuidv4 } from 'uuid';

export interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
  notes: string;
  assignedCrewIds: string[]; // Array of CrewKeyItem IDs
}

interface ProductionScheduleTableProps {
  scheduleItems: ScheduleItem[];
  crewKey: CrewKeyItem[];
  onUpdateScheduleItems: (items: ScheduleItem[]) => void;
}

const ProductionScheduleItemRow: React.FC<{
  item: ScheduleItem;
  crewKey: CrewKeyItem[];
  onUpdateItem: (updatedItem: ScheduleItem) => void;
  onDeleteItem: () => void;
  index: number;
}> = ({ item, crewKey, onUpdateItem, onDeleteItem, index }) => {
  const [showCrewSelector, setShowCrewSelector] = useState(false);

  const handleInputChange = (field: keyof ScheduleItem, value: any) => {
    onUpdateItem({ ...item, [field]: value });
  };

  const handleCrewSelectionChange = (crewId: string) => {
    const newAssignedCrewIds = item.assignedCrewIds.includes(crewId)
      ? item.assignedCrewIds.filter(id => id !== crewId)
      : [...item.assignedCrewIds, crewId];
    onUpdateItem({ ...item, assignedCrewIds: newAssignedCrewIds });
  };

  const getCrewNameAndColor = (crewId: string) => {
    return crewKey.find(ck => ck.id === crewId);
  };

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_2fr_2fr_3fr_auto] gap-2 items-center p-2 border-b border-gray-700 hover:bg-gray-750 transition-colors">
      <div className="text-gray-400 text-sm flex items-center cursor-grab" title="Drag to reorder (not implemented)">
        <GripVertical className="h-5 w-5 mr-1" />
         {index + 1}
      </div>
      <input
        type="time"
        value={item.startTime}
        onChange={(e) => handleInputChange("startTime", e.target.value)}
        className="bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
      />
      <input
        type="time"
        value={item.endTime}
        onChange={(e) => handleInputChange("endTime", e.target.value)}
        className="bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
      />
      <input
        type="text"
        value={item.activity}
        placeholder="Activity / Task"
        onChange={(e) => handleInputChange("activity", e.target.value)}
        className="bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
      />
      <input
        type="text"
        value={item.notes}
        placeholder="Notes"
        onChange={(e) => handleInputChange("notes", e.target.value)}
        className="bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
      />
      <div className="relative">
        <button
          onClick={() => setShowCrewSelector(!showCrewSelector)}
          className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-2 flex justify-between items-center text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <div className="flex flex-wrap gap-1">
            {item.assignedCrewIds.length > 0 ? (
              item.assignedCrewIds.map(id => {
                const crew = getCrewNameAndColor(id);
                return crew ? (
                  <span
                    key={id}
                    className="text-xs px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: crew.color }}
                  >
                    {crew.name.substring(0,3)}..
                  </span>
                ) : null;
              })
            ) : (
              <span className="text-gray-400">Select Crew</span>
            )}
          </div>
          {showCrewSelector ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showCrewSelector && (
          <div className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {crewKey.length > 0 ? crewKey.map(crew => (
              <label
                key={crew.id}
                className="flex items-center p-2 hover:bg-gray-600 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={item.assignedCrewIds.includes(crew.id)}
                  onChange={() => handleCrewSelectionChange(crew.id)}
                  className="h-4 w-4 text-indigo-600 border-gray-500 rounded focus:ring-indigo-500 mr-2"
                  style={{ accentColor: crew.color }}
                />
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: crew.color }}></span>
                <span className="text-white text-sm">{crew.name}</span>
              </label>
            )) : <div className="p-2 text-gray-400 text-sm">No crew defined in Key.</div>}
          </div>
        )}
      </div>
      <button
        onClick={onDeleteItem}
        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
        title="Delete Item"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
};

const ProductionScheduleTable: React.FC<ProductionScheduleTableProps> = ({
  scheduleItems,
  crewKey,
  onUpdateScheduleItems,
}) => {
  const handleAddItem = () => {
    const newItem: ScheduleItem = {
      id: uuidv4(),
      startTime: "",
      endTime: "",
      activity: "",
      notes: "",
      assignedCrewIds: [],
    };
    onUpdateScheduleItems([...scheduleItems, newItem]);
  };

  const handleUpdateItem = (index: number, updatedItem: ScheduleItem) => {
    const newItems = [...scheduleItems];
    newItems[index] = updatedItem;
    onUpdateScheduleItems(newItems);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = scheduleItems.filter((_, i) => i !== index);
    onUpdateScheduleItems(newItems);
  };

  // Drag and drop functionality would go here if implemented

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[auto_1fr_1fr_2fr_2fr_3fr_auto] gap-2 p-2 border-b border-gray-600 font-medium text-gray-300 text-sm sticky top-0 bg-gray-800 z-5">
         <div title="Row Number">#</div>
        <div>Start Time</div>
        <div>End Time</div>
        <div>Activity</div>
        <div>Notes</div>
        <div>Crew</div>
        <div>Action</div>
      </div>

      {scheduleItems.length === 0 && (
        <p className="text-gray-400 text-center py-6">No schedule items yet. Add one to get started.</p>
      )}

      {scheduleItems.map((item, index) => (
        <ProductionScheduleItemRow
          key={item.id} // Use item.id for React key for stable re-renders
          item={item}
          crewKey={crewKey}
          onUpdateItem={(updatedItem) => handleUpdateItem(index, updatedItem)}
          onDeleteItem={() => handleDeleteItem(index)}
          index={index}
        />
      ))}
      
      <div className="mt-6 text-center">
        <button
          onClick={handleAddItem}
          className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add Schedule Item
        </button>
      </div>
    </div>
  );
};

export default ProductionScheduleTable;
