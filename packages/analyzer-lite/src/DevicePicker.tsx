import React, { useState, useEffect } from "react";
import { Mic, MicOff, AlertCircle, CheckCircle, Loader } from "lucide-react";

export interface AudioDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface DevicePickerProps {
  onDeviceSelected?: (device: AudioDevice, stream: MediaStream) => void;
  onError?: (error: string) => void;
  className?: string;
}

type PermissionState = "prompt" | "granted" | "denied";
type DeviceState = "loading" | "no-devices" | "available" | "error";

export const DevicePicker: React.FC<DevicePickerProps> = ({
  onDeviceSelected,
  onError,
  className = "",
}) => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<AudioDevice | null>(null);
  const [deviceState, setDeviceState] = useState<DeviceState>("loading");
  const [permissionState, setPermissionState] = useState<PermissionState>("prompt");
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Check if the browser supports the required APIs
  const isSupported = () => {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof navigator.mediaDevices.enumerateDevices === "function"
    );
  };

  // Load available audio input devices
  const loadDevices = async () => {
    if (!isSupported()) {
      setDeviceState("error");
      setErrorMessage("Your browser does not support audio input access.");
      onError?.("Browser not supported");
      return;
    }

    try {
      setDeviceState("loading");
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = deviceInfos
        .filter((device) => device.kind === "audioinput" && device.deviceId !== "default")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          groupId: device.groupId || "",
        }));

      if (audioInputs.length === 0) {
        setDeviceState("no-devices");
      } else {
        setDevices(audioInputs);
        setDeviceState("available");
      }
    } catch (error) {
      console.error("Error enumerating devices:", error);
      setDeviceState("error");
      setErrorMessage("Failed to load audio devices. Please check your permissions.");
      onError?.("Failed to enumerate devices");
    }
  };

  // Request microphone permission and get stream
  const connectToDevice = async (device: AudioDevice) => {
    if (!device) return;

    setIsConnecting(true);
    setErrorMessage("");

    try {
      // Stop any existing stream
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
        setCurrentStream(null);
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: device.deviceId ? { exact: device.deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      setCurrentStream(stream);
      setSelectedDevice(device);
      setPermissionState("granted");
      onDeviceSelected?.(device, stream);

      // Reload devices to get proper labels after permission is granted
      await loadDevices();
    } catch (error: any) {
      console.error("Error accessing microphone:", error);

      if (error.name === "NotAllowedError") {
        setPermissionState("denied");
        setErrorMessage("Microphone access denied. Please allow microphone access and try again.");
      } else if (error.name === "NotFoundError") {
        setErrorMessage("Selected microphone not found. It may have been disconnected.");
      } else if (error.name === "NotReadableError") {
        setErrorMessage("Microphone is already in use by another application.");
      } else {
        setErrorMessage(`Failed to access microphone: ${error.message || "Unknown error"}`);
      }

      onError?.(error.message || "Microphone access failed");
    } finally {
      setIsConnecting(false);
    }
  };

  // Stop current stream and disconnect
  const disconnect = () => {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      setCurrentStream(null);
    }
    setSelectedDevice(null);
    setPermissionState("prompt");
  };

  // Load devices on component mount
  useEffect(() => {
    loadDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      loadDevices();
    };

    navigator.mediaDevices?.addEventListener("devicechange", handleDeviceChange);

    return () => {
      // Cleanup: stop any active streams
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      navigator.mediaDevices?.removeEventListener("devicechange", handleDeviceChange);
    };
  }, []);

  // Render loading state
  if (deviceState === "loading") {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <Loader className="h-6 w-6 text-indigo-400 animate-spin mr-3" />
          <span className="text-white">Loading audio devices...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (deviceState === "error" || !isSupported()) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center text-red-400 mb-4">
          <AlertCircle className="h-6 w-6 mr-3" />
          <span className="font-medium">Audio Device Error</span>
        </div>
        <p className="text-gray-300 mb-4">{errorMessage}</p>
        <button
          onClick={loadDevices}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render no devices state
  if (deviceState === "no-devices") {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center text-yellow-400 mb-4">
          <MicOff className="h-6 w-6 mr-3" />
          <span className="font-medium">No Audio Devices Found</span>
        </div>
        <p className="text-gray-300 mb-4">
          No microphones detected. Please connect an audio input device and try again.
        </p>
        <button
          onClick={loadDevices}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  // Render device selection
  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <Mic className="h-6 w-6 text-indigo-400 mr-3" />
        <h3 className="text-xl font-semibold text-white">Audio Input</h3>
      </div>

      {/* Current connection status */}
      {selectedDevice && permissionState === "granted" && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center text-green-400 mb-2">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Connected</span>
          </div>
          <p className="text-green-300 text-sm">Using: {selectedDevice.label}</p>
          <button
            onClick={disconnect}
            className="mt-3 px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Device list */}
      <div className="space-y-3">
        <h4 className="text-lg font-medium text-gray-300 mb-3">Available Devices:</h4>
        {devices.map((device) => (
          <div
            key={device.deviceId}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              selectedDevice?.deviceId === device.deviceId
                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mic className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium">{device.label}</p>
                  <p className="text-sm opacity-75">ID: {device.deviceId.slice(0, 16)}...</p>
                </div>
              </div>
              <button
                onClick={() => connectToDevice(device)}
                disabled={
                  isConnecting ||
                  (selectedDevice?.deviceId === device.deviceId && permissionState === "granted")
                }
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedDevice?.deviceId === device.deviceId && permissionState === "granted"
                    ? "bg-green-600 text-white cursor-not-allowed"
                    : isConnecting
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {isConnecting ? (
                  <div className="flex items-center">
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Connecting...
                  </div>
                ) : selectedDevice?.deviceId === device.deviceId &&
                  permissionState === "granted" ? (
                  "Connected"
                ) : (
                  "Select"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Permission denied state */}
      {permissionState === "denied" && (
        <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm mb-3">
            Microphone access was denied. To use the analyzer, please:
          </p>
          <ol className="text-red-300 text-sm list-decimal list-inside space-y-1 mb-4">
            <li>Click the microphone icon in your browser's address bar</li>
            <li>Select "Allow" for microphone access</li>
            <li>Refresh this page</li>
          </ol>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
          >
            Refresh Page
          </button>
        </div>
      )}
    </div>
  );
};

export default DevicePicker;
