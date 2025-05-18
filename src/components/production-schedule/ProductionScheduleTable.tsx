import React, { useState } from "react";
import { PlusCircle, Trash2, ChevronDown, ChevronUp, GripVertical, CalendarDays } from "lucide-react";
import { CrewKeyItem } from "./ProductionScheduleCrewKey"; 
import { v4 as uuidv4 } from 'uuid';

export interface ScheduleItem {
  id: string;
  date?: string; 
  startTime: string;
  endTime: string;
  activity: string;
  notes: string;
  assignedCrewIds: string[]; 
  isNewlyAdded?: boolean; 
}

interface ProductionScheduleTableProps {
  scheduleItems: ScheduleItem[];
  crewKey: CrewKeyItem[];
  onUpdateScheduleItems: (items: ScheduleItem[]) => void;
}

interface ScheduleItemGroup {
  key: string; 
  displayHeader: string;
  items: ScheduleItem[];
  isNewlyAddedItemGroup: boolean; // True if this group is specifically for new items without a date
  dateForNewItemInGroup?: string; // The date to use for "Add item to this group"
  sortOrder: number; // For sorting groups: 1 for dated, 2 for no-date, 3 for new-no-date
}

const ProductionScheduleItemRow: React.FC<{
  item: ScheduleItem;
  crewKey: CrewKeyItem[];
  onUpdateItem: (itemId: string, updatedItem: ScheduleItem) => void;
  onDeleteItem: (itemId: string) => void;
  indexInGroup: number; // 1-based index within its visual group
}> = ({ item, crewKey, onUpdateItem, onDeleteItem, indexInGroup }) => {
  const [showCrewSelector, setShowCrewSelector] = useState(false);

  const handleInputChange = (field: keyof ScheduleItem, value: any) => {
    if (field === 'isNewlyAdded') return; // Prevent direct modification of isNewlyAdded via input
    onUpdateItem(item.id, { ...item, [field]: value });
  };

  const handleCrewSelectionChange = (crewId: string) => {
    const newAssignedCrewIds = item.assignedCrewIds.includes(crewId)
      ? item.assignedCrewIds.filter(id => id !== crewId)
      : [...item.assignedCrewIds, crewId];
    onUpdateItem(item.id, { ...item, assignedCrewIds: newAssignedCrewIds });
  };

  const getCrewNameAndColor = (crewId: string) => {
    return crewKey.find(ck => ck.id === crewId);
  };

  return (
    <div className={`grid grid-cols-[auto_1.5fr_1fr_1fr_2fr_2fr_3fr_auto] gap-2 items-center p-2 border-b border-gray-700/60 last:border-b-0 hover:bg-gray-750/70 transition-colors ${item.isNewlyAdded ? 'bg-indigo-900/20' : ''}`}>
      <div className="text-gray-400 text-sm flex items-center cursor-grab pl-1" title="Drag to reorder (not implemented)">
        <GripVertical className="h-5 w-5 mr-1" />
         {indexInGroup}
      </div>
      <input
        type="date"
        value={item.date || ""}
        onChange={(e) => handleInputChange("date", e.target.value)}
        className="bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
      />
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
          <div className="absolute z-20 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
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
        onClick={() => onDeleteItem(item.id)}
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
  const handleAddItemToGroup = (dateForNewItemInGroup?: string) => {
    const newItem: ScheduleItem = {
      id: uuidv4(),
      date: dateForNewItemInGroup || "", 
      startTime: "",
      endTime: "",
      activity: "",
      notes: "",
      assignedCrewIds: [],
      isNewlyAdded: true, 
    };
    onUpdateScheduleItems([...scheduleItems, newItem]);
  };

  const handleUpdateItem = (itemId: string, updatedItemFromRow: ScheduleItem) => {
    const newItems = scheduleItems.map(item => 
      item.id === itemId ? { ...updatedItemFromRow, isNewlyAdded: false } : item
    );
    onUpdateScheduleItems(newItems);
  };

  const handleDeleteItem = (itemId: string) => {
    const newItems = scheduleItems.filter(item => item.id !== itemId);
    onUpdateScheduleItems(newItems);
  };
  
  const formatDateHeader = (dateString?: string) => {
    if (!dateString) return "Invalid Date";
    try {
      // Add T00:00:00 to ensure consistent parsing as local date, not UTC
      const date = new Date(dateString + 'T00:00:00'); 
      // Format: Month Day, Year (e.g., April 30, 2025)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      // Fallback for invalid date strings, though input type="date" should prevent most.
      return dateString; 
    }
  };

  const getGroupedScheduleData = (): ScheduleItemGroup[] => {
    const itemGroups: Record<string, ScheduleItemGroup> = {};
  
    // Sort items: isNewlyAdded items tend towards the bottom of their respective groups or overall.
    // Then by date, then by start time.
    const sortedItems = [...scheduleItems].sort((a, b) => {
      const aDate = a.date || 'zzzz'; // Treat no date as very late for sorting
      const bDate = b.date || 'zzzz';
      if (aDate < bDate) return -1;
      if (aDate > bDate) return 1;
  
      // If dates are same (or both are null), sort by start time
      const timeA = a.startTime || '99:99'; // Treat no time as very late
      const timeB = b.startTime || '99:99';
      if (timeA < timeB) return -1;
      if (timeA > timeB) return 1;

      // If dates and times are the same, newly added items go last
      const aIsNew = a.isNewlyAdded === true;
      const bIsNew = b.isNewlyAdded === true;
      if (aIsNew && !bIsNew) return 1;
      if (!aIsNew && bIsNew) return -1;
      
      return 0; 
    });
  
    sortedItems.forEach(item => {
      let groupKey: string;
      let displayHeader: string;
      let dateForNewItemInThisGroup: string | undefined = item.date;
      let isThisANewlyAddedItemGroup = false; 
      let sortOrderVal: number;
  
      if (item.date) { // Item has a date, group it by date
        groupKey = item.date; 
        displayHeader = formatDateHeader(item.date);
        dateForNewItemInThisGroup = item.date; // Button in this group adds to this date
        sortOrderVal = 1; // Dated groups first
      } else if (item.isNewlyAdded) { // No date AND is newly added
        groupKey = "NEWLY_ADDED_ITEMS_NO_DATE_GROUP";
        displayHeader = "Newly Added Items (No Date)";
        isThisANewlyAddedItemGroup = true; // This group is specifically for new, dateless items
        dateForNewItemInThisGroup = undefined; // Button adds another new, dateless item
        sortOrderVal = 3; // This group comes last
      } else { // No date, and NOT newly added (existing item without a date)
        groupKey = "NO_DATE_ASSIGNED_GROUP";
        displayHeader = "Items without an Assigned Date";
        dateForNewItemInThisGroup = undefined; // Button adds to this "no date" group
        sortOrderVal = 2; // After dated, before new-no-date
      }
  
      if (!itemGroups[groupKey]) {
        itemGroups[groupKey] = {
          key: groupKey,
          displayHeader,
          items: [],
          isNewlyAddedItemGroup: isThisANewlyAddedItemGroup,
          dateForNewItemInGroup: dateForNewItemInThisGroup,
          sortOrder: sortOrderVal,
        };
      }
      itemGroups[groupKey].items.push(item);
    });
  
    // Sort the groups themselves
    return Object.values(itemGroups).sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      // If sortOrder is the same (e.g., both are dated groups), sort by the group key (date string)
      if (a.sortOrder === 1 && b.sortOrder === 1) { 
        return a.key.localeCompare(b.key); 
      }
      return 0; // Should not happen if sortOrders are unique for non-dated groups
    });
  };

  const groupedData = getGroupedScheduleData();

  const getButtonTextForGroup = (_group: ScheduleItemGroup) => {
    // Per user request, the blue button within groups should always say "Add Item to Day".
    return "Add Item to Day";
  };

  return (
    <div className="space-y-6"> {/* Increased spacing between groups */}
      {/* Sticky Global Table Header */}
      <div className="grid grid-cols-[auto_1.5fr_1fr_1fr_2fr_2fr_3fr_auto] gap-2 p-2 border-b border-gray-600 font-medium text-gray-300 text-sm sticky top-0 bg-gray-800 z-10">
         <div className="pl-1" title="Row Number">#</div>
         <div>Date</div>
        <div>Start Time</div>
        <div>End Time</div>
        <div>Activity</div>
        <div>Notes</div>
        <div>Crew</div>
        <div className="text-right pr-1">Action</div>
      </div>

      {scheduleItems.length === 0 && groupedData.length === 0 && (
        <div className="text-center py-10">
            <p className="text-gray-400 text-lg mb-4">
            No schedule items yet.
            </p>
        </div>
      )}

      {groupedData.map((group) => (
        <div key={group.key} className="bg-gray-700/40 rounded-lg shadow-md">
          <div className="flex justify-between items-center p-3 bg-gray-700 rounded-t-lg border-b border-gray-600"> {/* Slightly reduced padding */}
            <h3 className="text-lg font-semibold text-indigo-300 flex items-center">
              <CalendarDays size={20} className="mr-2.5 text-indigo-400" /> {/* Increased icon margin */}
              {group.displayHeader}
            </h3>
            {/* Optional: Add "Duplicate Day Group" like button here if needed later */}
          </div>
          
          <div className="px-0.5 pt-0.5 pb-0.5"> {/* Minimal padding around item list */}
            {group.items.length === 0 ? (
              <p className="text-gray-500 text-center py-4 px-2 text-sm">No items in this group.</p>
            ) : (
              group.items.map((item, itemIndex) => (
                <ProductionScheduleItemRow
                  key={item.id}
                  item={item}
                  crewKey={crewKey}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  indexInGroup={itemIndex + 1} 
                />
              ))
            )}
          </div>
          <div className="p-3 text-center border-t border-gray-600/50 rounded-b-lg"> {/* Slightly reduced padding */}
            <button
              onClick={() => handleAddItemToGroup(group.dateForNewItemInGroup)}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors" // Standardized button style
            >
              <PlusCircle className="h-5 w-5 mr-2" /> {/* Standardized icon size and margin */}
              {getButtonTextForGroup(group)}
            </button>
          </div>
        </div>
      ))}
      
      {/* Main "Add New Day Group" button at the bottom */}
      {/* This button adds an item to the "Newly Added Items (No Date)" group, effectively starting a new conceptual day group. */}
      <div className="mt-8 pt-6 border-t border-gray-700 text-center">
        <button
          onClick={() => handleAddItemToGroup()} // Adds a generic new item (will go to "Newly Added (No Date)" group)
          className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-base"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Day Group
        </button>
      </div>
    </div>
  );
};

export default ProductionScheduleTable;
