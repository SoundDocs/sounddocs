import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Trash2, CalendarDays, Copy, ChevronDown, Edit3, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { CrewKeyItem } from './ProductionScheduleCrewKey';

export interface DetailedScheduleItem {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  activity: string;
  notes: string;
  assigned_crew_ids: string[];
}

interface ProductionScheduleDetailProps {
  detailedItems: DetailedScheduleItem[];
  onUpdateDetailedItems: (items: DetailedScheduleItem[]) => void;
  crewKey: CrewKeyItem[];
}

const DetailedScheduleItemRow: React.FC<{
  item: DetailedScheduleItem;
  onUpdateItem: (updatedItem: DetailedScheduleItem) => void;
  onDeleteItem: () => void;
  onDuplicateItem: () => void;
  onMoveItemUp: () => void;
  onMoveItemDown: () => void;
  isFirstItem: boolean;
  isLastItem: boolean;
  index: number;
  crewKey: CrewKeyItem[];
}> = ({
  item,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onMoveItemUp,
  onMoveItemDown,
  isFirstItem,
  isLastItem,
  index,
  crewKey,
}) => {
  const inputClass = "bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm w-full";
  const textareaClass = `${inputClass} min-h-[40px] resize-none`;
  
  const [isCrewSelectorOpen, setIsCrewSelectorOpen] = useState(false);
  const crewSelectorRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof Omit<DetailedScheduleItem, 'assigned_crew_ids'>, value: string) => {
    onUpdateItem({ ...item, [field]: value });
  };
  
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateItem({ ...item, notes: e.target.value });
  };

  const handleCrewSelectionChange = (crewId: string, checked: boolean) => {
    const currentIds = item.assigned_crew_ids || [];
    let newIds: string[];
    if (checked) {
      newIds = [...currentIds, crewId];
    } else {
      newIds = currentIds.filter(id => id !== crewId);
    }
    onUpdateItem({ ...item, assigned_crew_ids: newIds });
  };

  const getSelectedCrewNames = () => {
    if (!item.assigned_crew_ids || item.assigned_crew_ids.length === 0) {
      return "Assign Crew";
    }
    return item.assigned_crew_ids
      .map(id => crewKey.find(c => c.id === id)?.name || 'Unknown')
      .join(', ');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (crewSelectorRef.current && !crewSelectorRef.current.contains(event.target as Node)) {
        setIsCrewSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <div className="grid grid-cols-[auto_1fr_1fr_3fr_2fr_1.5fr_auto] gap-2 items-start py-2 px-1 border-b border-gray-700 hover:bg-gray-750/30 transition-colors">
      <div className="text-gray-400 text-sm flex flex-col items-center justify-center pt-1 space-y-0.5">
        <button
          onClick={onMoveItemUp}
          disabled={isFirstItem}
          className="p-0.5 text-gray-400 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Move Up"
        >
          <ArrowUp size={16} />
        </button>
        <span className="font-mono text-xs select-none">{index + 1}</span>
        <button
          onClick={onMoveItemDown}
          disabled={isLastItem}
          className="p-0.5 text-gray-400 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Move Down"
        >
          <ArrowDown size={16} />
        </button>
      </div>
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
        placeholder="Activity Description"
      />
      <textarea
        name="notes"
        value={item.notes || ''}
        onChange={handleTextAreaChange}
        className={textareaClass}
        placeholder="Notes"
        rows={1}
      />
      <div className="relative" ref={crewSelectorRef}>
        <button
          onClick={() => setIsCrewSelectorOpen(!isCrewSelectorOpen)}
          className={`${inputClass} flex items-center justify-between text-left w-full`}
        >
          <span className="truncate pr-1">{getSelectedCrewNames()}</span>
          <ChevronDown size={16} className={`transition-transform ${isCrewSelectorOpen ? 'rotate-180' : ''}`} />
        </button>
        {isCrewSelectorOpen && (
          <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-gray-800 border border-gray-600 rounded-md shadow-lg p-2 space-y-1">
            {crewKey.length > 0 ? crewKey.map(crew => (
              <label key={crew.id} className="flex items-center space-x-2 text-white p-1.5 rounded hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-indigo-500 bg-gray-600 border-gray-500 rounded focus:ring-indigo-400"
                  checked={(item.assigned_crew_ids || []).includes(crew.id)}
                  onChange={(e) => handleCrewSelectionChange(crew.id, e.target.checked)}
                />
                <span style={{ color: crew.color }} className="font-medium text-sm">{crew.name}</span>
              </label>
            )) : <p className="text-gray-400 text-sm p-1.5">No crew defined in Crew Key.</p>}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end pr-1 space-x-1 pt-1.5">
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

const ProductionScheduleDetail: React.FC<ProductionScheduleDetailProps> = ({ detailedItems, onUpdateDetailedItems, crewKey }) => {
  const [editingDateKey, setEditingDateKey] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>('');

  const getGroupedAndSortedItems = () => {
    const groups: Record<string, DetailedScheduleItem[]> = {};
    detailedItems.forEach(item => {
      const dateStr = item.date || 'No Date Assigned';
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(item);
    });

    // Items within each group (groups[dateKey]) will maintain their order from the `detailedItems` array.
    // The explicit sort by start_time within each day group has been removed to allow manual reordering to persist.

    return Object.entries(groups).sort(([dateA], [dateB]) => {
      if (dateA === 'No Date Assigned') return 1;
      if (dateB === 'No Date Assigned') return -1;
      try {
        // Ensure dates are parsed correctly, especially if they are just YYYY-MM-DD
        const timeA = new Date(dateA + 'T00:00:00Z').getTime();
        const timeB = new Date(dateB + 'T00:00:00Z').getTime();
        return timeA - timeB;
      } catch (e) {
        console.error("Error parsing date for sorting groups:", e, dateA, dateB);
        return 0;
      }
    });
  };

  const groupedItems = getGroupedAndSortedItems();

  const createNewDetailedItem = (date: string): DetailedScheduleItem => ({
    id: uuidv4(),
    date: date,
    start_time: '',
    end_time: '',
    activity: '',
    notes: '',
    assigned_crew_ids: [],
  });

  const handleAddItemToDay = (dateKey: string) => {
    const newItemDate = dateKey === 'No Date Assigned' 
      ? new Date().toISOString().split('T')[0] 
      : dateKey;
    const newItem = createNewDetailedItem(newItemDate);
    onUpdateDetailedItems([...detailedItems, newItem]);
  };

  const handleDuplicateItem = (itemToDuplicate: DetailedScheduleItem) => {
    const newItem: DetailedScheduleItem = {
      ...itemToDuplicate,
      id: uuidv4(),
    };
    const originalIndex = detailedItems.findIndex(item => item.id === itemToDuplicate.id);
    const updatedItems = [...detailedItems];
    if (originalIndex !== -1) {
      updatedItems.splice(originalIndex + 1, 0, newItem);
    } else {
      updatedItems.push(newItem);
    }
    onUpdateDetailedItems(updatedItems);
  };

  const handleDuplicateDayGroup = (dateKey: string) => {
    const itemsToDuplicate = detailedItems.filter(item => (item.date || 'No Date Assigned') === dateKey);
    if (itemsToDuplicate.length === 0) return;

    let nextDateStr = 'No Date Assigned';
    if (dateKey !== 'No Date Assigned') {
      try {
        const originalDate = new Date(dateKey + 'T00:00:00Z'); 
        originalDate.setUTCDate(originalDate.getUTCDate() + 1); 
        nextDateStr = originalDate.toISOString().split('T')[0];
      } catch (e) {
        console.error("Error calculating next date:", e);
        nextDateStr = dateKey; 
      }
    }

    const newItems = itemsToDuplicate.map(item => ({
      ...item,
      id: uuidv4(),
      date: nextDateStr,
    }));
    onUpdateDetailedItems([...detailedItems, ...newItems]);
  };

  const handleAddNewDayGroup = () => {
    let newDate = new Date();
    const validDates = detailedItems
      .map(item => item.date ? new Date(item.date + 'T00:00:00Z').getTime() : 0)
      .filter(timestamp => timestamp > 0);

    if (validDates.length > 0) {
      const latestTimestamp = Math.max(...validDates);
      newDate = new Date(latestTimestamp);
      newDate.setUTCDate(newDate.getUTCDate() + 1);
    }
    
    const initialItemForNewDay = createNewDetailedItem(newDate.toISOString().split('T')[0]);
    initialItemForNewDay.activity = 'New day started'; 
    onUpdateDetailedItems([...detailedItems, initialItemForNewDay]);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateDetailedItems(detailedItems.filter(item => item.id !== id));
  };

  const handleUpdateItem = (updatedItem: DetailedScheduleItem) => {
    onUpdateDetailedItems(
      detailedItems.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const handleMoveItem = (itemToMoveId: string, direction: 'up' | 'down') => {
    const allItemsCopy = [...detailedItems];
    const itemIndexInFullList = allItemsCopy.findIndex(item => item.id === itemToMoveId);

    if (itemIndexInFullList === -1) return;

    const itemToMove = allItemsCopy[itemIndexInFullList];
    const itemDateKey = itemToMove.date || 'No Date Assigned';

    if (direction === 'up') {
      if (itemIndexInFullList === 0) return; // Already at the very top
      const itemAbove = allItemsCopy[itemIndexInFullList - 1];
      // Check if itemAbove is in the same day group
      if ((itemAbove.date || 'No Date Assigned') !== itemDateKey) return; 
      
      [allItemsCopy[itemIndexInFullList], allItemsCopy[itemIndexInFullList - 1]] = [allItemsCopy[itemIndexInFullList - 1], allItemsCopy[itemIndexInFullList]];
    } else { // direction === 'down'
      if (itemIndexInFullList === allItemsCopy.length - 1) return; // Already at the very bottom
      const itemBelow = allItemsCopy[itemIndexInFullList + 1];
      // Check if itemBelow is in the same day group
      if ((itemBelow.date || 'No Date Assigned') !== itemDateKey) return;

      [allItemsCopy[itemIndexInFullList], allItemsCopy[itemIndexInFullList + 1]] = [allItemsCopy[itemIndexInFullList + 1], allItemsCopy[itemIndexInFullList]];
    }
    onUpdateDetailedItems(allItemsCopy);
  };
  
  const formatDateHeader = (dateKey: string) => {
    if (dateKey === 'No Date Assigned') return 'Items without an Assigned Date';
    try {
      const [year, month, day] = dateKey.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day)); 
      return dateObj.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'UTC' 
      });
    } catch (e) {
      return dateKey; 
    }
  };

  const handleStartEditDate = (dateKey: string) => {
    if (dateKey === 'No Date Assigned') return;
    setEditingDateKey(dateKey);
    setTempDate(dateKey);
  };

  const handleConfirmDateChange = () => {
    if (!editingDateKey || !tempDate || editingDateKey === tempDate) {
      setEditingDateKey(null);
      return;
    }
    const updatedItems = detailedItems.map(item => {
      const itemDate = item.date || 'No Date Assigned';
      if (itemDate === editingDateKey) {
        return { ...item, date: tempDate };
      }
      return item;
    });
    onUpdateDetailedItems(updatedItems);
    setEditingDateKey(null);
  };

  const handleCancelEditDate = () => {
    setEditingDateKey(null);
  };

  return (
    <div className="space-y-8">
      {groupedItems.map(([dateKey, itemsInGroup]) => (
        <div key={dateKey} className="bg-gray-700/40 rounded-lg shadow-md">
          <div className="flex justify-between items-center p-4 bg-gray-700 rounded-t-lg border-b border-gray-600">
            <div className="flex items-center gap-2">
              <CalendarDays size={20} className="text-indigo-400 flex-shrink-0" />
              {editingDateKey === dateKey ? (
                <>
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="text-lg font-semibold text-white bg-gray-600 border border-gray-500 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button onClick={handleConfirmDateChange} className="p-1 text-green-400 hover:text-green-300"><Check size={20} /></button>
                  <button onClick={handleCancelEditDate} className="p-1 text-red-400 hover:text-red-300"><X size={20} /></button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-indigo-300">{formatDateHeader(dateKey)}</h3>
                  {dateKey !== 'No Date Assigned' && (
                    <button onClick={() => handleStartEditDate(dateKey)} className="p-1 text-gray-400 hover:text-indigo-400">
                      <Edit3 size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => handleDuplicateDayGroup(dateKey)}
              className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
              title="Duplicate Day Group"
            >
              <Copy size={20} />
            </button>
          </div>
          
          <div className="px-2 pt-2">
            <div className="grid grid-cols-[auto_1fr_1fr_3fr_2fr_1.5fr_auto] gap-2 p-2 border-b border-gray-600 font-medium text-gray-400 text-xs sticky top-0 bg-gray-700 z-10">
              <div className="pl-1 text-center">Order</div>
              <div>Start Time</div>
              <div>End Time</div>
              <div>Activity</div>
              <div>Notes</div>
              <div>Crew</div>
              <div className="text-right pr-1">Actions</div>
            </div>

            {itemsInGroup.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items for this day.</p>
            ) : (
              itemsInGroup.map((item, indexInGroup) => (
                <DetailedScheduleItemRow
                  key={item.id}
                  item={item}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={() => handleDeleteItem(item.id)}
                  onDuplicateItem={() => handleDuplicateItem(item)}
                  onMoveItemUp={() => handleMoveItem(item.id, 'up')}
                  onMoveItemDown={() => handleMoveItem(item.id, 'down')}
                  isFirstItem={indexInGroup === 0}
                  isLastItem={indexInGroup === itemsInGroup.length - 1}
                  index={indexInGroup}
                  crewKey={crewKey}
                />
              ))
            )}
          </div>
          <div className="p-4 text-center border-t border-gray-600/50">
            <button
              onClick={() => handleAddItemToDay(dateKey)}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Add Item {dateKey !== 'No Date Assigned' ? `to Day` : ''}
            </button>
          </div>
        </div>
      ))}

      {detailedItems.length === 0 && groupedItems.length === 0 && (
         <p className="text-gray-400 text-center py-10 text-lg">
           No schedule items yet. <br/>
           Click "Add New Day Group" to get started.
         </p>
      )}

      <div className="mt-10 pt-6 border-t border-gray-700 text-center">
        <button
          onClick={handleAddNewDayGroup}
          className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-base"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Day Group
        </button>
      </div>
    </div>
  );
};

export default ProductionScheduleDetail;
