import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, GripVertical, ChevronDown, ChevronUp, CalendarDays, Copy } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export interface ScheduleItem {
  id: string;
  date?: string; // YYYY-MM-DD
  start_time: string; // HH:MM - Changed from startTime
  end_time: string;   // HH:MM - Changed from endTime
  activity: string;
  notes: string;
  assigned_crew_ids: string[]; // Changed from assignedCrewIds
  isNewlyAdded?: boolean;
}

interface CrewKeyItem {
  id: string;
  name: string;
  color: string;
}

interface ProductionScheduleTableProps {
  scheduleItems: ScheduleItem[];
  crewKey: CrewKeyItem[];
  onUpdateScheduleItems: (items: ScheduleItem[]) => void;
}

const ScheduleItemRow: React.FC<{
  item: ScheduleItem;
  onUpdateItem: (updatedItem: ScheduleItem) => void;
  onDeleteItem: () => void;
  onDuplicateItem: () => void;
  crewKey: CrewKeyItem[];
  index: number;
}> = ({ item, onUpdateItem, onDeleteItem, onDuplicateItem, crewKey, index }) => {
  const [showCrewDropdown, setShowCrewDropdown] = useState(false);
  const inputClass = "bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm w-full";
  const textareaClass = `${inputClass} min-h-[40px] resize-none`;

  const handleInputChange = (field: keyof ScheduleItem, value: string) => {
    onUpdateItem({ ...item, [field]: value, isNewlyAdded: false });
  };

  const handleCrewSelection = (crewId: string) => {
    const updatedCrewIds = item.assigned_crew_ids.includes(crewId)
      ? item.assigned_crew_ids.filter(id => id !== crewId)
      : [...item.assigned_crew_ids, crewId];
    onUpdateItem({ ...item, assigned_crew_ids: updatedCrewIds, isNewlyAdded: false });
  };
  
  const getCrewColor = (crewId: string) => {
    const crewMember = crewKey.find(c => c.id === crewId);
    return crewMember ? crewMember.color : '#6B7280'; // Default gray
  };

  return (
    <div className="grid grid-cols-[auto_1.5fr_1fr_1fr_2.5fr_2.5fr_2fr_auto] gap-2 items-center py-2 px-1 border-b border-gray-700 hover:bg-gray-750/30 transition-colors">
      <div className="text-gray-400 text-sm flex items-center cursor-grab pl-1" title="Drag to reorder (not implemented)">
        <GripVertical className="h-5 w-5 mr-1" />
        {index + 1}
      </div>
      <input
        type="date"
        name="date"
        value={item.date || ''}
        onChange={(e) => handleInputChange("date", e.target.value)}
        className={inputClass}
      />
      <input
        type="time"
        name="start_time"
        value={item.start_time || ''}
        onChange={(e) => handleInputChange("start_time", e.target.value)}
        className={inputClass}
      />
      <input
        type="time"
        name="end_time"
        value={item.end_time || ''}
        onChange={(e) => handleInputChange("end_time", e.target.value)}
        className={inputClass}
      />
      <input
        type="text"
        name="activity"
        value={item.activity || ''}
        onChange={(e) => handleInputChange("activity", e.target.value)}
        className={inputClass}
        placeholder="Activity / Event"
      />
      <textarea
        name="notes"
        value={item.notes || ''}
        onChange={(e) => handleInputChange("notes", e.target.value)}
        className={textareaClass}
        placeholder="Notes"
        rows={1}
      />
      <div className="relative">
        <button
          onClick={() => setShowCrewDropdown(!showCrewDropdown)}
          className={`${inputClass} flex justify-between items-center text-left`}
        >
          <span className="truncate">
            {item.assigned_crew_ids.length > 0
              ? item.assigned_crew_ids.map(id => crewKey.find(c => c.id === id)?.name || 'Unknown').join(', ')
              : 'Assign Crew'}
          </span>
          {showCrewDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showCrewDropdown && (
          <div className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {crewKey.length > 0 ? crewKey.map(crew => (
              <label
                key={crew.id}
                className="flex items-center px-3 py-2 hover:bg-gray-600 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  className="mr-2 h-4 w-4 rounded text-indigo-500 focus:ring-indigo-400 bg-gray-500 border-gray-400"
                  style={{ accentColor: crew.color }}
                  checked={item.assigned_crew_ids.includes(crew.id)}
                  onChange={() => handleCrewSelection(crew.id)}
                />
                <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: crew.color }}></span>
                {crew.name}
              </label>
            )) : <div className="px-3 py-2 text-gray-400 text-sm">No crew defined in Crew Key.</div>}
          </div>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {item.assigned_crew_ids.map(id => {
            const crewMember = crewKey.find(c => c.id === id);
            return crewMember ? (
              <span
                key={id}
                className="px-1.5 py-0.5 rounded-full text-xs font-medium border"
                style={{ backgroundColor: `${getCrewColor(id)}33`, borderColor: getCrewColor(id), color: getCrewColor(id) }}
              >
                {crewMember.name}
              </span>
            ) : null;
          })}
        </div>
      </div>
      <div className="flex items-center justify-end pr-1 space-x-1">
        <button
          onClick={onDuplicateItem}
          className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
          title="Duplicate Item"
        >
          <Copy size={18} />
        </button>
        <button
          onClick={onDeleteItem}
          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          title="Delete Item"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};


const ProductionScheduleTable: React.FC<ProductionScheduleTableProps> = ({
  scheduleItems,
  crewKey,
  onUpdateScheduleItems,
}) => {
  const [items, setItems] = useState<ScheduleItem[]>(scheduleItems);

  useEffect(() => {
    setItems(scheduleItems);
  }, [scheduleItems]);

  const sortItems = useCallback((itemsToSort: ScheduleItem[]): ScheduleItem[] => {
    return [...itemsToSort].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      const timeA = a.start_time || '';
      const timeB = b.start_time || '';
      if (timeA < timeB) return -1;
      if (timeA > timeB) return 1;
      return 0;
    });
  }, []);

  const getGroupedAndSortedItems = useCallback(() => {
    const itemsWithDate = items.filter(item => item.date && !item.isNewlyAdded);
    const newlyAddedOrNoDateItems = items.filter(item => !item.date || item.isNewlyAdded);
    
    const sortedItemsWithDate = sortItems(itemsWithDate);

    const groups: Record<string, ScheduleItem[]> = {};
    sortedItemsWithDate.forEach(item => {
      const dateStr = item.date!; // Already filtered for items with date
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(item);
    });
    
    const groupedEntries = Object.entries(groups).sort(([dateA], [dateB]) => 
        new Date(dateA).getTime() - new Date(dateB).getTime()
    );

    if (newlyAddedOrNoDateItems.length > 0) {
        groupedEntries.push(['Newly Added / No Date', newlyAddedOrNoDateItems]);
    }
    return groupedEntries;

  }, [items, sortItems]);


  const groupedItems = getGroupedAndSortedItems();

  const createNewScheduleItem = (date?: string): ScheduleItem => ({
    id: uuidv4(),
    date: date || new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    activity: '',
    notes: '',
    assigned_crew_ids: [],
    isNewlyAdded: true,
  });

  const handleAddItem = (dateKey?: string) => {
    let newItemDate: string | undefined = dateKey;
    if (dateKey === 'Newly Added / No Date' || !dateKey) {
        newItemDate = new Date().toISOString().split('T')[0];
    }
    const newItem = createNewScheduleItem(newItemDate);
    onUpdateScheduleItems([...items, newItem]);
  };

  const handleDuplicateItem = (itemToDuplicate: ScheduleItem) => {
    const newItem: ScheduleItem = {
      ...itemToDuplicate,
      id: uuidv4(),
      isNewlyAdded: true, // Treat as newly added for placement
    };
    const originalIndex = items.findIndex(item => item.id === itemToDuplicate.id);
    const updatedItems = [...items];
    if (originalIndex !== -1) {
      updatedItems.splice(originalIndex + 1, 0, newItem);
    } else {
      updatedItems.push(newItem);
    }
    onUpdateScheduleItems(updatedItems);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateScheduleItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (updatedItem: ScheduleItem) => {
    onUpdateScheduleItems(
      items.map(item => (item.id === updatedItem.id ? { ...updatedItem, isNewlyAdded: false } : item))
    );
  };
  
  const formatDateHeader = (dateKey: string) => {
    if (dateKey === 'Newly Added / No Date') return dateKey;
    try {
      const [year, month, day] = dateKey.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      return dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' 
      });
    } catch (e) {
      return dateKey;
    }
  };

  return (
    <div className="space-y-8">
      {groupedItems.map(([dateKey, itemsInGroup]) => (
        <div key={dateKey} className="bg-gray-700/40 rounded-lg shadow-md">
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-t-lg border-b border-gray-600">
            <h3 className="text-lg font-semibold text-indigo-300 flex items-center">
              <CalendarDays size={20} className="mr-2 text-indigo-400" />
              {formatDateHeader(dateKey)}
            </h3>
          </div>
          
          <div className="px-2 pt-2">
            <div className="grid grid-cols-[auto_1.5fr_1fr_1fr_2.5fr_2.5fr_2fr_auto] gap-2 p-2 border-b border-gray-600 font-medium text-gray-400 text-xs sticky top-0 bg-gray-700 z-10">
              <div className="pl-1">#</div>
              <div>Date</div>
              <div>Start</div>
              <div>End</div>
              <div>Activity</div>
              <div>Notes</div>
              <div>Crew</div>
              <div className="text-right pr-1">Actions</div>
            </div>

            {itemsInGroup.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items for this day.</p>
            ) : (
              itemsInGroup.map((item, index) => (
                <ScheduleItemRow
                  key={item.id}
                  item={item}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={() => handleDeleteItem(item.id)}
                  onDuplicateItem={() => handleDuplicateItem(item)}
                  crewKey={crewKey}
                  index={index}
                />
              ))
            )}
          </div>
          <div className="p-4 text-center border-t border-gray-600/50">
            <button
              onClick={() => handleAddItem(dateKey)}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Add Item {dateKey !== 'Newly Added / No Date' ? `to ${formatDateHeader(dateKey).split(',')[0]}` : ''}
            </button>
          </div>
        </div>
      ))}
      
      {items.length === 0 && (
         <p className="text-gray-400 text-center py-10 text-lg">
           No schedule items yet. <br/>
           Click "Add New Item" to get started.
         </p>
      )}

      <div className="mt-10 pt-6 border-t border-gray-700 text-center">
        <button
          onClick={() => handleAddItem()}
          className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-base"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Item to Schedule
        </button>
      </div>
    </div>
  );
};

export default ProductionScheduleTable;
