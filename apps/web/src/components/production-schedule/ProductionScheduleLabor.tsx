import React from "react";
import { PlusCircle, Trash2, CalendarDays, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export interface LaborScheduleItem {
  id: string;
  name: string;
  position: string;
  date: string; // YYYY-MM-DD
  time_in: string; // HH:MM
  time_out: string; // HH:MM
  notes: string;
}

interface ProductionScheduleLaborProps {
  laborItems: LaborScheduleItem[];
  onUpdateLaborItems: (items: LaborScheduleItem[]) => void;
  crewKey: { id: string; name: string; color: string }[];
}

const LaborScheduleItemRow: React.FC<{
  item: LaborScheduleItem;
  onUpdateItem: (updatedItem: LaborScheduleItem) => void;
  onDeleteItem: () => void;
  onDuplicateItem: () => void;
  onMoveItemUp: () => void;
  onMoveItemDown: () => void;
  isFirstItem: boolean;
  isLastItem: boolean;
  index: number;
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
}) => {
  const inputClass =
    "bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm w-full";
  const textareaClass = `${inputClass} min-h-[40px] resize-none`;

  const handleInputChange = (field: keyof LaborScheduleItem, value: string) => {
    onUpdateItem({ ...item, [field]: value });
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateItem({ ...item, notes: e.target.value });
  };

  return (
    <div className="border-b border-gray-700 hover:bg-gray-750/30 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-[auto_2fr_2fr_1.5fr_1fr_1fr_3fr_auto] gap-x-2 items-center py-2 px-1">
        {/* Mobile Header */}
        <div className="md:hidden col-span-1 flex justify-between items-center px-2 pb-2">
          <span className="font-bold text-white">Item #{index + 1}</span>
          <div className="flex items-center justify-end space-x-1">
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

        {/* Order and Actions */}
        <div className="hidden md:flex text-gray-400 text-sm flex-col items-center justify-center pt-1 space-y-0.5">
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

        {/* Inputs grid */}
        <div className="col-span-1 md:col-span-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_2fr_1.5fr_1fr_1fr_3fr] gap-2 px-2 md:px-0">
          <div className="md:col-span-1">
            <label className="text-xs text-gray-400 md:hidden">Name</label>
            <input
              type="text"
              name="name"
              value={item.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={inputClass}
              placeholder="Name"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-gray-400 md:hidden">Position</label>
            <input
              type="text"
              name="position"
              value={item.position || ""}
              onChange={(e) => handleInputChange("position", e.target.value)}
              className={inputClass}
              placeholder="Position"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-gray-400 md:hidden">Date</label>
            <input
              type="date"
              name="date"
              value={item.date || ""}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-gray-400 md:hidden">Time In</label>
            <input
              type="time"
              name="time_in"
              value={item.time_in || ""}
              onChange={(e) => handleInputChange("time_in", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-gray-400 md:hidden">Time Out</label>
            <input
              type="time"
              name="time_out"
              value={item.time_out || ""}
              onChange={(e) => handleInputChange("time_out", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2 md:col-span-1">
            <label className="text-xs text-gray-400 md:hidden">Notes</label>
            <textarea
              name="notes"
              value={item.notes || ""}
              onChange={handleTextAreaChange}
              className={textareaClass}
              placeholder="Notes"
              rows={1}
            />
          </div>
        </div>

        <div className="hidden md:flex items-center justify-end pr-1 space-x-1">
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
    </div>
  );
};

const ProductionScheduleLabor: React.FC<ProductionScheduleLaborProps> = ({
  laborItems,
  onUpdateLaborItems,
}) => {
  const getGroupedAndSortedItems = () => {
    const groups: Record<string, LaborScheduleItem[]> = {};
    laborItems.forEach((item) => {
      const dateStr = item.date || "No Date Assigned";
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(item);
    });
    // Items within groups maintain their order from laborItems array.

    return Object.entries(groups).sort(([dateA], [dateB]) => {
      if (dateA === "No Date Assigned") return 1;
      if (dateB === "No Date Assigned") return -1;
      try {
        const timeA = new Date(dateA + "T00:00:00Z").getTime();
        const timeB = new Date(dateB + "T00:00:00Z").getTime();
        return timeA - timeB;
      } catch (e) {
        return 0;
      }
    });
  };

  const groupedItems = getGroupedAndSortedItems();

  const createNewLaborItem = (date: string): LaborScheduleItem => ({
    id: uuidv4(),
    name: "",
    position: "",
    date: date,
    time_in: "",
    time_out: "",
    notes: "",
  });

  const handleAddItemToDay = (dateKey: string) => {
    const newItemDate =
      dateKey === "No Date Assigned" ? new Date().toISOString().split("T")[0] : dateKey;
    const newItem = createNewLaborItem(newItemDate);
    onUpdateLaborItems([...laborItems, newItem]);
  };

  const handleDuplicateItem = (itemToDuplicate: LaborScheduleItem) => {
    const newItem: LaborScheduleItem = {
      ...itemToDuplicate,
      id: uuidv4(),
    };
    const originalIndex = laborItems.findIndex((item) => item.id === itemToDuplicate.id);
    const updatedItems = [...laborItems];
    if (originalIndex !== -1) {
      updatedItems.splice(originalIndex + 1, 0, newItem);
    } else {
      updatedItems.push(newItem);
    }
    onUpdateLaborItems(updatedItems);
  };

  const handleDuplicateDayGroup = (dateKey: string) => {
    const itemsToDuplicate = laborItems.filter(
      (item) => (item.date || "No Date Assigned") === dateKey,
    );
    if (itemsToDuplicate.length === 0) return;

    let nextDateStr = "No Date Assigned";
    if (dateKey !== "No Date Assigned") {
      try {
        const originalDate = new Date(dateKey + "T00:00:00Z");
        originalDate.setUTCDate(originalDate.getUTCDate() + 1);
        nextDateStr = originalDate.toISOString().split("T")[0];
      } catch (e) {
        console.error("Error calculating next date:", e);
        nextDateStr = dateKey;
      }
    }

    const newItems = itemsToDuplicate.map((item) => ({
      ...item,
      id: uuidv4(),
      date: nextDateStr,
    }));
    onUpdateLaborItems([...laborItems, ...newItems]);
  };

  const handleAddNewDayGroup = () => {
    let newDate = new Date();
    const validDates = laborItems
      .map((item) => (item.date ? new Date(item.date + "T00:00:00Z").getTime() : 0))
      .filter((timestamp) => timestamp > 0);

    if (validDates.length > 0) {
      const latestTimestamp = Math.max(...validDates);
      newDate = new Date(latestTimestamp);
      newDate.setUTCDate(newDate.getUTCDate() + 1);
    }

    const initialItemForNewDay = createNewLaborItem(newDate.toISOString().split("T")[0]);
    initialItemForNewDay.notes = "New day started";
    onUpdateLaborItems([...laborItems, initialItemForNewDay]);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateLaborItems(laborItems.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (updatedItem: LaborScheduleItem) => {
    onUpdateLaborItems(laborItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  };

  const handleMoveItem = (itemToMoveId: string, direction: "up" | "down") => {
    const allItemsCopy = [...laborItems];
    const itemIndexInFullList = allItemsCopy.findIndex((item) => item.id === itemToMoveId);

    if (itemIndexInFullList === -1) return;

    const itemToMove = allItemsCopy[itemIndexInFullList];
    const itemDateKey = itemToMove.date || "No Date Assigned";

    if (direction === "up") {
      if (itemIndexInFullList === 0) return;
      const itemAbove = allItemsCopy[itemIndexInFullList - 1];
      if ((itemAbove.date || "No Date Assigned") !== itemDateKey) return;

      [allItemsCopy[itemIndexInFullList], allItemsCopy[itemIndexInFullList - 1]] = [
        allItemsCopy[itemIndexInFullList - 1],
        allItemsCopy[itemIndexInFullList],
      ];
    } else {
      // direction === 'down'
      if (itemIndexInFullList === allItemsCopy.length - 1) return;
      const itemBelow = allItemsCopy[itemIndexInFullList + 1];
      if ((itemBelow.date || "No Date Assigned") !== itemDateKey) return;

      [allItemsCopy[itemIndexInFullList], allItemsCopy[itemIndexInFullList + 1]] = [
        allItemsCopy[itemIndexInFullList + 1],
        allItemsCopy[itemIndexInFullList],
      ];
    }
    onUpdateLaborItems(allItemsCopy);
  };

  const formatDateHeader = (dateKey: string) => {
    if (dateKey === "No Date Assigned") return "Items without an Assigned Date";
    try {
      const [year, month, day] = dateKey.split("-").map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
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
            <button
              onClick={() => handleDuplicateDayGroup(dateKey)}
              className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
              title="Duplicate Day Group"
            >
              <Copy size={20} />
            </button>
          </div>

          <div className="px-2 pt-2">
            <div className="hidden md:grid grid-cols-[auto_2fr_2fr_1.5fr_1fr_1fr_3fr_auto] gap-2 p-2 border-b border-gray-600 font-medium text-gray-400 text-xs sticky top-0 bg-gray-700 z-10">
              <div className="pl-1 text-center">Order</div>
              <div>Name</div>
              <div>Position</div>
              <div>Date</div>
              <div>Time In</div>
              <div>Time Out</div>
              <div>Notes</div>
              <div className="text-right pr-1">Actions</div>
            </div>

            {itemsInGroup.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items for this day.</p>
            ) : (
              <div className="divide-y divide-gray-700 md:divide-y-0">
                {itemsInGroup.map((item, indexInGroup) => (
                  <LaborScheduleItemRow
                    key={item.id}
                    item={item}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={() => handleDeleteItem(item.id)}
                    onDuplicateItem={() => handleDuplicateItem(item)}
                    onMoveItemUp={() => handleMoveItem(item.id, "up")}
                    onMoveItemDown={() => handleMoveItem(item.id, "down")}
                    isFirstItem={indexInGroup === 0}
                    isLastItem={indexInGroup === itemsInGroup.length - 1}
                    index={indexInGroup}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="p-4 text-center border-t border-gray-600/50">
            <button
              onClick={() => handleAddItemToDay(dateKey)}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Add Item {dateKey !== "No Date Assigned" ? `to Day` : ""}
            </button>
          </div>
        </div>
      ))}

      {laborItems.length === 0 && groupedItems.length === 0 && (
        <p className="text-gray-400 text-center py-10 text-lg">
          No labor schedule items yet. <br />
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

export default ProductionScheduleLabor;
