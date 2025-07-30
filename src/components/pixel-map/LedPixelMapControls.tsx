import React from 'react';
import { LedPixelMapData, PreviewOptions } from '../../pages/LedPixelMapEditor';
import { gcd } from '../../utils/math';
import { Eye, EyeOff } from 'lucide-react';

interface LedPixelMapControlsProps {
  mapData: LedPixelMapData;
  setMapData: React.Dispatch<React.SetStateAction<LedPixelMapData>>;
  previewOptions: PreviewOptions;
  setPreviewOptions: React.Dispatch<React.SetStateAction<PreviewOptions>>;
}

const LedPixelMapControls: React.FC<LedPixelMapControlsProps> = ({ mapData, setMapData, previewOptions, setPreviewOptions }) => {
  const inputClasses = "w-full bg-neutral-700/50 border border-border text-text rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-textSecondary transition-colors";

  const totalPanels = mapData.mapWidth * mapData.mapHeight;
  const screenWidth = mapData.mapWidth * mapData.panelWidth;
  const screenHeight = mapData.mapHeight * mapData.panelHeight;
  const totalPixels = screenWidth * screenHeight;

  const divisor = (screenWidth > 0 && screenHeight > 0) ? gcd(screenWidth, screenHeight) : 1;
  const aspectWidth = screenWidth / divisor;
  const aspectHeight = screenHeight / divisor;

  const handleMapDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      // Allow the input to be cleared. An empty string for a number input is parsed as NaN.
      // We'll represent an empty input as 0 in our state.
      const numValue = parseInt(value, 10);
      setMapData(prevData => ({
          ...prevData,
          [name]: isNaN(numValue) ? 0 : numValue,
      }));
    } else {
      setMapData(prevData => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handlePreviewOptionsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setPreviewOptions(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const ToggleSwitch: React.FC<{ name: keyof PreviewOptions; label: string }> = ({ name, label }) => (
    <div className="flex items-center justify-between">
      <label htmlFor={name} className="text-sm font-medium text-textSecondary">{label}</label>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          name={name}
          id={name}
          checked={!!previewOptions[name]}
          onChange={handlePreviewOptionsChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-neutral-700/50 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );

  return (
    <div className="bg-surface p-6 rounded-xl space-y-6">
      <h2 className="text-xl font-bold text-text border-b border-border pb-3">Map Configuration</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Project Details</h3>
            <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-textSecondary mb-1">Project Name</label>
                <input type="text" name="projectName" id="projectName" value={mapData.projectName} onChange={handleMapDataChange} className={inputClasses} placeholder="e.g., Summer Tour 2025" />
            </div>
            <div>
                <label htmlFor="screenName" className="block text-sm font-medium text-textSecondary mb-1">Screen Name</label>
                <input type="text" name="screenName" id="screenName" value={mapData.screenName} onChange={handleMapDataChange} className={inputClasses} placeholder="e.g., Main Stage Left" />
            </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-lg font-semibold text-text">Dimensions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="mapWidth" className="block text-sm font-medium text-textSecondary mb-1">Map Width</label>
                <input type="number" name="mapWidth" id="mapWidth" value={mapData.mapWidth || ''} onChange={handleMapDataChange} className={inputClasses} placeholder="e.g. 16" />
              </div>
              <div>
                <label htmlFor="mapHeight" className="block text-sm font-medium text-textSecondary mb-1">Map Height</label>
                <input type="number" name="mapHeight" id="mapHeight" value={mapData.mapHeight || ''} onChange={handleMapDataChange} className={inputClasses} placeholder="e.g. 9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="panelWidth" className="block text-sm font-medium text-textSecondary mb-1">Panel Width (px)</label>
                <input type="number" name="panelWidth" id="panelWidth" value={mapData.panelWidth || ''} onChange={handleMapDataChange} className={inputClasses} placeholder="e.g. 120" />
              </div>
              <div>
                <label htmlFor="panelHeight" className="block text-sm font-medium text-textSecondary mb-1">Panel Height (px)</label>
                <input type="number" name="panelHeight" id="panelHeight" value={mapData.panelHeight || ''} onChange={handleMapDataChange} className={inputClasses} placeholder="e.g. 120" />
              </div>
            </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg font-semibold text-text">Preview Options</h3>
          <div>
            <label htmlFor="displayMode" className="block text-sm font-medium text-textSecondary mb-1">Display Mode</label>
            <select name="displayMode" id="displayMode" value={previewOptions.displayMode} onChange={handlePreviewOptionsChange} className={inputClasses}>
              <option value="grid">Panel Grid</option>
              <option value="tetris">Tetris</option>
              <option value="gradient">Vibrant Gradient</option>
              <option value="gradient-pastel">Pastel Gradient</option>
              <option value="gradient-evil">Evil Gradient</option>
              <option value="gradient-ocean">Ocean Gradient</option>
            </select>
          </div>
          <div className="space-y-3 pt-2">
            <ToggleSwitch name="showGuides" label="Guide Lines" />
            <ToggleSwitch name="showScreenInfo" label="Screen Info" />
            <ToggleSwitch name="showStats" label="Stats Overlay" />
            <ToggleSwitch name="showFooter" label="Footer" />
          </div>
        </div>
        
        <div className="text-sm text-textSecondary space-y-2 pt-4 border-t border-border">
          <div className="flex justify-between"><span>Total Panels:</span> <span className="font-mono text-text">{totalPanels}</span></div>
          <div className="flex justify-between"><span>Screen Dimensions:</span> <span className="font-mono text-text">{screenWidth > 0 && screenHeight > 0 ? `${screenWidth}x${screenHeight}px` : 'N/A'}</span></div>
          <div className="flex justify-between"><span>Aspect Ratio:</span> <span className="font-mono text-text">{screenWidth > 0 && screenHeight > 0 ? `${aspectWidth}:${aspectHeight}` : 'N/A'}</span></div>
          <div className="flex justify-between"><span>Total Pixels:</span> <span className="font-mono text-text">{totalPixels.toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  );
};

export default LedPixelMapControls;
