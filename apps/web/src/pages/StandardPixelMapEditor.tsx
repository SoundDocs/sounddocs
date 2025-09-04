import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PixelMapControls from "../components/pixel-map/PixelMapControls";
import StandardPixelMapPreview from "../components/pixel-map/StandardPixelMapPreview";
import { ArrowLeft, Save, Download, Loader, AlertCircle } from "lucide-react";

export interface PixelMapData {
  project_name: string;
  screen_name: string;
  aspect_ratio_preset: string;
  aspect_ratio_w: number;
  aspect_ratio_h: number;
  resolution_preset: string;
  resolution_w: number;
  resolution_h: number;
}

const StandardPixelMapEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<PixelMapData>({
    project_name: "My Awesome Show",
    screen_name: "Center Screen",
    aspect_ratio_preset: "16:9",
    aspect_ratio_w: 16,
    aspect_ratio_h: 9,
    resolution_preset: "1920x1080",
    resolution_w: 1920,
    resolution_h: 1080,
  });
  const [showColorSwatches, setShowColorSwatches] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [gridColor, setGridColor] = useState("#FFFFFF");

  const backPath = location.state?.from || "/video";

  useEffect(() => {
    const fetchUserAndData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);

      if (id !== "new") {
        try {
          const { data, error } = await supabase
            .from("pixel_maps")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

          if (error) throw error;

          setMapData({
            project_name: data.project_name,
            screen_name: data.screen_name,
            aspect_ratio_preset: `${data.aspect_ratio_w}:${data.aspect_ratio_h}`,
            aspect_ratio_w: data.aspect_ratio_w,
            aspect_ratio_h: data.aspect_ratio_h,
            resolution_preset: `${data.resolution_w}x${data.resolution_h}`,
            resolution_w: data.resolution_w,
            resolution_h: data.resolution_h,
          });
        } catch (error) {
          console.error("Error fetching pixel map:", error);
          navigate("/video");
        }
      }
      setLoading(false);
    };

    fetchUserAndData();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!user) {
      setSaveError("You must be logged in to save.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const dataToSave = {
      user_id: user.id,
      map_type: "standard",
      project_name: mapData.project_name,
      screen_name: mapData.screen_name,
      aspect_ratio_w: mapData.aspect_ratio_w,
      aspect_ratio_h: mapData.aspect_ratio_h,
      resolution_w: mapData.resolution_w,
      resolution_h: mapData.resolution_h,
      last_edited: new Date().toISOString(),
    };

    try {
      if (id === "new") {
        const { data, error } = await supabase
          .from("pixel_maps")
          .insert(dataToSave)
          .select("id")
          .single();
        if (error) throw error;
        setSaveSuccess(true);
        navigate(`/pixel-map/standard/${data.id}`, { replace: true, state: { from: backPath } });
      } else {
        const { error } = await supabase.from("pixel_maps").update(dataToSave).eq("id", id);
        if (error) throw error;
        setSaveSuccess(true);
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setSaveError(`Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
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

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/svg-to-png`;
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          project_name: mapData.project_name,
          screen_name: mapData.screen_name,
          resolution_w: mapData.resolution_w,
          resolution_h: mapData.resolution_h,
          showColorSwatches: showColorSwatches,
          showGrid: showGrid,
          gridColor: gridColor,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let serverError = errorBody;
        try {
          const errorJson = JSON.parse(errorBody);
          serverError = errorJson.error || errorBody;
        } catch (e) {
          // Not a JSON response, use the raw text.
        }
        throw new Error(`Server returned status ${response.status}: ${serverError}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${mapData.project_name}_${mapData.screen_name}_${mapData.resolution_w}x${mapData.resolution_h}.png`;
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
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Standard Pixel Map Editor
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Create test patterns for projectors and LCDs
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 sm:ml-auto flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
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
              disabled={saving}
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
            <h2 className="text-xl font-medium text-white">Pixel Map Configuration</h2>
            <p className="text-gray-400 text-sm">
              Configure your display settings and test patterns
            </p>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <PixelMapControls
                  mapData={mapData}
                  setMapData={setMapData}
                  showColorSwatches={showColorSwatches}
                  setShowColorSwatches={setShowColorSwatches}
                  showGrid={showGrid}
                  setShowGrid={setShowGrid}
                  gridColor={gridColor}
                  setGridColor={setGridColor}
                />
              </div>
              <div className="lg:col-span-2">
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <StandardPixelMapPreview
                    {...mapData}
                    showColorSwatches={showColorSwatches}
                    showGrid={showGrid}
                    gridColor={gridColor}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center py-8">
          <button
            onClick={handleSave}
            disabled={saving}
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

export default StandardPixelMapEditor;
