import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LedPixelMapControls from "../components/pixel-map/LedPixelMapControls";
import LedPixelMapPreview from "../components/pixel-map/LedPixelMapPreview";
import { ArrowLeft, Save, Download, Loader, AlertCircle } from "lucide-react";
import { gcd } from "../utils/math";
import { supabase, savePixelMap } from "../lib/supabase";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [mapData, setMapData] = useState<LedPixelMapData>({
    projectName: "My Awesome Show",
    screenName: "Main LED Wall",
    mapWidth: 16,
    mapHeight: 9,
    halfHeightRow: false,
    panelWidth: 120,
    panelHeight: 120,
    panelType: "custom",
  });

  const [previewOptions, setPreviewOptions] = useState<PreviewOptions>({
    displayMode: "grid",
    showScreenInfo: true,
    showStats: true,
    showFooter: true,
    showGuides: true,
  });

  const backPath = location.state?.from || "/video";

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const screenWidth = mapData.mapWidth * mapData.panelWidth;
  const screenHeight = mapData.mapHeight * mapData.panelHeight;
  const divisor = screenWidth > 0 && screenHeight > 0 ? gcd(screenWidth, screenHeight) : 1;
  const aspectWidth = screenWidth / divisor;
  const aspectHeight = screenHeight / divisor;

  const isDataValid =
    mapData.mapWidth > 0 &&
    mapData.mapHeight > 0 &&
    mapData.panelWidth > 0 &&
    mapData.panelHeight > 0 &&
    mapData.projectName.trim() !== "" &&
    mapData.screenName.trim() !== "";

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
        mapType: "led",
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
        },
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
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error(sessionError?.message || "Authentication error: Not logged in.");
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/led-map-to-png`;
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
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
        } catch (e) {
          /* Not a JSON response, use raw text */
        }
        throw new Error(`Server returned status ${response.status}: ${serverError}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${mapData.projectName}_${mapData.screenName}_${screenWidth}x${screenHeight}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      console.error("Failed to download image:", err);
      setSaveError(`Download failed. ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} />
      <main className="flex-grow container mx-auto px-4 py-6 md:py-12 mt-16 md:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(backPath)}
              className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">LED Video Wall Editor</h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Design and configure complex LED displays
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 sm:ml-auto flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading || !isDataValid}
              className="inline-flex items-center bg-transparent border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-70"
            >
              {downloading ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !user || !isDataValid}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </button>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{saveError}</p>
          </div>
        )}
        {saveSuccess && (
          <div className="bg-green-400/10 border border-green-400 rounded-lg p-4 mb-4 flex items-start">
            <Save className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-green-400 text-sm">Pixel map saved successfully!</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl font-medium text-white">LED Video Wall Configuration</h2>
            <p className="text-gray-400 text-sm">
              Configure your LED panel layout and display settings
            </p>
          </div>
          <div className="p-4 md:p-6">
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
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <LedPixelMapPreview
                    {...mapData}
                    {...previewOptions}
                    aspectWidth={aspectWidth}
                    aspectHeight={aspectHeight}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center py-8">
          <button
            onClick={handleSave}
            disabled={saving || !user || !isDataValid}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg text-base"
          >
            {saving ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Saving Pixel Map...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Pixel Map
              </>
            )}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LedPixelMapEditor;
