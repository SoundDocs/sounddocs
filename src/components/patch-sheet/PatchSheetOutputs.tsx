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
  stereoChannelNumber?: string; // For linking to another channel
}

interface PatchSheetOutputsProps {
  outputs: OutputChannel[];
  updateOutputs: (outputs: OutputChannel[]) => void;
}

const PatchSheetOutputs: React.FC<PatchSheetOutputsProps> = ({ outputs, updateOutputs }) => {
  const [showDestinationTypeOptions, setShowDestinationTypeOptions] = useState<{
    [key: string]: boolean;
  }>({});
  const [editModeOutputs, setEditModeOutputs] = useState<{ [key: string]: boolean }>({});
  const [editingOutputs, setEditingOutputs] = useState<{ [key: string]: OutputChannel }>({});
  const [isMobile, setIsMobile] = useState(false);

  // Bulk add state
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState<number | string>(8); // Allow string for empty input
  const [bulkStartChannel, setBulkStartChannel] = useState<number | string>(1); // Allow string for empty input
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkSourceType, setBulkSourceType] = useState("");
  const [bulkDestinationType, setBulkDestinationType] = useState("");
  const [bulkDestinationGear, setBulkDestinationGear] = useState("");
  const [bulkSourceDetails, setBulkSourceDetails] = useState<{
    outputNumber?: string;
    snakeType?: string;
    networkType?: string;
    networkPatch?: string;
    consoleType?: string;
    consoleOutputNumber?: string;
  }>({});
  const [bulkIsStereo, setBulkIsStereo] = useState(false);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Static source type options
  const sourceTypeOptions = ["Console Output", "Analog Snake", "Digital Snake", "Digital Network"];

  // Default destination type options
  const destinationTypeOptions = [
    "Main Speakers",
    "Monitors",
    "IEM System",
    "Recording Device",
    "Broadcast Feed",
    "Stage Fill",
    "Delay Speakers",
    "Effects Processor",
  ];

  // Default analog snake types
  const analogSnakeTypes = ["Multicore", "XLR Harness", "Sub Snake"];

  // Default digital snake types
  const digitalSnakeTypes = [
    "Yamaha Rio",
    "Allen & Heath DX168",
    "Behringer S16",
    "Midas DL16",
    "PreSonus NSB",
  ];

  // Default network type options
  const networkTypeOptions = ["Dante", "AVB", "MADI", "AES50", "Ravenna", "AES67"];

  // Default console types
  const consoleTypeOptions = [
    "Avid S6L",
    "Avid Profile",
    "Avid SC48",
    "DiGiCo SD12",
    "DiGiCo SD10",
    "DiGiCo SD5",
    "Yamaha CL5",
    "Yamaha QL5",
    "Allen & Heath dLive",
    "Allen & Heath SQ7",
    "Midas PRO X",
    "Midas M32",
    "Behringer X32",
  ];

  // Store custom destination types
  const [customDestinationTypes, setCustomDestinationTypes] = useState<string[]>([]);
  const [customAnalogSnakeTypes, setCustomAnalogSnakeTypes] = useState<string[]>([]);
  const [customDigitalSnakeTypes, setCustomDigitalSnakeTypes] = useState<string[]>([]);
  const [customNetworkTypes, setCustomNetworkTypes] = useState<string[]>([]);
  const [customConsoleTypes, setCustomConsoleTypes] = useState<string[]>([]);

  const destinationTypeDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Initialize all outputs to edit mode by default
  useEffect(() => {
    const initialEditMode: { [key: string]: boolean } = {};
    outputs.forEach((output) => {
      initialEditMode[output.id] = true;
      setEditingOutputs((prev) => ({
        ...prev,
        [output.id]: { ...output },
      }));
    });
    setEditModeOutputs(initialEditMode);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close destination type dropdowns
      Object.keys(destinationTypeDropdownRefs.current).forEach((id) => {
        if (
          destinationTypeDropdownRefs.current[id] &&
          !destinationTypeDropdownRefs.current[id]?.contains(event.target as Node)
        ) {
          setShowDestinationTypeOptions((prev) => ({ ...prev, [id]: false }));
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load custom types from outputs on initial load
  useEffect(() => {
    const destinationTypesSet = new Set<string>();
    const analogSnakeTypesSet = new Set<string>();
    const digitalSnakeTypesSet = new Set<string>();
    const networkTypesSet = new Set<string>();
    const consoleTypesSet = new Set<string>();

    outputs.forEach((output) => {
      // Collect custom destination types
      if (output.destinationType && !destinationTypeOptions.includes(output.destinationType)) {
        destinationTypesSet.add(output.destinationType);
      }

      // Collect custom source details
      if (output.sourceDetails) {
        if (
          output.sourceType === "Analog Snake" &&
          output.sourceDetails.snakeType &&
          !analogSnakeTypes.includes(output.sourceDetails.snakeType)
        ) {
          analogSnakeTypesSet.add(output.sourceDetails.snakeType);
        }

        if (
          output.sourceType === "Digital Snake" &&
          output.sourceDetails.snakeType &&
          !digitalSnakeTypes.includes(output.sourceDetails.snakeType)
        ) {
          digitalSnakeTypesSet.add(output.sourceDetails.snakeType);
        }

        if (
          output.sourceDetails.networkType &&
          !networkTypeOptions.includes(output.sourceDetails.networkType)
        ) {
          networkTypesSet.add(output.sourceDetails.networkType);
        }

        if (
          output.sourceDetails.consoleType &&
          !consoleTypeOptions.includes(output.sourceDetails.consoleType)
        ) {
          consoleTypesSet.add(output.sourceDetails.consoleType);
        }
      }
    });

    // Convert Sets to arrays and update state
    setCustomDestinationTypes(Array.from(destinationTypesSet));
    setCustomAnalogSnakeTypes(Array.from(analogSnakeTypesSet));
    setCustomDigitalSnakeTypes(Array.from(digitalSnakeTypesSet));
    setCustomNetworkTypes(Array.from(networkTypesSet));
    setCustomConsoleTypes(Array.from(consoleTypesSet));
  }, []);

  // Update editing outputs when actual outputs change
  useEffect(() => {
    const newEditingOutputs: { [key: string]: OutputChannel } = {};

    // Add new outputs or update existing ones
    outputs.forEach((output) => {
      newEditingOutputs[output.id] = editingOutputs[output.id]
        ? { ...editingOutputs[output.id] }
        : { ...output };
    });

    setEditingOutputs(newEditingOutputs);

    // Initialize edit mode for new outputs
    outputs.forEach((output) => {
      if (editModeOutputs[output.id] === undefined) {
        setEditModeOutputs((prev) => ({
          ...prev,
          [output.id]: true,
        }));
      }
    });
  }, [outputs]);

  // Function to update parent component's outputs array
  const updateParentOutputs = () => {
    const updatedOutputs = outputs.map((output) => {
      // If the output is in edit mode, use the editing version
      if (editModeOutputs[output.id]) {
        return { ...editingOutputs[output.id] };
      }
      return output;
    });
    updateOutputs(updatedOutputs);
  };

  // Effect to update parent component's outputs when editing outputs change
  useEffect(() => {
    // Debounce the update to avoid too many rerenders
    const timeoutId = setTimeout(() => {
      updateParentOutputs();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [editingOutputs]);

  const handleAddOutput = () => {
    const nextChannelNumber =
      outputs.length > 0
        ? Math.max(...outputs.map((output) => parseInt(output.channelNumber, 10) || 0)) + 1
        : 1;

    const newOutput: OutputChannel = {
      id: `output-${Date.now()}`, // Generate a unique ID
      channelNumber: `${nextChannelNumber}`,
      name: "",
      sourceType: "",
      sourceDetails: {},
      destinationType: "",
      destinationGear: "",
      notes: "",
      isStereo: false,
    };

    // Update parent component directly
    updateOutputs([...outputs, newOutput]);

    // Set new output to edit mode
    setEditModeOutputs((prev) => ({
      ...prev,
      [newOutput.id]: true,
    }));

    // Add to editing outputs
    setEditingOutputs((prev) => ({
      ...prev,
      [newOutput.id]: { ...newOutput },
    }));
  };

  const handleDeleteOutput = (id: string) => {
    // Check if this is a stereo channel and update its linked channel
    const outputToDelete = outputs.find((output) => output.id === id);
    const updatedOutputs = outputs.filter((output) => output.id !== id);

    // If this is a stereo channel with a link, update the linked channel
    if (outputToDelete?.isStereo && outputToDelete?.stereoChannelNumber) {
      const linkedChannelIndex = updatedOutputs.findIndex(
        (output) => output.channelNumber === outputToDelete.stereoChannelNumber,
      );

      if (linkedChannelIndex !== -1) {
        updatedOutputs[linkedChannelIndex] = {
          ...updatedOutputs[linkedChannelIndex],
          isStereo: false,
          stereoChannelNumber: undefined,
        };
      }
    }

    // If any other channel is linked to this one, update it
    updatedOutputs.forEach((output, index) => {
      if (output.stereoChannelNumber === outputToDelete?.channelNumber) {
        updatedOutputs[index] = {
          ...updatedOutputs[index],
          isStereo: false,
          stereoChannelNumber: undefined,
        };
      }
    });

    updateOutputs(updatedOutputs);

    // Remove from edit mode tracking
    setEditModeOutputs((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Remove from editing outputs
    setEditingOutputs((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleEditOutput = (id: string) => {
    // Find the output in the main outputs array
    const output = outputs.find((output) => output.id === id);
    if (!output) return;

    // Set the editing output to match the current output state
    setEditingOutputs((prev) => ({
      ...prev,
      [id]: { ...output },
    }));

    // Set to edit mode
    setEditModeOutputs((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  const handleSaveOutput = (id: string) => {
    const updatedOutput = editingOutputs[id];
    if (!updatedOutput) return;

    // Handle stereo linking
    if (updatedOutput.isStereo && updatedOutput.stereoChannelNumber) {
      // Find the linked channel
      const linkedChannelIndex = outputs.findIndex(
        (output) => output.channelNumber === updatedOutput.stereoChannelNumber && output.id !== id,
      );

      if (linkedChannelIndex !== -1) {
        // Update the linked channel to link back to this one
        const linkedOutput = { ...outputs[linkedChannelIndex] };
        linkedOutput.isStereo = true;
        linkedOutput.stereoChannelNumber = updatedOutput.channelNumber;

        // Update the outputs array with the linked channel
        const updatedOutputs = [...outputs];
        updatedOutputs[linkedChannelIndex] = linkedOutput;

        // Also update in editing outputs if it's in edit mode
        if (editModeOutputs[linkedOutput.id]) {
          setEditingOutputs((prev) => ({
            ...prev,
            [linkedOutput.id]: linkedOutput,
          }));
        }

        updateOutputs(updatedOutputs);
      }
    } else if (!updatedOutput.isStereo) {
      // If stereo is turned off, find any channels that were linked to this one and update them
      const updatedOutputs = outputs.map((output) => {
        if (output.stereoChannelNumber === updatedOutput.channelNumber) {
          return {
            ...output,
            isStereo: false,
            stereoChannelNumber: undefined,
          };
        }
        return output;
      });

      updateOutputs(updatedOutputs);
    }

    // Update the specific output
    const finalUpdatedOutputs = outputs.map((output) =>
      output.id === id ? { ...updatedOutput } : output,
    );

    updateOutputs(finalUpdatedOutputs);

    // Exit edit mode
    setEditModeOutputs((prev) => ({
      ...prev,
      [id]: false,
    }));
  };

  const handleEditingOutputChange = (id: string, field: keyof OutputChannel, value: any) => {
    const updatedOutput = { ...editingOutputs[id] };

    // Update the field
    updatedOutput[field] = value;

    // Reset source details when changing source type
    if (field === "sourceType") {
      updatedOutput.sourceDetails = {};
    }

    // If stereo is being toggled off, clear the stereo channel number
    if (field === "isStereo" && value === false) {
      updatedOutput.stereoChannelNumber = undefined;
    }

    // Update the editing outputs
    setEditingOutputs((prev) => ({
      ...prev,
      [id]: updatedOutput,
    }));
  };

  const handleSourceDetailChange = (id: string, detailKey: string, value: string) => {
    const updatedOutput = { ...editingOutputs[id] };

    // Make sure sourceDetails exists
    if (!updatedOutput.sourceDetails) {
      updatedOutput.sourceDetails = {};
    }

    // Update the detail
    updatedOutput.sourceDetails[detailKey as keyof typeof updatedOutput.sourceDetails] = value;

    // Update the editing outputs
    setEditingOutputs((prev) => ({
      ...prev,
      [id]: updatedOutput,
    }));
  };

  // Get a list of available channels for stereo linking
  const getAvailableChannelsForStereo = (
    currentChannelId: string,
    currentChannelNumber: string,
  ) => {
    return outputs
      .filter(
        (output) =>
          // Don't show the current channel
          output.id !== currentChannelId &&
          // Don't show channels that are already linked to another channel (except the current one)
          (!output.isStereo || output.stereoChannelNumber === currentChannelNumber),
      )
      .map((output) => ({
        channelNumber: output.channelNumber,
        name: output.name || `Channel ${output.channelNumber}`,
      }));
  };

  // Handle selection of destination type
  const handleSelectDestinationType = (id: string, value: string) => {
    handleEditingOutputChange(id, "destinationType", value);

    // Only add to custom destination types if it doesn't exist in default options
    if (
      value.trim() &&
      !destinationTypeOptions.includes(value) &&
      !customDestinationTypes.includes(value)
    ) {
      setCustomDestinationTypes((prev) => [...prev, value]);
    }

    // Close the dropdown
    setShowDestinationTypeOptions((prev) => ({ ...prev, [id]: false }));
  };

  // Handle key press for destination type input
  const handleDestinationTypeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value;

      if (!value.trim()) return;

      handleSelectDestinationType(id, value);
    }
  };

  // Handle adding custom snake or network type
  const handleCustomTypeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: string,
    type: string,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value;

      if (!value.trim()) return;

      // Handle different types of custom values
      if (type === "networkType") {
        handleSourceDetailChange(id, "networkType", value);
        if (!networkTypeOptions.includes(value) && !customNetworkTypes.includes(value)) {
          setCustomNetworkTypes((prev) => [...prev, value]);
        }
      } else if (type === "analogSnakeType") {
        handleSourceDetailChange(id, "snakeType", value);
        if (!analogSnakeTypes.includes(value) && !customAnalogSnakeTypes.includes(value)) {
          setCustomAnalogSnakeTypes((prev) => [...prev, value]);
        }
      } else if (type === "digitalSnakeType") {
        handleSourceDetailChange(id, "snakeType", value);
        if (!digitalSnakeTypes.includes(value) && !customDigitalSnakeTypes.includes(value)) {
          setCustomDigitalSnakeTypes((prev) => [...prev, value]);
        }
      } else if (type === "consoleType") {
        handleSourceDetailChange(id, "consoleType", value);
        if (!consoleTypeOptions.includes(value) && !customConsoleTypes.includes(value)) {
          setCustomConsoleTypes((prev) => [...prev, value]);
        }
      }
    }
  };

  const toggleDestinationTypeOptions = (id: string) => {
    // Toggle this dropdown
    setShowDestinationTypeOptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Get all destination types combining default and custom options
  const getAllDestinationTypes = () => {
    return [...destinationTypeOptions, ...customDestinationTypes];
  };

  // Get all analog snake types combining default and custom options
  const getAllAnalogSnakeTypes = () => {
    return [...analogSnakeTypes, ...customAnalogSnakeTypes];
  };

  // Get all digital snake types combining default and custom options
  const getAllDigitalSnakeTypes = () => {
    return [...digitalSnakeTypes, ...customDigitalSnakeTypes];
  };

  // Get all network types combining default and custom options
  const getAllNetworkTypes = () => {
    return [...networkTypeOptions, ...customNetworkTypes];
  };

  // Get all console types combining default and custom options
  const getAllConsoleTypes = () => {
    return [...consoleTypeOptions, ...customConsoleTypes];
  };

  // Function to render source details in collapsed view
  const renderSourceDetails = (output: OutputChannel) => {
    if (!output.sourceType || !output.sourceDetails) return null;

    switch (output.sourceType) {
      case "Console Output":
        return (
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-400">
              {output.sourceDetails.consoleType ? `${output.sourceDetails.consoleType} - ` : ""}
              {output.sourceDetails.outputNumber
                ? `Output #${output.sourceDetails.outputNumber}`
                : ""}
            </span>
          </div>
        );

      case "Analog Snake":
        return (
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-400">
              {output.sourceDetails.snakeType || ""}
              {output.sourceDetails.outputNumber
                ? ` - Output #${output.sourceDetails.outputNumber}`
                : ""}
            </span>
          </div>
        );

      case "Digital Snake":
        return (
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-400">
              {output.sourceDetails.snakeType || ""}
              {output.sourceDetails.outputNumber
                ? ` - Output #${output.sourceDetails.outputNumber}`
                : ""}
              {output.sourceDetails.networkType ? ` - ${output.sourceDetails.networkType}` : ""}
              {output.sourceDetails.networkPatch
                ? ` - Patch #${output.sourceDetails.networkPatch}`
                : ""}
            </span>
          </div>
        );

      case "Digital Network":
        return (
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-400">
              {output.sourceDetails.networkType || ""}
              {output.sourceDetails.networkPatch
                ? ` - Patch #${output.sourceDetails.networkPatch}`
                : ""}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  // Render console details for analog snake outputs
  const renderConsoleDetails = (output: OutputChannel) => {
    if (
      output.sourceType === "Analog Snake" &&
      (output.sourceDetails?.consoleType || output.sourceDetails?.consoleOutputNumber)
    ) {
      return (
        <div className="mt-1 text-gray-400 text-sm">
          <span>→ {output.sourceDetails?.consoleType || "Console"}</span>
          {output.sourceDetails?.consoleOutputNumber && (
            <span> - Output #{output.sourceDetails.consoleOutputNumber}</span>
          )}
        </div>
      );
    }
    return null;
  };

  // Handle opening the bulk add modal
  const openBulkAddModal = () => {
    const nextChannelNumber =
      outputs.length > 0
        ? Math.max(...outputs.map((output) => parseInt(output.channelNumber, 10) || 0)) + 1
        : 1;
    setBulkStartChannel(nextChannelNumber);
    setShowBulkAddModal(true);
  };

  // Handle bulk add outputs
  const handleBulkAdd = () => {
    const quantity = parseInt(String(bulkQuantity), 10);
    const startNum = parseInt(String(bulkStartChannel), 10);

    if (isNaN(quantity) || quantity <= 0 || isNaN(startNum) || startNum <= 0) {
      console.error("Invalid quantity or starting channel number");
      return;
    }

    const newOutputs: OutputChannel[] = [];

    for (let i = 0; i < quantity; i++) {
      const channelNum = startNum + i;
      const nameSuffixNumber = bulkIsStereo ? Math.floor(i / 2) + 1 : i + 1;
      
      let currentName: string;
      if (bulkPrefix) {
        currentName = `${bulkPrefix} ${nameSuffixNumber}`;
      } else {
        currentName = `Output ${channelNum}`;
      }

      let consoleOutputNumber = bulkSourceDetails.consoleOutputNumber;
      let networkPatch = bulkSourceDetails.networkPatch;
      let outputNumber = bulkSourceDetails.outputNumber;

      if (consoleOutputNumber && !isNaN(parseInt(consoleOutputNumber))) {
        consoleOutputNumber = (parseInt(consoleOutputNumber) + i).toString();
      }
      if (networkPatch && !isNaN(parseInt(networkPatch))) {
        networkPatch = (parseInt(networkPatch) + i).toString();
      }
      if (outputNumber && !isNaN(parseInt(outputNumber))) {
        outputNumber = (parseInt(outputNumber) + i).toString();
      }

      const sourceDetails = {
        ...bulkSourceDetails,
        consoleOutputNumber,
        networkPatch,
        outputNumber,
      };
      
      let isStereo = bulkIsStereo;
      let stereoChannelNumber = undefined;

      if (bulkIsStereo) {
        if (i % 2 === 0 && i + 1 < quantity) { // Left channel of a pair
          if (bulkPrefix) currentName += " L";
          stereoChannelNumber = (startNum + i + 1).toString();
        } else if (i % 2 === 1) { // Right channel of a pair
          if (bulkPrefix) currentName += " R";
          stereoChannelNumber = (startNum + i - 1).toString();
        } else { // Last channel if quantity is odd, treat as mono for naming
          isStereo = false;
        }
      }

      newOutputs.push({
        id: `output-${Date.now()}-${i}`,
        channelNumber: channelNum.toString(),
        name: currentName,
        sourceType: bulkSourceType,
        sourceDetails,
        destinationType: bulkDestinationType,
        destinationGear: bulkDestinationGear,
        notes: "",
        isStereo,
        stereoChannelNumber,
      });
    }

    updateOutputs([...outputs, ...newOutputs]);

    const newEditModeOutputs = { ...editModeOutputs };
    const newEditingOutputs = { ...editingOutputs };
    newOutputs.forEach((output) => {
      newEditModeOutputs[output.id] = true;
      newEditingOutputs[output.id] = { ...output };
    });
    setEditModeOutputs(newEditModeOutputs);
    setEditingOutputs(newEditingOutputs);

    setShowBulkAddModal(false);
    setBulkQuantity(8);
    setBulkStartChannel(1); // Will be recalculated next time modal opens
    setBulkPrefix("");
    setBulkSourceType("");
    setBulkDestinationType("");
    setBulkDestinationGear("");
    setBulkSourceDetails({});
    setBulkIsStereo(false);
  };

  // Handle bulk source type change
  const handleBulkSourceTypeChange = (value: string) => {
    setBulkSourceType(value);
    // Reset source details when changing source type
    setBulkSourceDetails({});
  };

  // Handle bulk source detail change
  const handleBulkSourceDetailChange = (detailKey: string, value: string) => {
    setBulkSourceDetails((prev) => ({
      ...prev,
      [detailKey]: value,
    }));
  };

  const parsedBulkQuantity = parseInt(String(bulkQuantity), 10);
  const isBulkAddDisabled = isNaN(parsedBulkQuantity) || parsedBulkQuantity <= 0 || !bulkSourceType;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Output List</h2>
          <p className="text-gray-400 text-sm mt-1">Define your audio outputs and routing</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={openBulkAddModal}
            className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Bulk Add
          </button>
          <button
            onClick={handleAddOutput}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm sm:text-base"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Output</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {outputs.length === 0 ? (
        <div className="bg-gray-700 rounded-lg p-6 md:p-10 text-center my-8">
          <p className="text-gray-300 mb-6 text-lg">No outputs have been added yet.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={openBulkAddModal}
              className="inline-flex items-center bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Bulk Add Outputs
            </button>
            <button
              onClick={handleAddOutput}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Add Single Output
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 overflow-x-auto">
          <div className="min-w-[800px] md:min-w-0">
            {" "}
            {/* Minimum width container */}
            {outputs.map((output) => {
              const editingOutput = editingOutputs[output.id] || output;
              const isEditMode = editModeOutputs[output.id];
              const availableStereoChannels = getAvailableChannelsForStereo(
                output.id,
                output.channelNumber,
              );

              // Find if this output has a linked stereo channel
              const linkedChannel = outputs.find(
                (otherOutput) =>
                  otherOutput.channelNumber === output.stereoChannelNumber && otherOutput.isStereo,
              );

              return (
                <div
                  key={output.id}
                  className={`bg-gray-800 border border-gray-700 rounded-lg overflow-visible hover:border-gray-600 transition-colors ${output.isStereo ? "border-l-4 border-l-indigo-500" : ""}`}
                >
                  <div className="bg-gray-750 py-3 px-4 sm:px-6 flex justify-between items-center">
                    <div className="flex items-center space-x-2 sm:space-x-4 overflow-hidden">
                      <div className="font-medium text-white flex items-center flex-shrink-0">
                        {isEditMode ? (
                          <>
                            <span className="hidden sm:inline">Channel</span>
                            <span className="sm:hidden">Ch</span>
                            <input
                              type="text"
                              value={editingOutput.channelNumber}
                              onChange={(e) =>
                                handleEditingOutputChange(
                                  output.id,
                                  "channelNumber",
                                  e.target.value,
                                )
                              }
                              className="ml-1 sm:ml-2 bg-gray-700 text-white border border-gray-600 rounded-md px-1 sm:px-2 py-1 w-10 sm:w-16 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span>Ch {output.channelNumber}:</span>
                          </>
                        )}
                      </div>
                      {isEditMode ? (
                        <>
                          <div className="hidden sm:block h-5 w-px bg-gray-600"></div>
                          <input
                            type="text"
                            value={editingOutput.name}
                            onChange={(e) =>
                              handleEditingOutputChange(output.id, "name", e.target.value)
                            }
                            className="bg-gray-700 text-white border border-gray-600 rounded-md px-2 sm:px-3 py-1 w-full max-w-[140px] sm:max-w-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                            placeholder="Name/Label"
                          />
                        </>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-white font-medium truncate mr-2">
                            {output.name || "Unnamed Output"}
                          </span>
                          {output.isStereo && (
                            <div className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center">
                              <Link2 className="h-3 w-3 mr-1" />
                              {output.stereoChannelNumber ? (
                                <span>Stereo w/ Ch {output.stereoChannelNumber}</span>
                              ) : (
                                <span>Stereo</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      {isEditMode ? (
                        <>
                          <button
                            onClick={() => handleSaveOutput(output.id)}
                            className="p-1 sm:p-2 text-indigo-400 hover:text-indigo-300 transition-colors hover:bg-gray-700 rounded-full"
                            title="Save output"
                          >
                            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOutput(output.id)}
                            className="p-1 sm:p-2 text-red-400 hover:text-red-500 transition-colors hover:bg-gray-700 rounded-full"
                            title="Delete output"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditOutput(output.id)}
                            className="p-1 sm:p-2 text-indigo-400 hover:text-indigo-300 transition-colors hover:bg-gray-700 rounded-full"
                            title="Edit output"
                          >
                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOutput(output.id)}
                            className="p-1 sm:p-2 text-red-400 hover:text-red-500 transition-colors hover:bg-gray-700 rounded-full"
                            title="Delete output"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditMode ? (
                    <div className="p-4 md:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">Source Type</label>
                          <select
                            value={editingOutput.sourceType}
                            onChange={(e) =>
                              handleEditingOutputChange(output.id, "sourceType", e.target.value)
                            }
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="">Select Source Type</option>
                            {sourceTypeOptions.map((type, index) => (
                              <option key={index} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Stereo configuration */}
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="block text-gray-300 text-sm">Stereo Channel</label>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editingOutput.isStereo}
                                onChange={(e) =>
                                  handleEditingOutputChange(output.id, "isStereo", e.target.checked)
                                }
                                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded"
                              />
                              <span className="text-gray-300 text-sm">Stereo</span>
                            </div>
                          </div>

                          {editingOutput.isStereo ? (
                            <div className="mt-2">
                              <select
                                value={editingOutput.stereoChannelNumber || ""}
                                onChange={(e) =>
                                  handleEditingOutputChange(
                                    output.id,
                                    "stereoChannelNumber",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              >
                                <option value="">Link with Channel...</option>
                                {availableStereoChannels.map((channel) => (
                                  <option key={channel.channelNumber} value={channel.channelNumber}>
                                    Ch {channel.channelNumber}: {channel.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="mt-2 bg-gray-700 p-3 rounded-md border border-gray-600 text-white">
                              Mono
                            </div>
                          )}
                        </div>

                        {/* Additional fields based on source type */}
                        {editingOutput.sourceType === "Console Output" && (
                          <>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">
                                Console Type
                              </label>
                              <input
                                type="text"
                                value={editingOutput.sourceDetails?.consoleType || ""}
                                onChange={(e) =>
                                  handleSourceDetailChange(output.id, "consoleType", e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleCustomTypeKeyDown(e, output.id, "consoleType")
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Avid S6L, DiGiCo SD12"
                                list={`consoleTypes-${output.id}`}
                              />
                              <datalist id={`consoleTypes-${output.id}`}>
                                {getAllConsoleTypes().map((type, idx) => (
                                  <option key={idx} value={type} />
                                ))}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">Output #</label>
                              <input
                                type="text"
                                value={editingOutput.sourceDetails?.outputNumber || ""}
                                onChange={(e) =>
                                  handleSourceDetailChange(
                                    output.id,
                                    "outputNumber",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., 12"
                              />
                            </div>
                          </>
                        )}

                        {editingOutput.sourceType === "Analog Snake" && (
                          <>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">Snake Type</label>
                              <input
                                type="text"
                                value={editingOutput.sourceDetails?.snakeType || ""}
                                onChange={(e) =>
                                  handleSourceDetailChange(output.id, "snakeType", e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleCustomTypeKeyDown(e, output.id, "analogSnakeType")
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Multicore, XLR Harness"
                                list={`analogSnakeTypes-${output.id}`}
                              />
                              <datalist id={`analogSnakeTypes-${output.id}`}>
                                {getAllAnalogSnakeTypes().map((type, idx) => (
                                  <option key={idx} value={type} />
                                ))}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">Output #</label>
                              <input
                                type="text"
                                value={editingOutput.sourceDetails?.outputNumber || ""}
                                onChange={(e) =>
                                  handleSourceDetailChange(
                                    output.id,
                                    "outputNumber",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., 12"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">
                                Console Type
                              </label>
                              <input
                                type="text"
                                value={editingOutput.sourceDetails?.consoleType || ""}
                                onChange={(e) =>
                                  handleSourceDetailChange(output.id, "consoleType", e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleCustomTypeKeyDown(e, output.id, "consoleType")
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Avid S6L, DiGiCo SD12"
                                list={`consoleTypes-${output.id}`}
                              />
                              <datalist id={`consoleTypes-${output.id}`}>
                                {getAllConsoleTypes().map((type, idx) => (
                                  <option key={idx} value={type} />
                                ))}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">
                                Console Output #
                              </label>
                              <input
                                type="text"
                                value={editingOutput.sourceDetails?.consoleOutputNumber || ""}
                                onChange={(e) =>
                                  handleSourceDetailChange(
                                    output.id,
                                    "consoleOutputNumber",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., 8"
                              />
                            </div>
                          </>
                        )}

                        {editingOutput.sourceType === "Digital Snake" && (
                          <>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">Snake Type</label>
                              <input
                                type="text"
                                value={editingOutput.sourceDetails?.snakeType || ""}
                                onChange={(e) =>
                                  handleSourceDetailChange(output.id, "snakeType", e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleCustomTypeKeyDown(e, output.id, "digitalSnakeType")
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Yamaha Rio, DL16"
                                list={`digitalSnakeTypes-${output.id}`}
                              />
                              <datalist id={`digitalSnakeTypes-${output.id}`}>
                                {getAllDigitalSnakeTypes().map((type, idx) => (
                                  <option key={idx} value={type} />
                                ))}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">Output #</label>
                              <input
                                type="text"
                                value={editingOutput.sourceDetails?.outputNumber || ""}
                                onChange={(e) =>
                                  handleSourceDetailChange(
                                    output.id,
                                    "outputNumber",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., 8"
                              />
                            </div>
                          </>
                        )}

                        {(editingOutput.sourceType === "Digital Snake" ||
                          editingOutput.sourceType === "Digital Network") && (
                          <>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">
                                Network Type
                              </label>
                              <input
                                type="text"
                                value={editingOutput.sourceDetails?.networkType || ""}
                                onChange={(e) =>
                                  handleSourceDetailChange(output.id, "networkType", e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleCustomTypeKeyDown(e, output.id, "networkType")
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Dante, AVB"
                                list={`networkTypes-${output.id}`}
                              />
                              <datalist id={`networkTypes-${output.id}`}>
                                {getAllNetworkTypes().map((type, idx) => (
                                  <option key={idx} value={type} />
                                ))}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">
                                Network Patch #
                              </label>
                              <input
                                type="text"
                                value={editingOutput.sourceDetails?.networkPatch || ""}
                                onChange={(e) =>
                                  handleSourceDetailChange(
                                    output.id,
                                    "networkPatch",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., 24"
                              />
                            </div>
                          </>
                        )}

                        <div
                          className="relative"
                          ref={(el) => (destinationTypeDropdownRefs.current[output.id] = el)}
                        >
                          <label className="block text-gray-300 text-sm mb-2">
                            Destination Type
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={editingOutput.destinationType}
                              onChange={(e) =>
                                handleEditingOutputChange(
                                  output.id,
                                  "destinationType",
                                  e.target.value,
                                )
                              }
                              onFocus={() => toggleDestinationTypeOptions(output.id)}
                              onKeyDown={(e) => handleDestinationTypeKeyDown(e, output.id)}
                              className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="e.g., Main Speakers, Monitors"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
                              onClick={() => toggleDestinationTypeOptions(output.id)}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Destination Type Options dropdown */}
                          {showDestinationTypeOptions[output.id] && (
                            <div
                              className="absolute z-[40] mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto"
                              style={{
                                maxHeight: "200px",
                                top: "100%",
                                left: 0,
                                right: 0,
                                width: "100%",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {getAllDestinationTypes().map((type, idx) => (
                                <div
                                  key={idx}
                                  className="px-4 py-2 hover:bg-gray-600 cursor-pointer text-white"
                                  onClick={() => handleSelectDestinationType(output.id, type)}
                                >
                                  {type}
                                </div>
                              ))}
                              {editingOutput.destinationType &&
                                !getAllDestinationTypes().includes(
                                  editingOutput.destinationType,
                                ) && (
                                  <div
                                    className="px-4 py-2 hover:bg-gray-600 cursor-pointer text-white"
                                    onClick={() =>
                                      handleSelectDestinationType(
                                        output.id,
                                        editingOutput.destinationType,
                                      )
                                    }
                                  >
                                    Add "{editingOutput.destinationType}"
                                  </div>
                                )}
                            </div>
                          )}
                        </div>

                        {/* Destination Gear field - shown when destination type is set */}
                        {editingOutput.destinationType && (
                          <div>
                            <label className="block text-gray-300 text-sm mb-2">
                              Destination Gear
                            </label>
                            <input
                              type="text"
                              value={editingOutput.destinationGear || ""}
                              onChange={(e) =>
                                handleEditingOutputChange(
                                  output.id,
                                  "destinationGear",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder={`Enter ${editingOutput.destinationType} gear name`}
                            />
                          </div>
                        )}

                        <div
                          className={`col-span-1 sm:col-span-2 ${editingOutput.destinationType ? "lg:col-span-3" : "lg:col-span-2"}`}
                        >
                          <label className="block text-gray-300 text-sm mb-2">Notes</label>
                          <input
                            type="text"
                            value={editingOutput.notes}
                            onChange={(e) =>
                              handleEditingOutputChange(output.id, "notes", e.target.value)
                            }
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Additional notes about this output"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Collapsed view
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-gray-400 text-xs sm:text-sm">Source Type</p>
                          <p className="text-white">{output.sourceType || "N/A"}</p>
                          {renderSourceDetails(output)}
                          {renderConsoleDetails(output)}
                          {output.isStereo && (
                            <div className="mt-1 flex items-center">
                              <Link className="h-4 w-4 mr-1 text-indigo-400" />
                              <span className="text-indigo-400 text-sm">
                                {linkedChannel && `w/ Ch ${linkedChannel.channelNumber}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs sm:text-sm">Destination</p>
                          <p className="text-white">{output.destinationType || "N/A"}</p>
                          {output.destinationGear && (
                            <p className="text-gray-400 text-sm mt-1">{output.destinationGear}</p>
                          )}
                        </div>

                        {output.notes && (
                          <div>
                            <p className="text-gray-400 text-xs sm:text-sm">Notes</p>
                            <p className="text-white">{output.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {outputs.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleAddOutput}
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors bg-gray-800 px-5 py-2.5 rounded-md hover:bg-gray-750"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Another Output
          </button>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6 sticky top-0 bg-gray-800 z-20 pb-2">
              Bulk Add Outputs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Settings Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Number of Outputs to Add
                  </label>
                  <input
                    type="number"
                    value={bulkQuantity}
                    min="0"
                    onChange={(e) => setBulkQuantity(e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Starting Channel Number
                  </label>
                  <input
                    type="number"
                    value={bulkStartChannel}
                    min="0"
                    onChange={(e) => setBulkStartChannel(e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Name Prefix (optional)</label>
                  <input
                    type="text"
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Main, Monitor, Aux"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Names will be e.g., "Main 1", "Main 2", etc.
                  </p>
                </div>

                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="bulkIsStereoOutput"
                    checked={bulkIsStereo}
                    onChange={(e) => setBulkIsStereo(e.target.checked)}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded"
                  />
                  <label
                    htmlFor="bulkIsStereoOutput"
                    className="text-gray-300 text-sm ml-2 flex items-center"
                  >
                    <Link className="h-4 w-4 mr-1 text-indigo-400" />
                    Create as stereo pairs (L/R)
                  </label>
                </div>
                <div className="text-gray-400 text-xs pl-7">
                  Each consecutive pair of channels will be linked as stereo L/R
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Source Type</label>
                  <select
                    value={bulkSourceType}
                    onChange={(e) => handleBulkSourceTypeChange(e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Source Type</option>
                    {sourceTypeOptions.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source Details Section */}
              <div className="space-y-4">
                {bulkSourceType === "Console Output" && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Console Type</label>
                      <input
                        type="text"
                        value={bulkSourceDetails.consoleType || ""}
                        onChange={(e) =>
                          handleBulkSourceDetailChange("consoleType", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Avid S6L"
                        list="bulkConsoleTypesOutputDatalist"
                      />
                      <datalist id="bulkConsoleTypesOutputDatalist">
                        {getAllConsoleTypes().map((type, idx) => (
                          <option key={`bulk-console-type-${idx}`} value={type} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Output # (Starting)
                      </label>
                      <input
                        type="text"
                        value={bulkSourceDetails.outputNumber || ""}
                        onChange={(e) =>
                          handleBulkSourceDetailChange("outputNumber", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., 1 (will increment)"
                      />
                    </div>
                  </>
                )}

                {bulkSourceType === "Analog Snake" && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Snake Type</label>
                      <input
                        type="text"
                        value={bulkSourceDetails.snakeType || ""}
                        onChange={(e) => handleBulkSourceDetailChange("snakeType", e.target.value)}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Multicore"
                        list="bulkAnalogSnakeTypesOutputDatalist"
                      />
                      <datalist id="bulkAnalogSnakeTypesOutputDatalist">
                        {getAllAnalogSnakeTypes().map((type, idx) => (
                          <option key={idx} value={type} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Output # (Starting)
                      </label>
                      <input
                        type="text"
                        value={bulkSourceDetails.outputNumber || ""}
                        onChange={(e) =>
                          handleBulkSourceDetailChange("outputNumber", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., 1 (will increment)"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Console Type</label>
                      <input
                        type="text"
                        value={bulkSourceDetails.consoleType || ""}
                        onChange={(e) =>
                          handleBulkSourceDetailChange("consoleType", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Avid S6L"
                        list="bulkConsoleTypesOutputDatalist"
                      />
                      <datalist id="bulkConsoleTypesOutputDatalist">
                        {getAllConsoleTypes().map((type, idx) => (
                          <option key={idx} value={type} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Console Output # (Starting)
                      </label>
                      <input
                        type="text"
                        value={bulkSourceDetails.consoleOutputNumber || ""}
                        onChange={(e) =>
                          handleBulkSourceDetailChange("consoleOutputNumber", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., 1 (will increment)"
                      />
                    </div>
                  </>
                )}

                {bulkSourceType === "Digital Snake" && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Snake Type</label>
                      <input
                        type="text"
                        value={bulkSourceDetails.snakeType || ""}
                        onChange={(e) => handleBulkSourceDetailChange("snakeType", e.target.value)}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Yamaha Rio"
                        list="bulkDigitalSnakeTypesOutputDatalist"
                      />
                      <datalist id="bulkDigitalSnakeTypesOutputDatalist">
                        {getAllDigitalSnakeTypes().map((type, idx) => (
                          <option key={idx} value={type} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Output # (Starting)
                      </label>
                      <input
                        type="text"
                        value={bulkSourceDetails.outputNumber || ""}
                        onChange={(e) =>
                          handleBulkSourceDetailChange("outputNumber", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., 1 (will increment)"
                      />
                    </div>
                  </>
                )}

                {(bulkSourceType === "Digital Snake" || bulkSourceType === "Digital Network") && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Network Type</label>
                      <input
                        type="text"
                        value={bulkSourceDetails.networkType || ""}
                        onChange={(e) =>
                          handleBulkSourceDetailChange("networkType", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Dante, AVB"
                        list="bulkNetworkTypesOutputDatalist"
                      />
                      <datalist id="bulkNetworkTypesOutputDatalist">
                        {getAllNetworkTypes().map((type, idx) => (
                          <option key={idx} value={type} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Network Patch # (Starting)
                      </label>
                      <input
                        type="text"
                        value={bulkSourceDetails.networkPatch || ""}
                        onChange={(e) =>
                          handleBulkSourceDetailChange("networkPatch", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., 1 (will increment)"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Destination Type</label>
                  <select
                    value={bulkDestinationType}
                    onChange={(e) => setBulkDestinationType(e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Destination Type</option>
                    {getAllDestinationTypes().map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {bulkDestinationType && (
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Destination Gear</label>
                    <input
                      type="text"
                      value={bulkDestinationGear}
                      onChange={(e) => setBulkDestinationGear(e.target.value)}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={`Enter ${bulkDestinationType} gear name`}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end sticky bottom-0 bg-gray-800 z-20">
              <button
                onClick={() => setShowBulkAddModal(false)}
                className="px-5 py-2.5 text-gray-300 hover:text-white transition-all mr-4"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAdd}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-md font-medium transition-colors ${isBulkAddDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isBulkAddDisabled}
              >
                Add {isBulkAddDisabled ? "" : parsedBulkQuantity}{" "}
                {parsedBulkQuantity === 1 ? "Output" : "Outputs"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatchSheetOutputs;
