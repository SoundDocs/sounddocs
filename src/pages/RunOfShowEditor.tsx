import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Loader, ArrowLeft, Save, Plus, Trash2, Edit3, Check, X, FileText, MonitorPlay, Palette } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import MobileScreenWarning from "../components/MobileScreenWarning";
import { useScreenSize } from "../hooks/useScreenSize";

// Interfaces
export interface RunOfShowItem {
  id: string;
  type: 'item' | 'header'; 
  itemNumber: string; 
  startTime: string; 
  highlightColor?: string; // New field for row highlight color
  
  headerTitle?: string;

  preset?: string;
  duration?: string; 
  privateNotes?: string;
  productionNotes?: string;
  audio?: string;
  video?: string;
  lights?: string;
  [customKey: string]: any; 
}

export interface CustomColumnDefinition {
  id:string;
  name: string;
  type: "text" | "number" | "time"; 
}

interface RunOfShowData {
  id?: string;
  user_id?: string;
  name: string;
  items: RunOfShowItem[];
  custom_column_definitions: CustomColumnDefinition[];
  created_at?: string;
  last_edited?: string;
}

const PREDEFINED_HIGHLIGHT_COLORS: { name: string; value?: string; tailwindClass?: string }[] = [
  { name: "Default", value: undefined, tailwindClass: "bg-transparent" },
  { name: "Blue", value: "#2563EB", tailwindClass: "bg-blue-600" }, 
  { name: "Green", value: "#059669", tailwindClass: "bg-green-600" }, 
  { name: "Yellow", value: "#CA8A04", tailwindClass: "bg-yellow-600" }, 
  { name: "Red", value: "#DC2626", tailwindClass: "bg-red-600" }, 
  { name: "Purple", value: "#7C3AED", tailwindClass: "bg-violet-600" },
  { name: "Orange", value: "#EA580C", tailwindClass: "bg-orange-600" },
  { name: "Pink", value: "#DB2777", tailwindClass: "bg-pink-600" },
  { name: "Gray", value: "#4B5563", tailwindClass: "bg-gray-600" },
  { name: "Teal", value: "#0D9488", tailwindClass: "bg-teal-600" },
  { name: "Indigo", value: "#4F46E5", tailwindClass: "bg-indigo-600" },
  { name: "Lime", value: "#65A30D", tailwindClass: "bg-lime-600" },
];


const RunOfShowEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runOfShow, setRunOfShow] = useState<RunOfShowData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState<string>("");
  const [newColumnType, setNewColumnType] = useState<'text' | 'number' | 'time'>("text");
  
  const [colorPickerModalTargetItemId, setColorPickerModalTargetItemId] = useState<string | null>(null);
  const colorPickerModalRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (screenSize === "mobile" || screenSize === "tablet") {
      setShowMobileWarning(true);
    }
  }, [screenSize]);

  const fetchRunOfShow = useCallback(async (userId: string) => {
    if (id === "new") {
      setRunOfShow({
        name: "Untitled Run of Show",
        items: [],
        custom_column_definitions: [],
      });
      setLoading(false);
    } else {
      try {
        const { data, error } = await supabase
          .from("run_of_shows")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (error) throw error;
        if (data) {
          const migratedItems = (data.items || []).map((item: any) => ({
            ...item,
            type: item.type || 'item',
            highlightColor: item.highlightColor || undefined, 
          }));
          setRunOfShow({
            ...data,
            items: migratedItems,
            custom_column_definitions: (data.custom_column_definitions || []).map((col: any) => ({ ...col, type: col.type || 'text' })),
          });
        } else {
          navigate("/dashboard"); 
        }
      } catch (error) {
        console.error("Error fetching run of show:", error);
        setSaveError("Failed to load run of show data.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error("User not authenticated:", userError);
        navigate("/login");
        return;
      }
      setUser(userData.user);
      await fetchRunOfShow(userData.user.id);
    };
    init();
  }, [id, navigate, fetchRunOfShow]);

  useEffect(() => {
    const handleClickOutsideModal = (event: MouseEvent) => {
      if (colorPickerModalRef.current && !colorPickerModalRef.current.contains(event.target as Node)) {
        setColorPickerModalTargetItemId(null); // Close modal if click is outside its content
      }
    };
    if (colorPickerModalTargetItemId) {
      document.addEventListener("mousedown", handleClickOutsideModal);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideModal);
    };
  }, [colorPickerModalTargetItemId]);


  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (runOfShow) {
      setRunOfShow({ ...runOfShow, name: e.target.value });
    }
  };

  const handleAddItem = (type: 'item' | 'header' = 'item') => {
    if (runOfShow) {
      const newItem: RunOfShowItem = {
        id: uuidv4(),
        type: type,
        itemNumber: type === 'item' ? (runOfShow.items.filter(i => i.type === 'item').length + 1).toString() : "",
        startTime: "",
        highlightColor: undefined, 
        headerTitle: type === 'header' ? "New Section Header" : undefined,
        preset: type === 'item' ? "" : undefined,
        duration: type === 'item' ? "" : undefined,
        privateNotes: type === 'item' ? "" : undefined,
        productionNotes: type === 'item' ? "" : undefined,
        audio: type === 'item' ? "" : undefined,
        video: type === 'item' ? "" : undefined,
        lights: type === 'item' ? "" : undefined,
      };
      if (type === 'item') {
        runOfShow.custom_column_definitions.forEach(col => {
          newItem[col.name] = "";
        });
      }
      setRunOfShow({ ...runOfShow, items: [...runOfShow.items, newItem] });
    }
  };

  const handleItemChange = (itemId: string, field: keyof RunOfShowItem | string, value: any) => {
    if (runOfShow) {
      setRunOfShow({
        ...runOfShow,
        items: runOfShow.items.map((item) =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (runOfShow) {
      setRunOfShow({
        ...runOfShow,
        items: runOfShow.items.filter((item) => item.id !== itemId),
      });
    }
  };

  const handleAddCustomColumn = () => {
    if (runOfShow && newColumnName.trim() !== "") {
      const newColumn: CustomColumnDefinition = {
        id: uuidv4(),
        name: newColumnName.trim(),
        type: newColumnType, 
      };
      const updatedDefinitions = [...runOfShow.custom_column_definitions, newColumn];
      const updatedItems = runOfShow.items.map(item => 
        item.type === 'item' ? { ...item, [newColumn.name]: "" } : item
      );

      setRunOfShow({
        ...runOfShow,
        custom_column_definitions: updatedDefinitions,
        items: updatedItems,
      });
      setNewColumnName(""); 
      setNewColumnType("text");
      setEditingColumnId(null); 
    }
  };
  
  const handleRenameCustomColumn = (columnId: string, newName: string) => {
    if (runOfShow && newName.trim() !== "") {
      const oldColumn = runOfShow.custom_column_definitions.find(col => col.id === columnId);
      if (!oldColumn) return;

      const oldName = oldColumn.name;
      const updatedDefinitions = runOfShow.custom_column_definitions.map(col =>
        col.id === columnId ? { ...col, name: newName.trim(), type: newColumnType } : col
      );
      const updatedItems = runOfShow.items.map(item => {
        if (item.type === 'header') return item;
        if (oldName !== newName.trim() && item.hasOwnProperty(oldName)) {
            const { [oldName]: value, ...rest } = item;
            return { ...rest, [newName.trim()]: value };
        }
        return item;
      });
      setRunOfShow({
        ...runOfShow,
        custom_column_definitions: updatedDefinitions,
        items: updatedItems,
      });
      setEditingColumnId(null);
      setNewColumnName("");
      setNewColumnType("text");
    }
  };

  const handleDeleteCustomColumn = (columnId: string) => {
    if (runOfShow) {
      const columnToDelete = runOfShow.custom_column_definitions.find(col => col.id === columnId);
      if (!columnToDelete) return;

      const updatedDefinitions = runOfShow.custom_column_definitions.filter(
        (col) => col.id !== columnId
      );
      const updatedItems = runOfShow.items.map((item) => {
        if (item.type === 'header') return item;
        const { [columnToDelete.name]: _, ...rest } = item; 
        return rest;
      });
      setRunOfShow({
        ...runOfShow,
        custom_column_definitions: updatedDefinitions,
        items: updatedItems,
      });
    }
  };

  const handleSave = async () => {
    if (!runOfShow || !user) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const dataToSave: Omit<RunOfShowData, 'id' | 'user_id' | 'created_at'> & { user_id: string, last_edited: string, id?: string, created_at?: string } = {
      name: runOfShow.name,
      items: runOfShow.items.map(item => ({ 
        ...item,
        type: item.type || 'item',
        highlightColor: item.highlightColor || undefined,
      })),
      custom_column_definitions: runOfShow.custom_column_definitions.map(col => ({...col, type: col.type || 'text'})),
      user_id: user.id,
      last_edited: new Date().toISOString(),
    };

    try {
      let savedData;
      if (id === "new") {
        const { data, error } = await supabase
          .from("run_of_shows")
          .insert({ ...dataToSave, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        savedData = data;
        if (data) navigate(`/run-of-show/${data.id}`);
      } else {
        const { data, error } = await supabase
          .from("run_of_shows")
          .update(dataToSave)
          .eq("id", id as string)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        savedData = data;
      }
      
      if (savedData) {
        const migratedItems = (savedData.items || []).map((item: any) => ({
            ...item,
            type: item.type || 'item',
            highlightColor: item.highlightColor || undefined,
        }));
        setRunOfShow({
            ...savedData,
            items: migratedItems,
            custom_column_definitions: (savedData.custom_column_definitions || []).map((col: any) => ({ ...col, type: col.type || 'text' })),
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving run of show:", error);
      setSaveError(`Error saving: ${error.message || "Please try again."}`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleNavigateToShowMode = () => {
    if (id && id !== "new") {
      navigate(`/show-mode/${id}`);
    } else {
      setSaveError("Please save the Run of Show before entering Show Mode.");
      setTimeout(() => setSaveError(null), 5000);
    }
  };

  const handleOpenColorPickerModal = (itemId: string) => {
    setColorPickerModalTargetItemId(itemId);
  };

  const handleSelectColor = (colorValue?: string) => {
    if (colorPickerModalTargetItemId) {
      handleItemChange(colorPickerModalTargetItemId, 'highlightColor', colorValue);
    }
    setColorPickerModalTargetItemId(null); // Close modal
  };


  if (loading || !runOfShow) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const defaultColumns: { key: keyof RunOfShowItem | string; label: string; type?: string }[] = [
    { key: "itemNumber", label: "Item #" }, 
    { key: "startTime", label: "Start", type: "time" },
    { key: "preset", label: "Preset / Scene" }, 
    { key: "duration", label: "Duration", type: "text" }, 
    { key: "privateNotes", label: "Private Notes" },
    { key: "productionNotes", label: "Production Notes" },
    { key: "audio", label: "Audio" },
    { key: "video", label: "Video" },
    { key: "lights", label: "Lights" },
  ];

  const allDisplayColumns = [
    ...defaultColumns,
    ...runOfShow.custom_column_definitions.map(col => ({ key: col.name, label: col.name, id: col.id, isCustom: true, type: col.type || "text" }))
  ];
  
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {showMobileWarning && (
        <MobileScreenWarning
          title="Run of Show Editor"
          description="This editor is best experienced on larger screens. Some content might be truncated or difficult to interact with on smaller devices."
          continueAnyway={true}
          editorType="runofshow"
        />
      )}
      <Header dashboard={true} />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 md:py-12 mt-16 md:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4">
          <div className="flex items-center flex-grow min-w-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-grow min-w-0">
              <input
                type="text"
                value={runOfShow.name}
                onChange={handleNameChange}
                className="text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                placeholder="Enter Run of Show Name"
              />
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                {runOfShow.last_edited
                  ? `Last edited: ${new Date(runOfShow.last_edited).toLocaleString()}`
                  : `Created: ${new Date(runOfShow.created_at || Date.now()).toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 fixed bottom-4 right-4 z-20 md:static md:z-auto sm:ml-auto flex-shrink-0">
            <button
              onClick={handleNavigateToShowMode}
              className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-md font-medium transition-all duration-200 shadow-lg md:shadow-none"
            >
              <MonitorPlay className="h-4 w-4 mr-2" />
              Show Mode
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg md:shadow-none"
            >
              {saving ? (
                <><Loader className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Save</>
              )}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-3 mb-4 text-sm text-red-300">{saveError}</div>
        )}
        {saveSuccess && (
          <div className="bg-green-400/10 border border-green-400 rounded-lg p-3 mb-4 text-sm text-green-300">Run of Show saved successfully!</div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">Show Content</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleAddItem('header')}
                className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                <FileText className="h-4 w-4 mr-1.5" /> 
                Add Header
              </button>
              <button
                onClick={() => handleAddItem('item')}
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Item
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/50 sticky top-0 z-10">
                <tr>
                  {allDisplayColumns.map((col, index) => (
                    <th
                      key={col.key || col.id}
                      scope="col"
                      className={`py-3 px-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap ${index === 0 ? 'pl-4 md:pl-6' : ''} ${index === allDisplayColumns.length -1 ? 'pr-4 md:pr-6' : ''}`}
                      style={{ minWidth: col.key === 'itemNumber' ? '200px' : col.key === 'privateNotes' || col.key === 'productionNotes' ? '250px' : '150px' }}
                    >
                      <div className="flex items-center">
                        {editingColumnId === col.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newColumnName}
                              onChange={(e) => setNewColumnName(e.target.value)}
                              className="bg-gray-900 text-white text-xs p-1 rounded border border-indigo-500 focus:ring-indigo-500 focus:border-indigo-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameCustomColumn(col.id!, newColumnName);
                                if (e.key === 'Escape') { setEditingColumnId(null); setNewColumnName(""); setNewColumnType("text");}
                              }}
                            />
                            <select 
                                value={newColumnType} 
                                onChange={(e) => setNewColumnType(e.target.value as 'text'|'number'|'time')}
                                className="bg-gray-900 text-white text-xs p-1 rounded border border-indigo-500 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="time">Time</option>
                            </select>
                            <button onClick={() => handleRenameCustomColumn(col.id!, newColumnName)} className="text-green-400 hover:text-green-300 p-0.5"><Check size={14}/></button>
                            <button onClick={() => { setEditingColumnId(null); setNewColumnName(""); setNewColumnType("text");}} className="text-red-400 hover:text-red-300 p-0.5"><X size={14}/></button>
                          </div>
                        ) : (
                          <>
                            {col.label}
                            {col.isCustom && (
                              <>
                                <button onClick={() => { setEditingColumnId(col.id!); setNewColumnName(col.label); setNewColumnType(col.type || "text"); }} className="ml-1.5 text-gray-400 hover:text-indigo-400 p-0.5"><Edit3 size={12}/></button>
                                <button onClick={() => handleDeleteCustomColumn(col.id!)} className="text-gray-400 hover:text-red-400 p-0.5"><Trash2 size={12}/></button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                  <th scope="col" className="py-3 px-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap pr-4 md:pr-6">
                    {editingColumnId === 'new' ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          placeholder="New Column Name"
                          className="bg-gray-900 text-white text-xs p-1 rounded border border-indigo-500 focus:ring-indigo-500 focus:border-indigo-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCustomColumn();
                            if (e.key === 'Escape') { setEditingColumnId(null); setNewColumnName(""); setNewColumnType("text");}
                          }}
                        />
                        <select 
                            value={newColumnType} 
                            onChange={(e) => setNewColumnType(e.target.value as 'text'|'number'|'time')}
                            className="bg-gray-900 text-white text-xs p-1 rounded border border-indigo-500 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="time">Time</option>
                        </select>
                        <button onClick={handleAddCustomColumn} className="text-green-400 hover:text-green-300 p-0.5"><Check size={14}/></button>
                        <button onClick={() => { setEditingColumnId(null); setNewColumnName(""); setNewColumnType("text");}} className="text-red-400 hover:text-red-300 p-0.5"><X size={14}/></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingColumnId('new'); setNewColumnName(""); setNewColumnType("text"); }}
                        className="flex items-center text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                      >
                        <Plus size={14} className="mr-1" /> Add Column
                      </button>
                    )}
                  </th>
                  <th scope="col" className="relative py-3 px-3 pr-4 md:pr-6" style={{ minWidth: '100px' }}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {runOfShow.items.map((item) => {
                  const rowStyle = item.type === 'item' && item.highlightColor ? { backgroundColor: item.highlightColor } : {};
                  if (item.type === 'header') {
                    return (
                      <tr key={item.id} className="bg-gray-700/70 hover:bg-gray-600/70 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-100 pl-4 md:pl-6">
                          <input
                            type="text"
                            value={item.headerTitle || ""}
                            onChange={(e) => handleItemChange(item.id, "headerTitle", e.target.value)}
                            className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded p-1 w-full placeholder-gray-400 text-lg font-bold"
                            placeholder="Section Header Title"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-200">
                          <input
                            type="time"
                            step="1"
                            value={item.startTime}
                            onChange={(e) => handleItemChange(item.id, "startTime", e.target.value)}
                            className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded p-1 w-full placeholder-gray-500 font-semibold"
                          />
                        </td>
                        {allDisplayColumns.slice(2).map(colConfig => (
                          <td key={`header-empty-${colConfig.key || colConfig.id}`} className="px-3 py-2 text-xs text-gray-500 italic">
                            N/A
                          </td>
                        ))}
                        <td className="px-3 py-2"></td> 
                        <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium pr-4 md:pr-6">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Delete Header"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={item.id} className="hover:bg-gray-700/50 transition-colors" style={rowStyle}>
                      {allDisplayColumns.map((col, colIndex) => (
                        <td key={col.key || col.id} className={`px-3 py-2 whitespace-nowrap text-sm text-gray-200 ${colIndex === 0 ? 'pl-4 md:pl-6' : ''}`}>
                          <input
                            type={col.type || "text"} 
                            value={item[col.key as keyof RunOfShowItem] || ""}
                            onChange={(e) => handleItemChange(item.id, col.key as keyof RunOfShowItem, e.target.value)}
                            className={`bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded p-1 w-full placeholder-gray-500 ${col.key === 'itemNumber' ? 'font-semibold' : ''}`}
                            placeholder={col.key === 'itemNumber' ? 'Item Name/No.' : col.key === 'preset' ? 'Preset/Scene' : col.key === 'duration' ? 'mm:ss' : col.label}
                            step={col.type === 'time' ? '1' : col.type === 'number' ? 'any' : undefined}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-200"></td> 
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium pr-4 md:pr-6 relative">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenColorPickerModal(item.id)}
                            className="text-indigo-400 hover:text-indigo-300 p-1"
                            title="Highlight Row"
                          >
                            <Palette className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Delete Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {runOfShow.items.length === 0 && (
                    <tr>
                        <td colSpan={allDisplayColumns.length + 2} className="text-center py-8 text-gray-400">
                            No content yet. Click "Add Item" or "Add Header" to get started.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex justify-center items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? (
              <><Loader className="h-5 w-5 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="h-5 w-5 mr-2" />Save Run of Show</>
            )}
          </button>
          <button
            onClick={handleNavigateToShowMode}
            className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-3 rounded-md font-medium transition-all duration-200 shadow-lg"
          >
            <MonitorPlay className="h-5 w-5 mr-2" />
            Show Mode
          </button>
        </div>

      </main>
      <Footer />

      {/* Color Picker Modal */}
      {colorPickerModalTargetItemId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div 
            ref={colorPickerModalRef} 
            className="bg-gray-800 p-4 rounded-lg shadow-2xl w-full max-w-xs sm:max-w-sm transform transition-all"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Highlight Color</h3>
              <button 
                onClick={() => setColorPickerModalTargetItemId(null)} 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close color picker"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {PREDEFINED_HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.name}
                  title={color.name}
                  onClick={() => handleSelectColor(color.value)}
                  className="w-full h-12 sm:h-14 rounded-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-400"
                  style={{ 
                    backgroundColor: color.value || '#374151', // gray-700 for default
                    border: `2px solid ${color.value ? 'transparent' : '#4B5563'}`, // gray-600 for default border
                  }}
                >
                  {/* Optional: Add a checkmark or visual indicator for the currently selected color if needed */}
                  {runOfShow?.items.find(item => item.id === colorPickerModalTargetItemId)?.highlightColor === color.value && (
                     <Check size={20} className="mx-auto text-white mix-blend-difference" />
                  )}
                   {color.value === undefined && runOfShow?.items.find(item => item.id === colorPickerModalTargetItemId)?.highlightColor === undefined && (
                     <Check size={20} className="mx-auto text-white mix-blend-difference" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleSelectColor(undefined)} // Clear color option
              className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md font-medium transition-colors text-sm"
            >
              Clear Highlight
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunOfShowEditor;
