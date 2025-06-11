import React, { useState, useEffect, useRef } from "react";
import {
  PlusCircle,
  Trash2,
  Save,
  ChevronDown,
  Edit,
  ChevronRight,
  ChevronUp,
  Link,
  Link2,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { fetchUserCustomSuggestions, addUserCustomSuggestion } from "../../lib/supabase";
import { FIELD_TYPES } from "../../lib/constants";

interface OutputChannel {
  id: string;
  channelNumber: string;
  name: string;
  sourceType: string;
  sourceDetails?: {
    outputNumber?: string;
    snakeType?: string;
    networkType?: string;
    networkPatch?: string;
    consoleType?: string;
    consoleOutputNumber?: string;
  };
  destinationType: string;
  destinationGear: string;
  notes: string;
  isStereo?: boolean;
  stereoChannelNumber?: string;
}

interface PatchSheetOutputsProps {
  outputs: OutputChannel[];
  updateOutputs: (outputs: OutputChannel[]) => void;
}

const PatchSheetOutputs: React.FC<PatchSheetOutputsProps> = ({ outputs, updateOutputs }) => {
  const { user } = useAuth();
  const [showDestinationTypeOptions, setShowDestinationTypeOptions] = useState<{ [key: string]: boolean }>({});
  const [editModeOutputs, setEditModeOutputs] = useState<{ [key: string]: boolean }>({});
  const [editingOutputs, setEditingOutputs] = useState<{ [key: string]: OutputChannel }>({});
  const [isMobile, setIsMobile] = useState(false);

  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState<number | string>(8);
  const [bulkStartChannel, setBulkStartChannel] = useState<number | string>(1);
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkSourceType, setBulkSourceType] = useState("");
  const [bulkDestinationType, setBulkDestinationType] = useState("");
  const [bulkDestinationGear, setBulkDestinationGear] = useState("");
  const [bulkSourceDetails, setBulkSourceDetails] = useState<{ outputNumber?: string; snakeType?: string; networkType?: string; networkPatch?: string; consoleType?: string; consoleOutputNumber?: string; }>({});
  const [bulkIsStereo, setBulkIsStereo] = useState(false);

  // User-specific suggestions state
  const [userCustomConsoleTypes, setUserCustomConsoleTypes] = useState<string[]>([]);
  const [userCustomAnalogSnakeTypes, setUserCustomAnalogSnakeTypes] = useState<string[]>([]);
  const [userCustomDigitalSnakeTypes, setUserCustomDigitalSnakeTypes] = useState<string[]>([]);
  const [userCustomNetworkTypes, setUserCustomNetworkTypes] = useState<string[]>([]);
  const [userCustomDestinationTypes, setUserCustomDestinationTypes] = useState<string[]>([]);
  const [userCustomDestinationGear, setUserCustomDestinationGear] = useState<string[]>([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserCustomSuggestions(user.id, 'output_').then(suggestionsMap => {
        setUserCustomConsoleTypes(suggestionsMap[FIELD_TYPES.OUTPUT_SRC_CONSOLE_TYPE] || []);
        setUserCustomAnalogSnakeTypes(suggestionsMap[FIELD_TYPES.OUTPUT_SRC_ANALOG_SNAKE_TYPE] || []);
        setUserCustomDigitalSnakeTypes(suggestionsMap[FIELD_TYPES.OUTPUT_SRC_DIGITAL_SNAKE_TYPE] || []);
        setUserCustomNetworkTypes(suggestionsMap[FIELD_TYPES.OUTPUT_SRC_NETWORK_TYPE] || []);
        setUserCustomDestinationTypes(suggestionsMap[FIELD_TYPES.OUTPUT_DESTINATION_TYPE] || []);
        setUserCustomDestinationGear(suggestionsMap[FIELD_TYPES.OUTPUT_DESTINATION_GEAR] || []);
      }).catch(console.error);
    } else {
      setUserCustomConsoleTypes([]);
      setUserCustomAnalogSnakeTypes([]);
      setUserCustomDigitalSnakeTypes([]);
      setUserCustomNetworkTypes([]);
      setUserCustomDestinationTypes([]);
      setUserCustomDestinationGear([]);
    }
  }, [user]);

  const sourceTypeOptions = ["Console Output", "Analog Snake", "Digital Snake", "Digital Network"];
  const destinationTypeOptions = ["Main Speakers", "Monitors", "IEM System", "Recording Device", "Broadcast Feed", "Stage Fill", "Delay Speakers", "Effects Processor"];
  const analogSnakeTypes = ["Multicore", "XLR Harness", "Sub Snake"];
  const digitalSnakeTypes = ["Yamaha Rio", "Allen & Heath DX168", "Behringer S16", "Midas DL16", "PreSonus NSB"];
  const networkTypeOptions = ["Dante", "AVB", "MADI", "AES50", "Ravenna", "AES67"];
  const consoleTypeOptions = ["Avid S6L", "Avid Profile", "Avid SC48", "DiGiCo SD12", "DiGiCo SD10", "DiGiCo SD5", "Yamaha CL5", "Yamaha QL5", "Allen & Heath dLive", "Allen & Heath SQ7", "Midas PRO X", "Midas M32", "Behringer X32"];

  const [customSheetDestinationTypes, setCustomSheetDestinationTypes] = useState<string[]>([]); // Sheet-local
  const [customSheetAnalogSnakeTypes, setCustomSheetAnalogSnakeTypes] = useState<string[]>([]); // Sheet-local
  const [customSheetDigitalSnakeTypes, setCustomSheetDigitalSnakeTypes] = useState<string[]>([]); // Sheet-local
  const [customSheetNetworkTypes, setCustomSheetNetworkTypes] = useState<string[]>([]); // Sheet-local
  const [customSheetConsoleTypes, setCustomSheetConsoleTypes] = useState<string[]>([]); // Sheet-local
  // Note: Destination Gear doesn't have predefined options, so sheet-local custom isn't strictly necessary in the same way, but user-specific is.

  const destinationTypeDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const initialEditMode: { [key: string]: boolean } = {};
    outputs.forEach(output => { initialEditMode[output.id] = true; setEditingOutputs(prev => ({ ...prev, [output.id]: { ...output } })); });
    setEditModeOutputs(initialEditMode);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(destinationTypeDropdownRefs.current).forEach(id => {
        if (destinationTypeDropdownRefs.current[id] && !destinationTypeDropdownRefs.current[id]?.contains(event.target as Node)) {
          setShowDestinationTypeOptions(prev => ({ ...prev, [id]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const destTypesSet = new Set<string>(), analogSnakesSet = new Set<string>(), digitalSnakesSet = new Set<string>(), networksSet = new Set<string>(), consolesSet = new Set<string>();
    outputs.forEach(output => {
      if (output.destinationType && !destinationTypeOptions.includes(output.destinationType)) destTypesSet.add(output.destinationType);
      if (output.sourceDetails) {
        if (output.sourceType === "Analog Snake" && output.sourceDetails.snakeType && !analogSnakeTypes.includes(output.sourceDetails.snakeType)) analogSnakesSet.add(output.sourceDetails.snakeType);
        if (output.sourceType === "Digital Snake" && output.sourceDetails.snakeType && !digitalSnakeTypes.includes(output.sourceDetails.snakeType)) digitalSnakesSet.add(output.sourceDetails.snakeType);
        if (output.sourceDetails.networkType && !networkTypeOptions.includes(output.sourceDetails.networkType)) networksSet.add(output.sourceDetails.networkType);
        if (output.sourceDetails.consoleType && !consoleTypeOptions.includes(output.sourceDetails.consoleType)) consolesSet.add(output.sourceDetails.consoleType);
      }
    });
    setCustomSheetDestinationTypes(Array.from(destTypesSet));
    setCustomSheetAnalogSnakeTypes(Array.from(analogSnakesSet));
    setCustomSheetDigitalSnakeTypes(Array.from(digitalSnakesSet));
    setCustomSheetNetworkTypes(Array.from(networksSet));
    setCustomSheetConsoleTypes(Array.from(consolesSet));
  }, [outputs]);

  useEffect(() => {
    const newEditingOutputs: { [key: string]: OutputChannel } = {};
    outputs.forEach(output => { newEditingOutputs[output.id] = editingOutputs[output.id] ? { ...editingOutputs[output.id] } : { ...output }; });
    setEditingOutputs(newEditingOutputs);
    outputs.forEach(output => { if (editModeOutputs[output.id] === undefined) setEditModeOutputs(prev => ({ ...prev, [output.id]: true })); });
  }, [outputs]);

  const updateParentOutputs = () => {
    const updatedOutputs = outputs.map(output => editModeOutputs[output.id] ? { ...editingOutputs[output.id] } : output);
    updateOutputs(updatedOutputs);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => updateParentOutputs(), 500);
    return () => clearTimeout(timeoutId);
  }, [editingOutputs]);

  const handleAddOutput = () => {
    const nextChannelNumber = outputs.length > 0 ? Math.max(...outputs.map(o => parseInt(o.channelNumber, 10) || 0)) + 1 : 1;
    const newOutput: OutputChannel = { id: `output-${Date.now()}`, channelNumber: `${nextChannelNumber}`, name: "", sourceType: "", sourceDetails: {}, destinationType: "", destinationGear: "", notes: "", isStereo: false };
    updateOutputs([...outputs, newOutput]);
    setEditModeOutputs(prev => ({ ...prev, [newOutput.id]: true }));
    setEditingOutputs(prev => ({ ...prev, [newOutput.id]: { ...newOutput } }));
  };

  const handleDeleteOutput = (id: string) => {
    const outputToDelete = outputs.find(o => o.id === id);
    let updatedOutputs = outputs.filter(o => o.id !== id);
    if (outputToDelete?.isStereo && outputToDelete?.stereoChannelNumber) {
      updatedOutputs = updatedOutputs.map(o => o.channelNumber === outputToDelete.stereoChannelNumber ? { ...o, isStereo: false, stereoChannelNumber: undefined } : o);
    }
    updatedOutputs = updatedOutputs.map(o => o.stereoChannelNumber === outputToDelete?.channelNumber ? { ...o, isStereo: false, stereoChannelNumber: undefined } : o);
    updateOutputs(updatedOutputs);
    setEditModeOutputs(prev => { const u = { ...prev }; delete u[id]; return u; });
    setEditingOutputs(prev => { const u = { ...prev }; delete u[id]; return u; });
  };

  const handleEditOutput = (id: string) => {
    const output = outputs.find(o => o.id === id);
    if (!output) return;
    setEditingOutputs(prev => ({ ...prev, [id]: { ...output } }));
    setEditModeOutputs(prev => ({ ...prev, [id]: true }));
  };

  const handleSaveOutput = (id: string) => {
    const updatedOutput = editingOutputs[id];
    if (!updatedOutput) return;
    let currentOutputs = [...outputs];
    if (updatedOutput.isStereo && updatedOutput.stereoChannelNumber) {
      currentOutputs = currentOutputs.map(o => o.channelNumber === updatedOutput.stereoChannelNumber && o.id !== id ? { ...o, isStereo: true, stereoChannelNumber: updatedOutput.channelNumber } : o);
    } else if (!updatedOutput.isStereo) {
      currentOutputs = currentOutputs.map(o => o.stereoChannelNumber === updatedOutput.channelNumber ? { ...o, isStereo: false, stereoChannelNumber: undefined } : o);
    }
    const finalUpdatedOutputs = currentOutputs.map(o => o.id === id ? { ...updatedOutput } : o);
    updateOutputs(finalUpdatedOutputs);
    setEditModeOutputs(prev => ({ ...prev, [id]: false }));
  };

  const handleEditingOutputChange = (id: string, field: keyof OutputChannel, value: any) => {
    const updatedOutput = { ...editingOutputs[id] };
    updatedOutput[field] = value;
    if (field === "sourceType") updatedOutput.sourceDetails = {};
    if (field === "isStereo" && value === false) updatedOutput.stereoChannelNumber = undefined;
    setEditingOutputs(prev => ({ ...prev, [id]: updatedOutput }));
  };

  const handleSourceDetailChange = (id: string, detailKey: string, value: string) => {
    const updatedOutput = { ...editingOutputs[id] };
    if (!updatedOutput.sourceDetails) updatedOutput.sourceDetails = {};
    updatedOutput.sourceDetails[detailKey as keyof typeof updatedOutput.sourceDetails] = value;
    setEditingOutputs(prev => ({ ...prev, [id]: updatedOutput }));
  };

  const getAvailableChannelsForStereo = (currentChannelId: string, currentChannelNumber: string) => {
    return outputs.filter(o => o.id !== currentChannelId && (!o.isStereo || o.stereoChannelNumber === currentChannelNumber)).map(o => ({ channelNumber: o.channelNumber, name: o.name || `Channel ${o.channelNumber}` }));
  };

  const handleCustomTypeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, id: string, fieldTypeConstant: string, currentSuggestions: string[], predefinedOptions: string[], setSheetCustomState: React.Dispatch<React.SetStateAction<string[]>>, setUserCustomState: React.Dispatch<React.SetStateAction<string[]>>, detailKey?: string, directFieldKey?: keyof OutputChannel) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (!value) return;
  
      if (detailKey) {
        handleSourceDetailChange(id, detailKey, value);
      } else if (directFieldKey) {
        handleEditingOutputChange(id, directFieldKey, value);
      }
      
      if (!predefinedOptions.includes(value) && !currentSuggestions.includes(value)) {
        setSheetCustomState((prev) => Array.from(new Set([...prev, value]))); // For sheet-local custom types
        
        // Determine which user-specific suggestion list to check
        let userSpecificSuggestions: string[] = [];
        switch(fieldTypeConstant) {
          case FIELD_TYPES.OUTPUT_SRC_CONSOLE_TYPE: userSpecificSuggestions = userCustomConsoleTypes; break;
          case FIELD_TYPES.OUTPUT_SRC_ANALOG_SNAKE_TYPE: userSpecificSuggestions = userCustomAnalogSnakeTypes; break;
          case FIELD_TYPES.OUTPUT_SRC_DIGITAL_SNAKE_TYPE: userSpecificSuggestions = userCustomDigitalSnakeTypes; break;
          case FIELD_TYPES.OUTPUT_SRC_NETWORK_TYPE: userSpecificSuggestions = userCustomNetworkTypes; break;
          case FIELD_TYPES.OUTPUT_DESTINATION_TYPE: userSpecificSuggestions = userCustomDestinationTypes; break;
          case FIELD_TYPES.OUTPUT_DESTINATION_GEAR: userSpecificSuggestions = userCustomDestinationGear; break;
        }

        if (user && !userSpecificSuggestions.includes(value)) {
           try {
            await addUserCustomSuggestion(user.id, fieldTypeConstant, value);
            setUserCustomState((prevUser) => Array.from(new Set([...prevUser, value])));
          } catch (err) { console.error("Failed to save custom suggestion:", err); }
        }
      }
    }
  };
  
  const handleSelectDestinationType = (id: string, value: string) => {
    handleEditingOutputChange(id, "destinationType", value);
    if (value.trim() && !destinationTypeOptions.includes(value) && !customSheetDestinationTypes.includes(value)) {
      setCustomSheetDestinationTypes(prev => Array.from(new Set([...prev, value])));
    }
    if (user && value.trim() && !destinationTypeOptions.includes(value) && !userCustomDestinationTypes.includes(value)) {
      addUserCustomSuggestion(user.id, FIELD_TYPES.OUTPUT_DESTINATION_TYPE, value)
        .then(() => setUserCustomDestinationTypes(prev => Array.from(new Set([...prev, value]))))
        .catch(console.error);
    }
    setShowDestinationTypeOptions(prev => ({ ...prev, [id]: false }));
  };

  const handleDestinationTypeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Enter") { e.preventDefault(); const value = e.currentTarget.value; if (!value.trim()) return; handleSelectDestinationType(id, value); }
  };
  
  const toggleDestinationTypeOptions = (id: string) => setShowDestinationTypeOptions(prev => ({ ...prev, [id]: !prev[id] }));

  const getCombinedSuggestions = (base: string[], sheetCustom: string[], userCustom: string[]) => Array.from(new Set([...base, ...sheetCustom, ...userCustom]));

  const getAllDestinationTypes = () => getCombinedSuggestions(destinationTypeOptions, customSheetDestinationTypes, userCustomDestinationTypes);
  const getAllAnalogSnakeTypes = () => getCombinedSuggestions(analogSnakeTypes, customSheetAnalogSnakeTypes, userCustomAnalogSnakeTypes);
  const getAllDigitalSnakeTypes = () => getCombinedSuggestions(digitalSnakeTypes, customSheetDigitalSnakeTypes, userCustomDigitalSnakeTypes);
  const getAllNetworkTypes = () => getCombinedSuggestions(networkTypeOptions, customSheetNetworkTypes, userCustomNetworkTypes);
  const getAllConsoleTypes = () => getCombinedSuggestions(consoleTypeOptions, customSheetConsoleTypes, userCustomConsoleTypes);
  // For Destination Gear, there are no predefined options, so it's just sheet custom (if any) + user custom
  const getAllDestinationGearSuggestions = () => Array.from(new Set([...userCustomDestinationGear])); // Assuming no sheet-local for gear yet


  const renderSourceDetails = (output: OutputChannel) => {
    if (!output.sourceType || !output.sourceDetails) return null;
    switch (output.sourceType) {
      case "Console Output": return <div className="flex space-x-4 text-sm"><span className="text-gray-400">{output.sourceDetails.consoleType ? `${output.sourceDetails.consoleType} - ` : ""}{output.sourceDetails.outputNumber ? `Output #${output.sourceDetails.outputNumber}` : ""}</span></div>;
      case "Analog Snake": return <div className="flex space-x-4 text-sm"><span className="text-gray-400">{output.sourceDetails.snakeType || ""}{output.sourceDetails.outputNumber ? ` - Output #${output.sourceDetails.outputNumber}` : ""}</span></div>;
      case "Digital Snake": return <div className="flex space-x-4 text-sm"><span className="text-gray-400">{output.sourceDetails.snakeType || ""}{output.sourceDetails.outputNumber ? ` - Output #${output.sourceDetails.outputNumber}` : ""}{output.sourceDetails.networkType ? ` - ${output.sourceDetails.networkType}` : ""}{output.sourceDetails.networkPatch ? ` - Patch #${output.sourceDetails.networkPatch}` : ""}</span></div>;
      case "Digital Network": return <div className="flex space-x-4 text-sm"><span className="text-gray-400">{output.sourceDetails.networkType || ""}{output.sourceDetails.networkPatch ? ` - Patch #${output.sourceDetails.networkPatch}` : ""}</span></div>;
      default: return null;
    }
  };

  const renderConsoleDetails = (output: OutputChannel) => {
    if (output.sourceType === "Analog Snake" && (output.sourceDetails?.consoleType || output.sourceDetails?.consoleOutputNumber)) {
      return <div className="mt-1 text-gray-400 text-sm"><span>→ {output.sourceDetails?.consoleType || "Console"}</span>{output.sourceDetails?.consoleOutputNumber && <span> - Output #{output.sourceDetails.consoleOutputNumber}</span>}</div>;
    }
    return null;
  };

  const openBulkAddModal = () => {
    const nextChannelNumber = outputs.length > 0 ? Math.max(...outputs.map(o => parseInt(o.channelNumber, 10) || 0)) + 1 : 1;
    setBulkStartChannel(nextChannelNumber);
    setShowBulkAddModal(true);
  };

  const handleBulkAdd = () => {
    const quantity = parseInt(String(bulkQuantity), 10), startNum = parseInt(String(bulkStartChannel), 10);
    if (isNaN(quantity) || quantity <= 0 || isNaN(startNum) || startNum <= 0) { console.error("Invalid quantity or starting channel number"); return; }
    const newOutputsArr: OutputChannel[] = [];
    for (let i = 0; i < quantity; i++) {
      const channelNum = startNum + i;
      const nameSuffixNumber = bulkIsStereo ? Math.floor(i / 2) + 1 : i + 1;
      let currentName = bulkPrefix ? `${bulkPrefix} ${nameSuffixNumber}` : `Output ${channelNum}`;
      let consoleOutputNumber = bulkSourceDetails.consoleOutputNumber, networkPatch = bulkSourceDetails.networkPatch, outputNumber = bulkSourceDetails.outputNumber;
      if (consoleOutputNumber && !isNaN(parseInt(consoleOutputNumber))) consoleOutputNumber = (parseInt(consoleOutputNumber) + i).toString();
      if (networkPatch && !isNaN(parseInt(networkPatch))) networkPatch = (parseInt(networkPatch) + i).toString();
      if (outputNumber && !isNaN(parseInt(outputNumber))) outputNumber = (parseInt(outputNumber) + i).toString();
      const sourceDetails = { ...bulkSourceDetails, consoleOutputNumber, networkPatch, outputNumber };
      let isStereo = bulkIsStereo, stereoChannelNumber = undefined;
      if (bulkIsStereo) {
        if (i % 2 === 0 && i + 1 < quantity) { if (bulkPrefix) currentName += " L"; stereoChannelNumber = (startNum + i + 1).toString(); }
        else if (i % 2 === 1) { if (bulkPrefix) currentName += " R"; stereoChannelNumber = (startNum + i - 1).toString(); }
        else isStereo = false;
      }
      newOutputsArr.push({ id: `output-${Date.now()}-${i}`, channelNumber: channelNum.toString(), name: currentName, sourceType: bulkSourceType, sourceDetails, destinationType: bulkDestinationType, destinationGear: bulkDestinationGear, notes: "", isStereo, stereoChannelNumber });
    }
    updateOutputs([...outputs, ...newOutputsArr]);
    const newEditModeOutputs = { ...editModeOutputs }, newEditingOutputs = { ...editingOutputs };
    newOutputsArr.forEach(o => { newEditModeOutputs[o.id] = true; newEditingOutputs[o.id] = { ...o }; });
    setEditModeOutputs(newEditModeOutputs); setEditingOutputs(newEditingOutputs);
    setShowBulkAddModal(false); setBulkQuantity(8); setBulkStartChannel(1); setBulkPrefix(""); setBulkSourceType(""); setBulkDestinationType(""); setBulkDestinationGear(""); setBulkSourceDetails({}); setBulkIsStereo(false);
  };

  const handleBulkSourceTypeChange = (value: string) => { setBulkSourceType(value); setBulkSourceDetails({}); };
  const handleBulkSourceDetailChange = (detailKey: string, value: string) => setBulkSourceDetails(prev => ({ ...prev, [detailKey]: value }));
  const parsedBulkQuantity = parseInt(String(bulkQuantity), 10);
  const isBulkAddDisabled = isNaN(parsedBulkQuantity) || parsedBulkQuantity <= 0 || !bulkSourceType;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-xl font-semibold text-white">Output List</h2><p className="text-gray-400 text-sm mt-1">Define your audio outputs and routing</p></div>
        <div className="flex space-x-3"><button onClick={openBulkAddModal} className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm"><PlusCircle className="h-4 w-4 mr-2" />Bulk Add</button><button onClick={handleAddOutput} className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm sm:text-base"><PlusCircle className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Add Output</span><span className="sm:hidden">Add</span></button></div>
      </div>

      {outputs.length === 0 ? (
        <div className="bg-gray-700 rounded-lg p-6 md:p-10 text-center my-8">
          <p className="text-gray-300 mb-6 text-lg">No outputs have been added yet.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center"><button onClick={openBulkAddModal} className="inline-flex items-center bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"><PlusCircle className="h-5 w-5 mr-2" />Bulk Add Outputs</button><button onClick={handleAddOutput} className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"><PlusCircle className="h-5 w-5 mr-2" />Add Single Output</button></div>
        </div>
      ) : (
        <div className="space-y-4 overflow-x-auto">
          <div className="md:min-w-0"> {/* Changed: Removed min-w-[800px] */}
            {outputs.map(output => {
              const editingOutput = editingOutputs[output.id] || output;
              const isEditMode = editModeOutputs[output.id];
              const availableStereoChannels = getAvailableChannelsForStereo(output.id, output.channelNumber);
              const linkedChannel = outputs.find(otherOutput => otherOutput.channelNumber === output.stereoChannelNumber && otherOutput.isStereo);

              return (
                <div key={output.id} className={`bg-gray-800 border border-gray-700 rounded-lg overflow-visible hover:border-gray-600 transition-colors ${output.isStereo ? "border-l-4 border-l-indigo-500" : ""}`}>
                  <div className="bg-gray-750 py-3 px-4 sm:px-6 flex justify-between items-center">
                    <div className="flex items-center space-x-2 sm:space-x-4 overflow-hidden">
                      <div className="font-medium text-white flex items-center flex-shrink-0">{isEditMode ? (<><span className="hidden sm:inline">Channel</span><span className="sm:hidden">Ch</span><input type="text" value={editingOutput.channelNumber} onChange={e => handleEditingOutputChange(output.id, "channelNumber", e.target.value)} className="ml-1 sm:ml-2 bg-gray-700 text-white border border-gray-600 rounded-md px-1 sm:px-2 py-1 w-10 sm:w-16 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></>) : (<><ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" /><span>Ch {output.channelNumber}:</span></>)}</div>
                      {isEditMode ? (<><div className="hidden sm:block h-5 w-px bg-gray-600"></div><input type="text" value={editingOutput.name} onChange={e => handleEditingOutputChange(output.id, "name", e.target.value)} className="bg-gray-700 text-white border border-gray-600 rounded-md px-2 sm:px-3 py-1 w-full max-w-[140px] sm:max-w-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium" placeholder="Name/Label" /></>) : (<div className="flex items-center"><span className="text-white font-medium truncate mr-2">{output.name || "Unnamed Output"}</span>{output.isStereo && (<div className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center"><Link2 className="h-3 w-3 mr-1" />{output.stereoChannelNumber ? (<span>Stereo w/ Ch {output.stereoChannelNumber}</span>) : (<span>Stereo</span>)}</div>)}</div>)}
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">{isEditMode ? (<><button onClick={() => handleSaveOutput(output.id)} className="p-1 sm:p-2 text-indigo-400 hover:text-indigo-300 transition-colors hover:bg-gray-700 rounded-full" title="Save output"><ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" /></button><button onClick={() => handleDeleteOutput(output.id)} className="p-1 sm:p-2 text-red-400 hover:text-red-500 transition-colors hover:bg-gray-700 rounded-full" title="Delete output"><Trash2 className="h-4 w-4 sm:h-5 sm:w-5" /></button></>) : (<><button onClick={() => handleEditOutput(output.id)} className="p-1 sm:p-2 text-indigo-400 hover:text-indigo-300 transition-colors hover:bg-gray-700 rounded-full" title="Edit output"><Edit className="h-4 w-4 sm:h-5 sm:w-5" /></button><button onClick={() => handleDeleteOutput(output.id)} className="p-1 sm:p-2 text-red-400 hover:text-red-500 transition-colors hover:bg-gray-700 rounded-full" title="Delete output"><Trash2 className="h-4 w-4 sm:h-5 sm:w-5" /></button></>)}</div>
                  </div>

                  {isEditMode ? (
                    <div className="p-4 md:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <div><label className="block text-gray-300 text-sm mb-2">Source Type</label><select value={editingOutput.sourceType} onChange={e => handleEditingOutputChange(output.id, "sourceType", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"><option value="">Select Source Type</option>{sourceTypeOptions.map((type, index) => (<option key={index} value={type}>{type}</option>))}</select></div>
                        <div>
                          <div className="flex justify-between mb-2"><label className="block text-gray-300 text-sm">Stereo Channel</label><div className="flex items-center"><input type="checkbox" checked={editingOutput.isStereo} onChange={e => handleEditingOutputChange(output.id, "isStereo", e.target.checked)} className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded" /><span className="text-gray-300 text-sm">Stereo</span></div></div>
                          {editingOutput.isStereo ? (<div className="mt-2"><select value={editingOutput.stereoChannelNumber || ""} onChange={e => handleEditingOutputChange(output.id, "stereoChannelNumber", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"><option value="">Link with Channel...</option>{availableStereoChannels.map(channel => (<option key={channel.channelNumber} value={channel.channelNumber}>Ch {channel.channelNumber}: {channel.name}</option>))}</select></div>) : (<div className="mt-2 bg-gray-700 p-3 rounded-md border border-gray-600 text-white">Mono</div>)}
                        </div>

                        {editingOutput.sourceType === "Console Output" && (<>
                          <div><label className="block text-gray-300 text-sm mb-2">Console Type</label>
                            <input type="text" value={editingOutput.sourceDetails?.consoleType || ""} onChange={e => handleSourceDetailChange(output.id, "consoleType", e.target.value)} 
                             onKeyDown={e => handleCustomTypeKeyDown(e, output.id, FIELD_TYPES.OUTPUT_SRC_CONSOLE_TYPE, customSheetConsoleTypes, consoleTypeOptions, setCustomSheetConsoleTypes, setUserCustomConsoleTypes, "consoleType")}
                             className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Avid S6L" list={`consoleTypes-output-${output.id}`} />
                            <datalist id={`consoleTypes-output-${output.id}`}>{getAllConsoleTypes().map((type, idx) => (<option key={idx} value={type} />))}</datalist>
                          </div>
                          <div><label className="block text-gray-300 text-sm mb-2">Output #</label><input type="text" value={editingOutput.sourceDetails?.outputNumber || ""} onChange={e => handleSourceDetailChange(output.id, "outputNumber", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., 12" /></div>
                        </>)}
                        {editingOutput.sourceType === "Analog Snake" && (<>
                          <div><label className="block text-gray-300 text-sm mb-2">Snake Type</label>
                            <input type="text" value={editingOutput.sourceDetails?.snakeType || ""} onChange={e => handleSourceDetailChange(output.id, "snakeType", e.target.value)} 
                             onKeyDown={e => handleCustomTypeKeyDown(e, output.id, FIELD_TYPES.OUTPUT_SRC_ANALOG_SNAKE_TYPE, customSheetAnalogSnakeTypes, analogSnakeTypes, setCustomSheetAnalogSnakeTypes, setUserCustomAnalogSnakeTypes, "snakeType")}
                             className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Multicore" list={`analogSnakeTypes-output-${output.id}`} />
                            <datalist id={`analogSnakeTypes-output-${output.id}`}>{getAllAnalogSnakeTypes().map((type, idx) => (<option key={idx} value={type} />))}</datalist>
                          </div>
                          <div><label className="block text-gray-300 text-sm mb-2">Output #</label><input type="text" value={editingOutput.sourceDetails?.outputNumber || ""} onChange={e => handleSourceDetailChange(output.id, "outputNumber", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., 12" /></div>
                          <div><label className="block text-gray-300 text-sm mb-2">Console Type</label>
                            <input type="text" value={editingOutput.sourceDetails?.consoleType || ""} onChange={e => handleSourceDetailChange(output.id, "consoleType", e.target.value)} 
                             onKeyDown={e => handleCustomTypeKeyDown(e, output.id, FIELD_TYPES.OUTPUT_SRC_CONSOLE_TYPE, customSheetConsoleTypes, consoleTypeOptions, setCustomSheetConsoleTypes, setUserCustomConsoleTypes, "consoleType")}
                             className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Avid S6L" list={`consoleTypes-output-${output.id}-analog`} />
                            <datalist id={`consoleTypes-output-${output.id}-analog`}>{getAllConsoleTypes().map((type, idx) => (<option key={idx} value={type} />))}</datalist>
                          </div>
                          <div><label className="block text-gray-300 text-sm mb-2">Console Output #</label><input type="text" value={editingOutput.sourceDetails?.consoleOutputNumber || ""} onChange={e => handleSourceDetailChange(output.id, "consoleOutputNumber", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., 8" /></div>
                        </>)}
                        {editingOutput.sourceType === "Digital Snake" && (<>
                          <div><label className="block text-gray-300 text-sm mb-2">Snake Type</label>
                            <input type="text" value={editingOutput.sourceDetails?.snakeType || ""} onChange={e => handleSourceDetailChange(output.id, "snakeType", e.target.value)} 
                             onKeyDown={e => handleCustomTypeKeyDown(e, output.id, FIELD_TYPES.OUTPUT_SRC_DIGITAL_SNAKE_TYPE, customSheetDigitalSnakeTypes, digitalSnakeTypes, setCustomSheetDigitalSnakeTypes, setUserCustomDigitalSnakeTypes, "snakeType")}
                             className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Yamaha Rio" list={`digitalSnakeTypes-output-${output.id}`} />
                            <datalist id={`digitalSnakeTypes-output-${output.id}`}>{getAllDigitalSnakeTypes().map((type, idx) => (<option key={idx} value={type} />))}</datalist>
                          </div>
                          <div><label className="block text-gray-300 text-sm mb-2">Output #</label><input type="text" value={editingOutput.sourceDetails?.outputNumber || ""} onChange={e => handleSourceDetailChange(output.id, "outputNumber", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., 8" /></div>
                        </>)}
                        {(editingOutput.sourceType === "Digital Snake" || editingOutput.sourceType === "Digital Network") && (<>
                          <div><label className="block text-gray-300 text-sm mb-2">Network Type</label>
                            <input type="text" value={editingOutput.sourceDetails?.networkType || ""} onChange={e => handleSourceDetailChange(output.id, "networkType", e.target.value)} 
                             onKeyDown={e => handleCustomTypeKeyDown(e, output.id, FIELD_TYPES.OUTPUT_SRC_NETWORK_TYPE, customSheetNetworkTypes, networkTypeOptions, setCustomSheetNetworkTypes, setUserCustomNetworkTypes, "networkType")}
                             className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Dante, AVB" list={`networkTypes-output-${output.id}`} />
                            <datalist id={`networkTypes-output-${output.id}`}>{getAllNetworkTypes().map((type, idx) => (<option key={idx} value={type} />))}</datalist>
                          </div>
                          <div><label className="block text-gray-300 text-sm mb-2">Network Patch #</label><input type="text" value={editingOutput.sourceDetails?.networkPatch || ""} onChange={e => handleSourceDetailChange(output.id, "networkPatch", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., 24" /></div>
                        </>)}
                        <div className="relative" ref={el => (destinationTypeDropdownRefs.current[output.id] = el)}>
                          <label className="block text-gray-300 text-sm mb-2">Destination Type</label>
                          <div className="relative">
                            <input type="text" value={editingOutput.destinationType} onChange={e => handleEditingOutputChange(output.id, "destinationType", e.target.value)} onFocus={() => toggleDestinationTypeOptions(output.id)} onKeyDown={e => handleDestinationTypeKeyDown(e, output.id)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Main Speakers" />
                            <button type="button" className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white" onClick={() => toggleDestinationTypeOptions(output.id)}><ChevronDown className="h-4 w-4" /></button>
                          </div>
                          {showDestinationTypeOptions[output.id] && (<div className="absolute z-[40] mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto" style={{ maxHeight: "200px", top: "100%", left: 0, right: 0, width: "100%", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }} onClick={e => e.stopPropagation()}>{getAllDestinationTypes().map((type, idx) => (<div key={idx} className="px-4 py-2 hover:bg-gray-600 cursor-pointer text-white" onClick={() => handleSelectDestinationType(output.id, type)}>{type}</div>))}{editingOutput.destinationType && !getAllDestinationTypes().includes(editingOutput.destinationType) && (<div className="px-4 py-2 hover:bg-gray-600 cursor-pointer text-white" onClick={() => handleSelectDestinationType(output.id, editingOutput.destinationType)}>Add "{editingOutput.destinationType}"</div>)}</div>)}
                        </div>
                        {editingOutput.destinationType && (<div><label className="block text-gray-300 text-sm mb-2">Destination Gear</label>
                          <input type="text" value={editingOutput.destinationGear || ""} onChange={e => handleEditingOutputChange(output.id, "destinationGear", e.target.value)} 
                           onKeyDown={e => handleCustomTypeKeyDown(e, output.id, FIELD_TYPES.OUTPUT_DESTINATION_GEAR, [], [], () => {}, setUserCustomDestinationGear, undefined, "destinationGear")}
                           className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder={`Enter ${editingOutput.destinationType} gear name`} list={`destinationGear-output-${output.id}`} />
                           <datalist id={`destinationGear-output-${output.id}`}>{getAllDestinationGearSuggestions().map((gear, idx) => (<option key={idx} value={gear} />))}</datalist>
                        </div>)}
                        <div className={`col-span-1 sm:col-span-2 ${editingOutput.destinationType ? "lg:col-span-3" : "lg:col-span-2"}`}><label className="block text-gray-300 text-sm mb-2">Notes</label><input type="text" value={editingOutput.notes} onChange={e => handleEditingOutputChange(output.id, "notes", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Additional notes" /></div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><p className="text-gray-400 text-xs sm:text-sm">Source Type</p><p className="text-white">{output.sourceType || "N/A"}</p>{renderSourceDetails(output)}{renderConsoleDetails(output)}{output.isStereo && (<div className="mt-1 flex items-center"><Link className="h-4 w-4 mr-1 text-indigo-400" /><span className="text-indigo-400 text-sm">{linkedChannel && `w/ Ch ${linkedChannel.channelNumber}`}</span></div>)}</div>
                        <div><p className="text-gray-400 text-xs sm:text-sm">Destination</p><p className="text-white">{output.destinationType || "N/A"}</p>{output.destinationGear && (<p className="text-gray-400 text-sm mt-1">{output.destinationGear}</p>)}</div>
                        {output.notes && (<div><p className="text-gray-400 text-xs sm:text-sm">Notes</p><p className="text-white">{output.notes}</p></div>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {outputs.length > 0 && (<div className="flex justify-center mt-8"><button onClick={handleAddOutput} className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors bg-gray-800 px-5 py-2.5 rounded-md hover:bg-gray-750"><PlusCircle className="h-5 w-5 mr-2" />Add Another Output</button></div>)}

      {showBulkAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6 sticky top-0 bg-gray-800 z-20 pb-2">Bulk Add Outputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div><label className="block text-gray-300 text-sm mb-2">Number of Outputs to Add</label><input type="number" value={bulkQuantity} min="0" onChange={e => setBulkQuantity(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div>
                <div><label className="block text-gray-300 text-sm mb-2">Starting Channel Number</label><input type="number" value={bulkStartChannel} min="0" onChange={e => setBulkStartChannel(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div>
                <div><label className="block text-gray-300 text-sm mb-2">Name Prefix (optional)</label><input type="text" value={bulkPrefix} onChange={e => setBulkPrefix(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Main, Monitor" /><p className="text-gray-400 text-xs mt-1">Names will be e.g., "Main 1", "Main 2", etc.</p></div>
                <div className="flex items-center mt-2"><input type="checkbox" id="bulkIsStereoOutput" checked={bulkIsStereo} onChange={e => setBulkIsStereo(e.target.checked)} className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded" /><label htmlFor="bulkIsStereoOutput" className="text-gray-300 text-sm ml-2 flex items-center"><Link className="h-4 w-4 mr-1 text-indigo-400" />Create as stereo pairs (L/R)</label></div><div className="text-gray-400 text-xs pl-7">Each consecutive pair of channels will be linked as stereo L/R</div>
                <div><label className="block text-gray-300 text-sm mb-2">Source Type</label><select value={bulkSourceType} onChange={e => handleBulkSourceTypeChange(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"><option value="">Select Source Type</option>{sourceTypeOptions.map((type, index) => (<option key={index} value={type}>{type}</option>))}</select></div>
              </div>
              <div className="space-y-4">
                {bulkSourceType === "Console Output" && (<><div><label className="block text-gray-300 text-sm mb-2">Console Type</label><input type="text" value={bulkSourceDetails.consoleType || ""} onChange={e => handleBulkSourceDetailChange("consoleType", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Avid S6L" list="bulkConsoleTypesOutputDatalist" /><datalist id="bulkConsoleTypesOutputDatalist">{getAllConsoleTypes().map((type, idx) => (<option key={`bulk-console-type-${idx}`} value={type} />))}</datalist></div><div><label className="block text-gray-300 text-sm mb-2">Output # (Starting)</label><input type="text" value={bulkSourceDetails.outputNumber || ""} onChange={e => handleBulkSourceDetailChange("outputNumber", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., 1 (will increment)" /></div></>)}
                {bulkSourceType === "Analog Snake" && (<><div><label className="block text-gray-300 text-sm mb-2">Snake Type</label><input type="text" value={bulkSourceDetails.snakeType || ""} onChange={e => handleBulkSourceDetailChange("snakeType", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Multicore" list="bulkAnalogSnakeTypesOutputDatalist" /><datalist id="bulkAnalogSnakeTypesOutputDatalist">{getAllAnalogSnakeTypes().map((type, idx) => (<option key={idx} value={type} />))}</datalist></div><div><label className="block text-gray-300 text-sm mb-2">Output # (Starting)</label><input type="text" value={bulkSourceDetails.outputNumber || ""} onChange={e => handleBulkSourceDetailChange("outputNumber", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., 1 (will increment)" /></div><div><label className="block text-gray-300 text-sm mb-2">Console Type</label><input type="text" value={bulkSourceDetails.consoleType || ""} onChange={e => handleBulkSourceDetailChange("consoleType", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Avid S6L" list="bulkConsoleTypesOutputDatalist" /><datalist id="bulkConsoleTypesOutputDatalist">{getAllConsoleTypes().map((type, idx) => (<option key={idx} value={type} />))}</datalist></div><div><label className="block text-gray-300 text-sm mb-2">Console Output # (Starting)</label><input type="text" value={bulkSourceDetails.consoleOutputNumber || ""} onChange={e => handleBulkSourceDetailChange("consoleOutputNumber", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., 1 (will increment)" /></div></>)}
                {bulkSourceType === "Digital Snake" && (<><div><label className="block text-gray-300 text-sm mb-2">Snake Type</label><input type="text" value={bulkSourceDetails.snakeType || ""} onChange={e => handleBulkSourceDetailChange("snakeType", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Yamaha Rio" list="bulkDigitalSnakeTypesOutputDatalist" /><datalist id="bulkDigitalSnakeTypesOutputDatalist">{getAllDigitalSnakeTypes().map((type, idx) => (<option key={idx} value={type} />))}</datalist></div><div><label className="block text-gray-300 text-sm mb-2">Output # (Starting)</label><input type="text" value={bulkSourceDetails.outputNumber || ""} onChange={e => handleBulkSourceDetailChange("outputNumber", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., 1 (will increment)" /></div></>)}
                {(bulkSourceType === "Digital Snake" || bulkSourceType === "Digital Network") && (<><div><label className="block text-gray-300 text-sm mb-2">Network Type</label><input type="text" value={bulkSourceDetails.networkType || ""} onChange={e => handleBulkSourceDetailChange("networkType", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., Dante, AVB" list="bulkNetworkTypesOutputDatalist" /><datalist id="bulkNetworkTypesOutputDatalist">{getAllNetworkTypes().map((type, idx) => (<option key={idx} value={type} />))}</datalist></div><div><label className="block text-gray-300 text-sm mb-2">Network Patch # (Starting)</label><input type="text" value={bulkSourceDetails.networkPatch || ""} onChange={e => handleBulkSourceDetailChange("networkPatch", e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g., 1 (will increment)" /></div></>)}
                <div><label className="block text-gray-300 text-sm mb-2">Destination Type</label><select value={bulkDestinationType} onChange={e => setBulkDestinationType(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"><option value="">Select Destination Type</option>{getAllDestinationTypes().map((type, index) => (<option key={index} value={type}>{type}</option>))}</select></div>
                {bulkDestinationType && (<div><label className="block text-gray-300 text-sm mb-2">Destination Gear</label><input type="text" value={bulkDestinationGear} onChange={e => setBulkDestinationGear(e.target.value)} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder={`Enter ${bulkDestinationType} gear name`} /></div>)}
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end sticky bottom-0 bg-gray-800 z-20"><button onClick={() => setShowBulkAddModal(false)} className="px-5 py-2.5 text-gray-300 hover:text-white transition-all mr-4">Cancel</button><button onClick={handleBulkAdd} className={`bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors ${isBulkAddDisabled ? "opacity-50 cursor-not-allowed" : ""}`} disabled={isBulkAddDisabled}>Add {isBulkAddDisabled ? "" : parsedBulkQuantity}{" "}{parsedBulkQuantity === 1 ? "Output" : "Outputs"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PatchSheetOutputs;
