import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LedPixelMapControls from '../components/pixel-map/LedPixelMapControls';
import LedPixelMapPreview from '../components/pixel-map/LedPixelMapPreview';
import { ArrowLeft, Save, Download, Loader, AlertCircle } from 'lucide-react';
import { gcd } from '../utils/math';
import { supabase, savePixelMap } from '../lib/supabase';

export interface LedPixelMapData {
  projectName: string;
  screenName: string;
  mapWidth: number;
  mapHeight: number;
  halfHeightRow: boolean;
  panelWidth: number;
  panelHeight: number;
  panelType: string;
}

export interface PreviewOptions {
  displayMode: string;
  showScreenInfo: boolean;
  showStats: boolean;
  showFooter: boolean;
  showGuides: boolean;
}

const LedPixelMapEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [mapData, setMapData] = useState<LedPixelMapData>({
    projectName: 'My Awesome Show',
    screenName: 'Main LED Wall',
    mapWidth: 16,
    mapHeight: 9,
    halfHeightRow: false,
    panelWidth: 120,
    panelHeight: 120,
    panelType: 'custom',
  });

  const [previewOptions, setPreviewOptions] = useState<PreviewOptions>({
    displayMode: 'grid',
    showScreenInfo: true,
    showStats: true,
    showFooter: true,
    showGuides: true,
  });

  const backPath = location.state?.from || '/video';

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const screenWidth = mapData.mapWidth * mapData.panelWidth;
  const screenHeight = mapData.mapHeight * mapData.panelHeight;
  const divisor = (screenWidth > 0 && screenHeight > 0) ? gcd(screenWidth, screenHeight) : 1;
  const aspectWidth = screenWidth / divisor;
  const aspectHeight = screenHeight / divisor;

  const isDataValid = mapData.mapWidth > 0 && mapData.mapHeight > 0 && mapData.panelWidth > 0 && mapData.panelHeight > 0 && mapData.projectName.trim() !== '' && mapData.screenName.trim() !== '';

  const handleSave = async () => {
    if (!user || !isDataValid) {
      setSaveError("User not logged in or data is invalid.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await savePixelMap({
        userId: user.id,
        mapType: 'led',
        projectName: mapData.projectName,
        screenName: mapData.screenName,
        aspectRatioW: aspectWidth,
        aspectRatioH: aspectHeight,
        resolutionW: screenWidth,
        resolutionH: screenHeight,
        settings: {
          mapWidth: mapData.mapWidth,
          mapHeight: mapData.mapHeight,
          panelWidth: mapData.panelWidth,
          panelHeight: mapData.panelHeight,
          panelType: mapData.panelType,
          halfHeightRow: mapData.halfHeightRow,
          previewOptions: previewOptions,
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Failed to save map:", error);
      setSaveError(`Failed to save map: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!isDataValid) {
      setSaveError("Cannot download, map data is invalid.");
      return;
    }
    setDownloading(true);
    setSaveError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error(sessionError?.message || "Authentication error: Not logged in.");
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/led-map-to-png`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...mapData,
          ...previewOptions,
          aspectWidth,
          aspectHeight,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let serverError = errorBody;
        try {
          const errorJson = JSON.parse(errorBody);
          serverError = errorJson.error || errorBody;
        } catch (e) { /* Not a JSON response, use raw text */ }
        throw new Error(`Server returned status ${response.status}: ${serverError}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${mapData.projectName}_${mapData.screenName}_${screenWidth}x${screenHeight}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (err: any) {
      console.error('Failed to download image:', err);
      setSaveError(`Download failed. ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(backPath)}
              className="flex items-center text-textSecondary hover:text-text transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text">LED Video Wall Editor</h1>
              <p className="text-sm text-textSecondary">Design and configure complex LED displays</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading || !isDataValid}
              className="inline-flex items-center bg-transparent border border-secondary text-secondary hover:bg-secondary/10 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {downloading ? <Loader className="animate-spin h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Download
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !user || !isDataValid}
              className="inline-flex items-center bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <Loader className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </button>
          </div>
        </div>

        {saveError && (
          <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg relative mb-4 flex items-center" role="alert">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="block sm:inline">{saveError}</span>
          </div>
        )}
        {saveSuccess && (
          <div className="bg-success/10 border border-success text-success px-4 py-3 rounded-lg relative mb-4 flex items-center" role="alert">
            <Save className="h-5 w-5 mr-2" />
            <span className="block sm:inline">Pixel map saved successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <LedPixelMapControls 
              mapData={mapData} 
              setMapData={setMapData} 
              previewOptions={previewOptions}
              setPreviewOptions={setPreviewOptions}
            />
          </div>
          <div className="lg:col-span-2">
            <div className="bg-surface p-4 rounded-xl sticky top-24">
              <LedPixelMapPreview 
                {...mapData} 
                {...previewOptions}
                aspectWidth={aspectWidth}
                aspectHeight={aspectHeight}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LedPixelMapEditor;
