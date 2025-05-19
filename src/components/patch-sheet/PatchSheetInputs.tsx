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

interface InputChannel {
  id: string;
  channelNumber: string;
  name: string;
  type: string;
  device: string;
  phantom: boolean;
  connection: string;
  connectionDetails?: {
    snakeType?: string;
    inputNumber?: string;
    networkType?: string;
    networkPatch?: string;
    consoleType?: string;
    consoleInputNumber?: string;
  };
  notes: string;
  isStereo?: boolean;
  stereoChannelNumber?: string; // For linking to another channel
}

interface PatchSheetInputsProps {
  inputs: InputChannel[];
  updateInputs: (inputs: InputChannel[]) => void;
}

const PatchSheetInputs: React.FC<PatchSheetInputsProps> = ({ inputs, updateInputs }) => {
  const [showConnectionTypeOptions, setShowConnectionTypeOptions] = useState<{
    [key: string]: boolean;
  }>({});
  const [editModeInputs, setEditModeInputs] = useState<{ [key: string]: boolean }>({});
  const [editingInputs, setEditingInputs] = useState<{ [key: string]: InputChannel }>({});
  const [isMobile, setIsMobile] = useState(false);

  // Bulk add state
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState<number | string>(8); // Allow string for empty input
  const [bulkType, setBulkType] = useState("");
  const [bulkDevice, setBulkDevice] = useState("");
  const [bulkPhantom, setBulkPhantom] = useState(false);
  const [bulkConnection, setBulkConnection] = useState("");
  const [bulkConnectionDetails, setBulkConnectionDetails] = useState<{
    snakeType?: string;
    inputNumber?: string;
    networkType?: string;
    networkPatch?: string;
    consoleType?: string;
    consoleInputNumber?: string;
  }>({});
  const [bulkStartChannel, setBulkStartChannel] = useState<number | string>(1); // Allow string for empty input
  const [bulkPrefix, setBulkPrefix] = useState("");
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

  // Static input types - SIMPLIFIED to just 3 types
  const inputTypeOptions = ["Microphone", "DI", "Wireless", "FX Return"];

  // Static device types by category
  const deviceOptionsByType: Record<string, string[]> = {
    Microphone: [
      "SM58",
      "SM57",
      "Beta 58A",
      "Beta 57A",
      "Beta 52A",
      "KSM137",
      "C414",
      "MD421",
      "e835",
      "e945",
      "AT4050",
      "Neumann KMS105",
    ],
    DI: [
      "Active DI",
      "Passive DI",
      "Radial J48",
      "BSS AR133",
      "Radial ProDI",
      "Countryman Type 85",
      "Radial ProD2",
      "Avalon U5",
    ],
    Wireless: [
      "Shure ULXD",
      "Shure QLXD",
      "Shure SLX",
      "Sennheiser EW500",
      "Sennheiser G4",
      "Shure Axient Digital",
      "Sennheiser Digital 6000",
      "Line 6 XD-V",
    ],
    "FX Return": [ // Added device options for FX Return
      "Reverb Unit",
      "Delay Unit",
      "Multi-FX Processor",
      "Playback Device",
      "Computer Interface",
    ],
  };

  // All device options combined
  const deviceOptions = [
    ...deviceOptionsByType["Microphone"],
    ...deviceOptionsByType["DI"],
    ...deviceOptionsByType["Wireless"],
    ...deviceOptionsByType["FX Return"], // Added FX Return devices
    "Other",
  ];

  // Static connection types
  const connectionTypeOptions = [
    "Console Direct",
    "Analog Snake",
    "Digital Snake",
    "Digital Network",
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

  // Store custom types
  const [customInputTypes, setCustomInputTypes] = useState<string[]>([]);
  const [customDevices, setCustomDevices] = useState<string[]>([]);
  const [customAnalogSnakeTypes, setCustomAnalogSnakeTypes] = useState<string[]>([]);
  const [customDigitalSnakeTypes, setCustomDigitalSnakeTypes] = useState<string[]>([]);
  const [customNetworkTypes, setCustomNetworkTypes] = useState<string[]>([]);
  const [customConsoleTypes, setCustomConsoleTypes] = useState<string[]>([]);

  const connectionTypeDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Initialize all inputs to edit mode by default
  useEffect(() => {
    const initialEditMode: { [key: string]: boolean } = {};
    inputs.forEach((input) => {
      initialEditMode[input.id] = true;
      setEditingInputs((prev) => ({
        ...prev,
        [input.id]: { ...input },
      }));
    });
    setEditModeInputs(initialEditMode);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close connection type dropdowns
      Object.keys(connectionTypeDropdownRefs.current).forEach((id) => {
        if (
          connectionTypeDropdownRefs.current[id] &&
          !connectionTypeDropdownRefs.current[id]?.contains(event.target as Node)
        ) {
          setShowConnectionTypeOptions((prev) => ({ ...prev, [id]: false }));
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load custom types from inputs on initial load
  useEffect(() => {
    const inputTypesSet = new Set<string>();
    const devicesSet = new Set<string>();
    const analogSnakeTypesSet = new Set<string>();
    const digitalSnakeTypesSet = new Set<string>();
    const networkTypesSet = new Set<string>();
    const consoleTypesSet = new Set<string>();

    inputs.forEach((input) => {
      // Collect custom input types
      if (input.type && !inputTypeOptions.includes(input.type)) {
        inputTypesSet.add(input.type);
      }

      // Collect custom devices
      if (input.device && !deviceOptions.includes(input.device)) {
        devicesSet.add(input.device);
      }

      // Collect custom connection details
      if (input.connectionDetails) {
        if (
          input.connection === "Analog Snake" &&
          input.connectionDetails.snakeType &&
          !analogSnakeTypes.includes(input.connectionDetails.snakeType)
        ) {
          analogSnakeTypesSet.add(input.connectionDetails.snakeType);
        }

        if (
          input.connection === "Digital Snake" &&
          input.connectionDetails.snakeType &&
          !digitalSnakeTypes.includes(input.connectionDetails.snakeType)
        ) {
          digitalSnakeTypesSet.add(input.connectionDetails.snakeType);
        }

        if (
          input.connectionDetails.networkType &&
          !networkTypeOptions.includes(input.connectionDetails.networkType)
        ) {
          networkTypesSet.add(input.connectionDetails.networkType);
        }

        if (
          input.connectionDetails.consoleType &&
          !consoleTypeOptions.includes(input.connectionDetails.consoleType)
        ) {
          consoleTypesSet.add(input.connectionDetails.consoleType);
        }
      }
    });

    // Convert Sets to arrays and update state
    setCustomInputTypes(Array.from(inputTypesSet));
    setCustomDevices(Array.from(devicesSet));
    setCustomAnalogSnakeTypes(Array.from(analogSnakeTypesSet));
    setCustomDigitalSnakeTypes(Array.from(digitalSnakeTypesSet));
    setCustomNetworkTypes(Array.from(networkTypesSet));
    setCustomConsoleTypes(Array.from(consoleTypesSet));
  }, []);

  // Update editing inputs when actual inputs change
  useEffect(() => {
    const newEditingInputs: { [key: string]: InputChannel } = {};

    // Add new inputs or update existing ones
    inputs.forEach((input) => {
      newEditingInputs[input.id] = editingInputs[input.id]
        ? { ...editingInputs[input.id] }
        : { ...input };
    });

    setEditingInputs(newEditingInputs);

    // Initialize edit mode for new inputs
    inputs.forEach((input) => {
      if (editModeInputs[input.id] === undefined) {
        setEditModeInputs((prev) => ({
          ...prev,
          [input.id]: true,
        }));
      }
    });
  }, [inputs]);

  // Function to update parent component's inputs array
  const updateParentInputs = () => {
    const updatedInputs = inputs.map((input) => {
      // If the input is in edit mode, use the editing version
      if (editModeInputs[input.id]) {
        return { ...editingInputs[input.id] };
      }
      return input;
    });
    updateInputs(updatedInputs);
  };

  // Effect to update parent component's inputs when editing inputs change
  useEffect(() => {
    // Debounce the update to avoid too many rerenders
    const timeoutId = setTimeout(() => {
      updateParentInputs();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [editingInputs]);

  const handleAddInput = () => {
    const nextChannelNumber =
      inputs.length > 0
        ? Math.max(...inputs.map((input) => parseInt(input.channelNumber, 10) || 0)) + 1
        : 1;

    const newInput: InputChannel = {
      id: `input-${Date.now()}`, // Generate a unique ID
      channelNumber: `${nextChannelNumber}`,
      name: "",
      type: "",
      device: "",
      phantom: false,
      connection: "",
      connectionDetails: {},
      notes: "",
      isStereo: false,
    };

    // Update parent component directly
    updateInputs([...inputs, newInput]);

    // Set new input to edit mode
    setEditModeInputs((prev) => ({
      ...prev,
      [newInput.id]: true,
    }));

    // Add to editing inputs
    setEditingInputs((prev) => ({
      ...prev,
      [newInput.id]: { ...newInput },
    }));
  };

  const handleDeleteInput = (id: string) => {
    // Check if this is a stereo channel and update its linked channel
    const inputToDelete = inputs.find((input) => input.id === id);
    const updatedInputs = inputs.filter((input) => input.id !== id);

    // If this is a stereo channel with a link, update the linked channel
    if (inputToDelete?.isStereo && inputToDelete?.stereoChannelNumber) {
      const linkedChannelIndex = updatedInputs.findIndex(
        (input) => input.channelNumber === inputToDelete.stereoChannelNumber,
      );

      if (linkedChannelIndex !== -1) {
        updatedInputs[linkedChannelIndex] = {
          ...updatedInputs[linkedChannelIndex],
          isStereo: false,
          stereoChannelNumber: undefined,
        };
      }
    }

    // If any other channel is linked to this one, update it
    updatedInputs.forEach((input, index) => {
      if (input.stereoChannelNumber === inputToDelete?.channelNumber) {
        updatedInputs[index] = {
          ...updatedInputs[index],
          isStereo: false,
          stereoChannelNumber: undefined,
        };
      }
    });

    updateInputs(updatedInputs);

    // Remove from edit mode tracking
    setEditModeInputs((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Remove from editing inputs
    setEditingInputs((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleEditInput = (id: string) => {
    // Find the input in the main inputs array
    const input = inputs.find((input) => input.id === id);
    if (!input) return;

    // Set the editing input to match the current input state
    setEditingInputs((prev) => ({
      ...prev,
      [id]: { ...input },
    }));

    // Set to edit mode
    setEditModeInputs((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  const handleSaveInput = (id: string) => {
    const updatedInput = editingInputs[id];
    if (!updatedInput) return;

    // Handle stereo linking
    if (updatedInput.isStereo && updatedInput.stereoChannelNumber) {
      // Find the linked channel
      const linkedChannelIndex = inputs.findIndex(
        (input) => input.channelNumber === updatedInput.stereoChannelNumber && input.id !== id,
      );

      if (linkedChannelIndex !== -1) {
        // Update the linked channel to link back to this one
        const linkedInput = { ...inputs[linkedChannelIndex] };
        linkedInput.isStereo = true;
        linkedInput.stereoChannelNumber = updatedInput.channelNumber;

        // Update the inputs array with the linked channel
        const updatedInputs = [...inputs];
        updatedInputs[linkedChannelIndex] = linkedInput;

        // Also update in editing inputs if it's in edit mode
        if (editModeInputs[linkedInput.id]) {
          setEditingInputs((prev) => ({
            ...prev,
            [linkedInput.id]: linkedInput,
          }));
        }

        updateInputs(updatedInputs);
      }
    } else if (!updatedInput.isStereo) {
      // If stereo is turned off, find any channels that were linked to this one and update them
      const updatedInputs = inputs.map((input) => {
        if (input.stereoChannelNumber === updatedInput.channelNumber) {
          return {
            ...input,
            isStereo: false,
            stereoChannelNumber: undefined,
          };
        }
        return input;
      });

      updateInputs(updatedInputs);
    }

    // Update the specific input
    const finalUpdatedInputs = inputs.map((input) =>
      input.id === id ? { ...updatedInput } : input,
    );

    updateInputs(finalUpdatedInputs);

    // Exit edit mode
    setEditModeInputs((prev) => ({
      ...prev,
      [id]: false,
    }));
  };

  const handleEditingInputChange = (id: string, field: keyof InputChannel, value: any) => {
    const updatedInput = { ...editingInputs[id] };

    // Update the field
    updatedInput[field] = value;

    // Reset connection details when changing connection type
    if (field === "connection") {
      updatedInput.connectionDetails = {};
    }

    // Update device suggestions when type changes
    if (field === "type" && value !== updatedInput.type) {
      // Only reset device if the type has changed and the current device isn't in the new type's suggestions
      const suggestedDevices = deviceOptionsByType[value as string] || [];
      if (suggestedDevices.length > 0 && !suggestedDevices.includes(updatedInput.device)) {
        updatedInput.device = "";
      }

      // Set phantom power based on new type
      if (value === "Microphone") {
        updatedInput.phantom = true; // Most microphones need phantom
      } else if (value === "DI") {
        updatedInput.phantom = false; // Most DIs don't need phantom (active ones might)
      } else if (value === "Wireless") {
        updatedInput.phantom = false; // Wireless systems don't need phantom
      } else if (value === "FX Return") { // Added FX Return phantom logic
        updatedInput.phantom = false; // FX Returns typically don't need phantom
      }
    }

    // If stereo is being toggled off, clear the stereo channel number
    if (field === "isStereo" && value === false) {
      updatedInput.stereoChannelNumber = undefined;
    }

    // Update the editing inputs
    setEditingInputs((prev) => ({
      ...prev,
      [id]: updatedInput,
    }));
  };

  const handleConnectionDetailChange = (id: string, detailKey: string, value: string) => {
    const updatedInput = { ...editingInputs[id] };

    // Make sure connectionDetails exists
    if (!updatedInput.connectionDetails) {
      updatedInput.connectionDetails = {};
    }

    // Update the detail
    updatedInput.connectionDetails[detailKey as keyof typeof updatedInput.connectionDetails] =
      value;

    // Update the editing inputs
    setEditingInputs((prev) => ({
      ...prev,
      [id]: updatedInput,
    }));
  };

  // Get a list of available channels for stereo linking
  const getAvailableChannelsForStereo = (
    currentChannelId: string,
    currentChannelNumber: string,
  ) => {
    return inputs
      .filter(
        (input) =>
          // Don't show the current channel
          input.id !== currentChannelId &&
          // Don't show channels that are already linked to another channel (except the current one)
          (!input.isStereo || input.stereoChannelNumber === currentChannelNumber),
      )
      .map((input) => ({
        channelNumber: input.channelNumber,
        name: input.name || `Channel ${input.channelNumber}`,
      }));
  };

  // Handle selection of connection type
  const handleSelectConnectionType = (id: string, value: string) => {
    handleEditingInputChange(id, "connection", value);

    // Close the dropdown
    setShowConnectionTypeOptions((prev) => ({ ...prev, [id]: false }));
  };

  // Handle key press for various inputs to capture custom values
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
      if (type === "inputType") {
        handleEditingInputChange(id, "type", value);
        if (!inputTypeOptions.includes(value) && !customInputTypes.includes(value)) {
          setCustomInputTypes((prev) => [...prev, value]);
        }
      } else if (type === "device") {
        handleEditingInputChange(id, "device", value);
        if (!deviceOptions.includes(value) && !customDevices.includes(value)) {
          setCustomDevices((prev) => [...prev, value]);
        }
      } else if (type === "networkType") {
        handleConnectionDetailChange(id, "networkType", value);
        if (!networkTypeOptions.includes(value) && !customNetworkTypes.includes(value)) {
          setCustomNetworkTypes((prev) => [...prev, value]);
        }
      } else if (type === "analogSnakeType") {
        handleConnectionDetailChange(id, "snakeType", value);
        if (!analogSnakeTypes.includes(value) && !customAnalogSnakeTypes.includes(value)) {
          setCustomAnalogSnakeTypes((prev) => [...prev, value]);
        }
      } else if (type === "digitalSnakeType") {
        handleConnectionDetailChange(id, "snakeType", value);
        if (!digitalSnakeTypes.includes(value) && !customDigitalSnakeTypes.includes(value)) {
          setCustomDigitalSnakeTypes((prev) => [...prev, value]);
        }
      } else if (type === "consoleType") {
        handleConnectionDetailChange(id, "consoleType", value);
        if (!consoleTypeOptions.includes(value) && !customConsoleTypes.includes(value)) {
          setCustomConsoleTypes((prev) => [...prev, value]);
        }
      }
    }
  };

  const toggleConnectionTypeOptions = (id: string) => {
    // Toggle this dropdown
    setShowConnectionTypeOptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Get all input types combining default and custom options
  const getAllInputTypes = () => {
    return [...inputTypeOptions, ...customInputTypes];
  };

  // Get all device options for a specific input type
  const getDeviceOptionsForType = (type: string) => {
    if (type && deviceOptionsByType[type]) {
      return [...deviceOptionsByType[type], ...customDevices];
    }
    return [...deviceOptions, ...customDevices];
  };

  // Get all device options combining default and custom options
  const getAllDevices = () => {
    return [...deviceOptions, ...customDevices];
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

  // Function to render connection details in collapsed view
  const renderConnectionDetails = (input: InputChannel) => {
    if (!input.connection || !input.connectionDetails) return null;

    switch (input.connection) {
      case "Console Direct":
        return (
          <div className="flex space-x-4 text-sm">
            {input.connectionDetails.consoleType && (
              <span className="text-gray-400">
                {input.connectionDetails.consoleType}
                {input.connectionDetails.consoleInputNumber &&
                  ` - Input #${input.connectionDetails.consoleInputNumber}`}
              </span>
            )}
          </div>
        );

      case "Analog Snake":
        return (
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-400">
              {input.connectionDetails.snakeType || ""}
              {input.connectionDetails.inputNumber &&
                ` - Input #${input.connectionDetails.inputNumber}`}
            </span>
          </div>
        );

      case "Digital Snake":
        return (
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-400">
              {input.connectionDetails.snakeType || ""}
              {input.connectionDetails.inputNumber &&
                ` - Input #${input.connectionDetails.inputNumber}`}
              {input.connectionDetails.networkType && ` - ${input.connectionDetails.networkType}`}
              {input.connectionDetails.networkPatch &&
                ` - Patch #${input.connectionDetails.networkPatch}`}
            </span>
          </div>
        );

      case "Digital Network":
        return (
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-400">
              {input.connectionDetails.networkType || ""}
              {input.connectionDetails.networkPatch &&
                ` - Patch #${input.connectionDetails.networkPatch}`}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  // Render console details for analog snake inputs
  const renderConsoleDetails = (input: InputChannel) => {
    if (
      input.connection === "Analog Snake" &&
      (input.connectionDetails?.consoleType || input.connectionDetails?.consoleInputNumber)
    ) {
      return (
        <div className="mt-1 text-gray-400 text-sm">
          <span>→ {input.connectionDetails?.consoleType || "Console"}</span>
          {input.connectionDetails?.consoleInputNumber && (
            <span> - Input #{input.connectionDetails.consoleInputNumber}</span>
          )}
        </div>
      );
    }
    return null;
  };

  // Handle opening the bulk add modal
  const openBulkAddModal = () => {
    const nextChannelNumber =
      inputs.length > 0
        ? Math.max(...inputs.map((input) => parseInt(input.channelNumber, 10) || 0)) + 1
        : 1;
    setBulkStartChannel(nextChannelNumber);
    setShowBulkAddModal(true);
  };

  // Handle bulk add inputs
  const handleBulkAdd = () => {
    const quantity = parseInt(String(bulkQuantity), 10);
    const startNum = parseInt(String(bulkStartChannel), 10);

    if (isNaN(quantity) || quantity <= 0 || isNaN(startNum) || startNum <= 0) {
      console.error("Invalid quantity or starting channel number");
      return;
    }

    const newInputs: InputChannel[] = [];

    for (let i = 0; i < quantity; i++) {
      const channelNum = startNum + i;
      const nameSuffixNumber = bulkIsStereo ? Math.floor(i / 2) + 1 : i + 1;

      let currentName: string;
      if (bulkPrefix) {
        currentName = `${bulkPrefix} ${nameSuffixNumber}`;
      } else {
        currentName = `Input ${channelNum}`;
      }

      let consoleInputNumber = bulkConnectionDetails.consoleInputNumber;
      let networkPatch = bulkConnectionDetails.networkPatch;
      let inputNumber = bulkConnectionDetails.inputNumber;

      if (consoleInputNumber && !isNaN(parseInt(consoleInputNumber))) {
        consoleInputNumber = (parseInt(consoleInputNumber) + i).toString();
      }
      if (networkPatch && !isNaN(parseInt(networkPatch))) {
        networkPatch = (parseInt(networkPatch) + i).toString();
      }
      if (inputNumber && !isNaN(parseInt(inputNumber))) {
        inputNumber = (parseInt(inputNumber) + i).toString();
      }

      const connectionDetails = {
        ...bulkConnectionDetails,
        consoleInputNumber,
        networkPatch,
        inputNumber,
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


      const newInput: InputChannel = {
        id: `input-${Date.now()}-${i}`,
        channelNumber: channelNum.toString(),
        name: currentName,
        type: bulkType,
        device: bulkDevice,
        phantom: bulkPhantom,
        connection: bulkConnection,
        connectionDetails,
        notes: "",
        isStereo,
        stereoChannelNumber,
      };

      newInputs.push(newInput);
    }

    updateInputs([...inputs, ...newInputs]);

    const newEditModeInputs = { ...editModeInputs };
    const newEditingInputs = { ...editingInputs };
    newInputs.forEach((input) => {
      newEditModeInputs[input.id] = true;
      newEditingInputs[input.id] = { ...input };
    });
    setEditModeInputs(newEditModeInputs);
    setEditingInputs(newEditingInputs);

    setShowBulkAddModal(false);
    setBulkQuantity(8);
    setBulkStartChannel(1); // Will be recalculated next time modal opens
    setBulkPrefix("");
    setBulkType("");
    setBulkDevice("");
    setBulkPhantom(false);
    setBulkConnection("");
    setBulkConnectionDetails({});
    setBulkIsStereo(false);
  };

  // Handle bulk connection type change
  const handleBulkConnectionChange = (value: string) => {
    setBulkConnection(value);
    // Reset connection details when changing connection type
    setBulkConnectionDetails({});
  };

  // Handle bulk connection detail change
  const handleBulkConnectionDetailChange = (detailKey: string, value: string) => {
    setBulkConnectionDetails((prev) => ({
      ...prev,
      [detailKey]: value,
    }));
  };

  // Handle bulk input type change with automatic phantom setting
  const handleBulkTypeChange = (value: string) => {
    setBulkType(value);
    setBulkDevice(""); // Reset device when type changes

    // Set default phantom power based on input type
    if (value === "Microphone") {
      setBulkPhantom(true); // Most microphones need phantom
    } else if (value === "DI") {
      setBulkPhantom(false); // Most DIs don't need phantom
    } else if (value === "Wireless") {
      setBulkPhantom(false); // Wireless systems don't need phantom
    } else if (value === "FX Return") { // Added FX Return phantom logic for bulk add
      setBulkPhantom(false); // FX Returns typically don't need phantom
    }
  };

  // Get suggested device options based on the selected type
  const getSuggestedDevicesForBulkType = () => {
    if (bulkType && deviceOptionsByType[bulkType]) {
      return deviceOptionsByType[bulkType];
    }
    return [];
  };

  const parsedBulkQuantity = parseInt(String(bulkQuantity), 10);
  const isBulkAddDisabled = isNaN(parsedBulkQuantity) || parsedBulkQuantity <= 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Input List</h2>
          <p className="text-gray-400 text-sm mt-1">Define your audio inputs and signal path</p>
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
            onClick={handleAddInput}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm sm:text-base"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Input</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {inputs.length === 0 ? (
        <div className="bg-gray-700 rounded-lg p-6 md:p-10 text-center my-8">
          <p className="text-gray-300 mb-6 text-lg">No inputs have been added yet.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={openBulkAddModal}
              className="inline-flex items-center bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Bulk Add Inputs
            </button>
            <button
              onClick={handleAddInput}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Add Single Input
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 overflow-x-auto">
          <div className="min-w-[800px] md:min-w-0">
            {" "}
            {/* Minimum width container */}
            {inputs.map((input) => {
              const editingInput = editingInputs[input.id] || input;
              const isEditMode = editModeInputs[input.id];
              const availableStereoChannels = getAvailableChannelsForStereo(
                input.id,
                input.channelNumber,
              );

              // Find if this input has a linked stereo channel
              const linkedChannel = inputs.find(
                (otherInput) =>
                  otherInput.channelNumber === input.stereoChannelNumber && otherInput.isStereo,
              );

              return (
                <div
                  key={input.id}
                  className={`bg-gray-800 border border-gray-700 rounded-lg overflow-visible hover:border-gray-600 transition-colors ${input.isStereo ? "border-l-4 border-l-indigo-500" : ""}`}
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
                              value={editingInput.channelNumber}
                              onChange={(e) =>
                                handleEditingInputChange(input.id, "channelNumber", e.target.value)
                              }
                              className="ml-1 sm:ml-2 bg-gray-700 text-white border border-gray-600 rounded-md px-1 sm:px-2 py-1 w-10 sm:w-16 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span>Ch {input.channelNumber}:</span>
                          </>
                        )}
                      </div>
                      {isEditMode ? (
                        <>
                          <div className="hidden sm:block h-5 w-px bg-gray-600"></div>
                          <input
                            type="text"
                            value={editingInput.name}
                            onChange={(e) =>
                              handleEditingInputChange(input.id, "name", e.target.value)
                            }
                            className="bg-gray-700 text-white border border-gray-600 rounded-md px-2 sm:px-3 py-1 w-full max-w-[140px] sm:max-w-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                            placeholder="Name/Label"
                          />
                        </>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-white font-medium truncate mr-2">
                            {input.name || "Unnamed Input"}
                          </span>
                          {input.isStereo && (
                            <div className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full flex items-center">
                              <Link2 className="h-3 w-3 mr-1" />
                              {input.stereoChannelNumber ? (
                                <span>Stereo w/ Ch {input.stereoChannelNumber}</span>
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
                            onClick={() => handleSaveInput(input.id)}
                            className="p-1 sm:p-2 text-indigo-400 hover:text-indigo-300 transition-colors hover:bg-gray-700 rounded-full"
                            title="Save input"
                          >
                            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteInput(input.id)}
                            className="p-1 sm:p-2 text-red-400 hover:text-red-500 transition-colors hover:bg-gray-700 rounded-full"
                            title="Delete input"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditInput(input.id)}
                            className="p-1 sm:p-2 text-indigo-400 hover:text-indigo-300 transition-colors hover:bg-gray-700 rounded-full"
                            title="Edit input"
                          >
                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteInput(input.id)}
                            className="p-1 sm:p-2 text-red-400 hover:text-red-500 transition-colors hover:bg-gray-700 rounded-full"
                            title="Delete input"
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
                          <label className="block text-gray-300 text-sm mb-2">Type</label>
                          <select
                            value={editingInput.type}
                            onChange={(e) =>
                              handleEditingInputChange(input.id, "type", e.target.value)
                            }
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="">Select Input Type</option>
                            {inputTypeOptions.map((type, index) => (
                              <option key={index} value={type}>
                                {type}
                              </option>
                            ))}
                            {customInputTypes.map((type, index) => (
                              <option key={`custom-${index}`} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-300 text-sm mb-2">Device/Mic</label>
                          <input
                            type="text"
                            value={editingInput.device}
                            onChange={(e) =>
                              handleEditingInputChange(input.id, "device", e.target.value)
                            }
                            onKeyDown={(e) => handleCustomTypeKeyDown(e, input.id, "device")}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="e.g., SM58, DI Box"
                            list={`deviceOptions-${input.id}`}
                          />
                          <datalist id={`deviceOptions-${input.id}`}>
                            {editingInput.type && deviceOptionsByType[editingInput.type]
                              ? deviceOptionsByType[editingInput.type].map((device, idx) => (
                                  <option key={idx} value={device} />
                                ))
                              : getAllDevices().map((device, idx) => (
                                  <option key={idx} value={device} />
                                ))}
                          </datalist>
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="block text-gray-300 text-sm">Phantom Power</label>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editingInput.phantom}
                                onChange={(e) =>
                                  handleEditingInputChange(input.id, "phantom", e.target.checked)
                                }
                                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded"
                              />
                              <span className="text-gray-300 text-sm">48V</span>
                            </div>
                          </div>
                          <div className="bg-gray-700 p-3 rounded-md border border-gray-600 text-white">
                            {editingInput.phantom ? "48V Enabled" : "No Phantom Power"}
                          </div>
                        </div>

                        {/* Stereo configuration */}
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="block text-gray-300 text-sm">Stereo Channel</label>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editingInput.isStereo}
                                onChange={(e) =>
                                  handleEditingInputChange(input.id, "isStereo", e.target.checked)
                                }
                                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded"
                              />
                              <span className="text-gray-300 text-sm">Stereo</span>
                            </div>
                          </div>

                          {editingInput.isStereo ? (
                            <div className="mt-2">
                              <select
                                value={editingInput.stereoChannelNumber || ""}
                                onChange={(e) =>
                                  handleEditingInputChange(
                                    input.id,
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

                        <div
                          className="relative"
                          ref={(el) => (connectionTypeDropdownRefs.current[input.id] = el)}
                        >
                          <label className="block text-gray-300 text-sm mb-2">
                            Connection Type
                          </label>
                          <div className="relative">
                            <select
                              value={editingInput.connection}
                              onChange={(e) =>
                                handleEditingInputChange(input.id, "connection", e.target.value)
                              }
                              className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                              <option value="">Select Connection Type</option>
                              {connectionTypeOptions.map((type, index) => (
                                <option key={index} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Additional fields based on connection type */}
                        {editingInput.connection === "Console Direct" && (
                          <>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">
                                Console Type
                              </label>
                              <input
                                type="text"
                                value={editingInput.connectionDetails?.consoleType || ""}
                                onChange={(e) =>
                                  handleConnectionDetailChange(
                                    input.id,
                                    "consoleType",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleCustomTypeKeyDown(e, input.id, "consoleType")
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Avid S6L, DiGiCo SD12"
                                list={`consoleTypes-${input.id}`}
                              />
                              <datalist id={`consoleTypes-${input.id}`}>
                                {getAllConsoleTypes().map((type, idx) => (
                                  <option key={idx} value={type} />
                                ))}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">Input #</label>
                              <input
                                type="text"
                                value={editingInput.connectionDetails?.consoleInputNumber || ""}
                                onChange={(e) =>
                                  handleConnectionDetailChange(
                                    input.id,
                                    "consoleInputNumber",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., 12"
                              />
                            </div>
                          </>
                        )}

                        {editingInput.connection === "Analog Snake" && (
                          <>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">Snake Type</label>
                              <input
                                type="text"
                                value={editingInput.connectionDetails?.snakeType || ""}
                                onChange={(e) =>
                                  handleConnectionDetailChange(
                                    input.id,
                                    "snakeType",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleCustomTypeKeyDown(e, input.id, "analogSnakeType")
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Multicore, XLR Harness"
                                list={`analogSnakeTypes-${input.id}`}
                              />
                              <datalist id={`analogSnakeTypes-${input.id}`}>
                                {getAllAnalogSnakeTypes().map((type, idx) => (
                                  <option key={idx} value={type} />
                                ))}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">Input #</label>
                              <input
                                type="text"
                                value={editingInput.connectionDetails?.inputNumber || ""}
                                onChange={(e) =>
                                  handleConnectionDetailChange(
                                    input.id,
                                    "inputNumber",
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
                                value={editingInput.connectionDetails?.consoleType || ""}
                                onChange={(e) =>
                                  handleConnectionDetailChange(
                                    input.id,
                                    "consoleType",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleCustomTypeKeyDown(e, input.id, "consoleType")
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Avid S6L, DiGiCo SD12"
                                list={`consoleTypes-${input.id}`}
                              />
                              <datalist id={`consoleTypes-${input.id}`}>
                                {getAllConsoleTypes().map((type, idx) => (
                                  <option key={idx} value={type} />
                                ))}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">
                                Console Input #
                              </label>
                              <input
                                type="text"
                                value={editingInput.connectionDetails?.consoleInputNumber || ""}
                                onChange={(e) =>
                                  handleConnectionDetailChange(
                                    input.id,
                                    "consoleInputNumber",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., 8"
                              />
                            </div>
                          </>
                        )}

                        {editingInput.connection === "Digital Snake" && (
                          <>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">Snake Type</label>
                              <input
                                type="text"
                                value={editingInput.connectionDetails?.snakeType || ""}
                                onChange={(e) =>
                                  handleConnectionDetailChange(
                                    input.id,
                                    "snakeType",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleCustomTypeKeyDown(e, input.id, "digitalSnakeType")
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Yamaha Rio, DL16"
                                list={`digitalSnakeTypes-${input.id}`}
                              />
                              <datalist id={`digitalSnakeTypes-${input.id}`}>
                                {getAllDigitalSnakeTypes().map((type, idx) => (
                                  <option key={idx} value={type} />
                                ))}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">Input #</label>
                              <input
                                type="text"
                                value={editingInput.connectionDetails?.inputNumber || ""}
                                onChange={(e) =>
                                  handleConnectionDetailChange(
                                    input.id,
                                    "inputNumber",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., 8"
                              />
                            </div>
                          </>
                        )}

                        {(editingInput.connection === "Digital Snake" ||
                          editingInput.connection === "Digital Network") && (
                          <>
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">
                                Network Type
                              </label>
                              <input
                                type="text"
                                value={editingInput.connectionDetails?.networkType || ""}
                                onChange={(e) =>
                                  handleConnectionDetailChange(
                                    input.id,
                                    "networkType",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleCustomTypeKeyDown(e, input.id, "networkType")
                                }
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="e.g., Dante, AVB"
                                list={`networkTypes-${input.id}`}
                              />
                              <datalist id={`networkTypes-${input.id}`}>
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
                                value={editingInput.connectionDetails?.networkPatch || ""}
                                onChange={(e) =>
                                  handleConnectionDetailChange(
                                    input.id,
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

                        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                          <label className="block text-gray-300 text-sm mb-2">Notes</label>
                          <input
                            type="text"
                            value={editingInput.notes}
                            onChange={(e) =>
                              handleEditingInputChange(input.id, "notes", e.target.value)
                            }
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Additional notes about this input"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Collapsed view
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-gray-400 text-xs sm:text-sm">Type/Device</p>
                          <p className="text-white">
                            {input.type || "N/A"} - {input.device || "N/A"}
                          </p>
                          {input.isStereo && (
                            <div className="mt-1 flex items-center">
                              <Link className="h-4 w-4 mr-1 text-indigo-400" />
                              <span className="text-indigo-400 text-sm">
                                {linkedChannel && `w/ Ch ${linkedChannel.channelNumber}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs sm:text-sm">Connection</p>
                          <p className="text-white">{input.connection || "N/A"}</p>
                          {renderConnectionDetails(input)}
                          {renderConsoleDetails(input)}
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs sm:text-sm">Phantom Power</p>
                          <p className={`text-white ${input.phantom ? "text-indigo-300" : ""}`}>
                            {input.phantom ? "48V Enabled" : "No"}
                          </p>
                        </div>

                        {input.notes && (
                          <div>
                            <p className="text-gray-400 text-xs sm:text-sm">Notes</p>
                            <p className="text-white">{input.notes}</p>
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

      {inputs.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleAddInput}
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors bg-gray-800 px-5 py-2.5 rounded-md hover:bg-gray-750"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Another Input
          </button>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-6 sticky top-0 bg-gray-800 z-20 pb-2">
              Bulk Add Inputs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Settings Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Number of Inputs to Add
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
                    placeholder="e.g., Vocal, Drum, DI"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Names will be e.g., "Vocal 1", "Vocal 2", etc.
                  </p>
                </div>

                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="bulkIsStereo"
                    checked={bulkIsStereo}
                    onChange={(e) => setBulkIsStereo(e.target.checked)}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded"
                  />
                  <label
                    htmlFor="bulkIsStereo"
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
                  <label className="block text-gray-300 text-sm mb-2">Input Type</label>
                  <select
                    value={bulkType}
                    onChange={(e) => handleBulkTypeChange(e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Input Type</option>
                    {getAllInputTypes().map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {bulkType && (
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Device/Mic</label>
                    <input
                      type="text"
                      value={bulkDevice}
                      onChange={(e) => setBulkDevice(e.target.value)}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., SM58, DI Box"
                      list="bulkDeviceOptionsDatalist"
                    />
                    <datalist id="bulkDeviceOptionsDatalist">
                      {(getSuggestedDevicesForBulkType().length > 0
                        ? getSuggestedDevicesForBulkType()
                        : getAllDevices()
                      ).map((device, idx) => (
                        <option key={idx} value={device} />
                      ))}
                    </datalist>
                  </div>
                )}

                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="bulkPhantom"
                      checked={bulkPhantom}
                      onChange={(e) => setBulkPhantom(e.target.checked)}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded"
                    />
                    <label htmlFor="bulkPhantom" className="block text-gray-300 text-sm ml-2">
                      Enable Phantom Power (48V)
                    </label>
                  </div>
                </div>
              </div>

              {/* Connection Settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Connection Type</label>
                  <select
                    value={bulkConnection}
                    onChange={(e) => handleBulkConnectionChange(e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Connection Type</option>
                    {connectionTypeOptions.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Connection Type Specific Fields */}
                {bulkConnection === "Console Direct" && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Console Type</label>
                      <input
                        type="text"
                        value={bulkConnectionDetails.consoleType || ""}
                        onChange={(e) =>
                          handleBulkConnectionDetailChange("consoleType", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Avid S6L, DiGiCo SD12"
                        list="bulkConsoleTypesDatalist"
                      />
                      <datalist id="bulkConsoleTypesDatalist">
                        {getAllConsoleTypes().map((type, idx) => (
                          <option key={idx} value={type} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Input # (Starting)</label>
                      <input
                        type="text"
                        value={bulkConnectionDetails.consoleInputNumber || ""}
                        onChange={(e) =>
                          handleBulkConnectionDetailChange("consoleInputNumber", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., 1 (will increment with each input)"
                      />
                    </div>
                  </>
                )}

                {bulkConnection === "Analog Snake" && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Snake Type</label>
                      <input
                        type="text"
                        value={bulkConnectionDetails.snakeType || ""}
                        onChange={(e) =>
                          handleBulkConnectionDetailChange("snakeType", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Multicore, XLR Harness"
                        list="bulkAnalogSnakeTypesDatalist"
                      />
                      <datalist id="bulkAnalogSnakeTypesDatalist">
                        {getAllAnalogSnakeTypes().map((type, idx) => (
                          <option key={idx} value={type} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Input # (Starting)</label>
                      <input
                        type="text"
                        value={bulkConnectionDetails.inputNumber || ""}
                        onChange={(e) =>
                          handleBulkConnectionDetailChange("inputNumber", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., 1 (will increment with each input)"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Console Type</label>
                      <input
                        type="text"
                        value={bulkConnectionDetails.consoleType || ""}
                        onChange={(e) =>
                          handleBulkConnectionDetailChange("consoleType", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Avid S6L, DiGiCo SD12"
                        list="bulkConsoleTypesDatalist"
                      />
                      <datalist id="bulkConsoleTypesDatalist">
                        {getAllConsoleTypes().map((type, idx) => (
                          <option key={idx} value={type} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Console Input # (Starting)
                      </label>
                      <input
                        type="text"
                        value={bulkConnectionDetails.consoleInputNumber || ""}
                        onChange={(e) =>
                          handleBulkConnectionDetailChange("consoleInputNumber", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., 1 (will increment with each input)"
                      />
                    </div>
                  </>
                )}

                {bulkConnection === "Digital Snake" && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Snake Type</label>
                      <input
                        type="text"
                        value={bulkConnectionDetails.snakeType || ""}
                        onChange={(e) =>
                          handleBulkConnectionDetailChange("snakeType", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., Yamaha Rio, DL16"
                        list="bulkDigitalSnakeTypesDatalist"
                      />
                      <datalist id="bulkDigitalSnakeTypesDatalist">
                        {getAllDigitalSnakeTypes().map((type, idx) => (
                          <option key={idx} value={type} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Input # (Starting)</label>
                      <input
                        type="text"
                        value={bulkConnectionDetails.inputNumber || ""}
                        onChange={(e) =>
                          handleBulkConnectionDetailChange("inputNumber", e.target.value)
                        }
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., 1 (will increment with each input)"
                      />
                    </div>
                  </>
                )}

                {(bulkConnection === "Digital Snake" || bulkConnection === "Digital Network") && (
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Network Type</label>
                    <input
                      type="text"
                      value={bulkConnectionDetails.networkType || ""}
                      onChange={(e) =>
                        handleBulkConnectionDetailChange("networkType", e.target.value)
                      }
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., Dante, AVB"
                      list="bulkNetworkTypesDatalist"
                    />
                    <datalist id="bulkNetworkTypesDatalist">
                      {getAllNetworkTypes().map((type, idx) => (
                        <option key={idx} value={type} />
                      ))}
                    </datalist>
                  </div>
                )}

                {(bulkConnection === "Digital Snake" || bulkConnection === "Digital Network") && (
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">
                      Network Patch # (Starting)
                    </label>
                    <input
                      type="text"
                      value={bulkConnectionDetails.networkPatch || ""}
                      onChange={(e) =>
                        handleBulkConnectionDetailChange("networkPatch", e.target.value)
                      }
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., 1 (will increment with each input)"
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
                {parsedBulkQuantity === 1 ? "Input" : "Inputs"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatchSheetInputs;
