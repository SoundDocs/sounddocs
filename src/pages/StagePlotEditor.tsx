import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import StageCanvas from "../components/stage-plot/StageCanvas";
import ElementToolbar from "../components/stage-plot/ElementToolbar";
import ElementProperties from "../components/stage-plot/ElementProperties";
import MobileScreenWarning from "../components/MobileScreenWarning";
import { useScreenSize } from "../hooks/useScreenSize";
import { StageElementProps } from "../components/stage-plot/StageElement";
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  Eye,
  Image,
  Upload,
  XCircle,
  Sliders as SliderIcon, // Renamed to avoid conflict
  RefreshCw, // For reset button
  Move,
  Maximize,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { getSharedResource, updateSharedResource } from "../lib/shareUtils";

const STAGE_DEPTHS = ["x-small", "small", "medium", "large", "x-large"] as const;
const STAGE_WIDTHS = ["narrow", "wide"] as const;

type StageDepth = (typeof STAGE_DEPTHS)[number];
type StageWidth = (typeof STAGE_WIDTHS)[number];
type StageSize = { depth: StageDepth; width: StageWidth };

function isValidStageDepth(maybeDepth: string): maybeDepth is StageDepth {
  return (STAGE_DEPTHS as readonly string[]).includes(maybeDepth);
}

function isValidStageWidth(maybeWidth: string): maybeWidth is StageWidth {
  return (STAGE_WIDTHS as readonly string[]).includes(maybeWidth);
}

function parseStageSize(stageSize: string): StageSize {
  const segments = stageSize.split("-");

  const depth = segments.slice(0, -1).join("-");
  const width = segments[segments.length - 1];

  if (!isValidStageDepth(depth)) {
    throw new Error(`Invalid stage depth: ${depth}`);
  }

  if (!isValidStageWidth(width)) {
    throw new Error(`Invalid stage width: ${width}`);
  }

  return { depth, width };
}

function stringifyStageSize(stageSize: StageSize): string {
  return `${stageSize.depth}-${stageSize.width}`;
}

const StagePlotEditor = () => {
  const { id, shareCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const screenSize = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stagePlot, setStagePlot] = useState<{ stage_size?: string; [k: string]: any } | null>(
    null,
  );
  const [stageSize, setStageSize] = useState<StageSize>(parseStageSize("medium-wide"));
  const [elements, setElements] = useState<StageElementProps[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

  // Background Image State
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(50);
  const [backgroundImageX, setBackgroundImageX] = useState(0);
  const [backgroundImageY, setBackgroundImageY] = useState(0);
  const [backgroundImageScale, setBackgroundImageScale] = useState(1);

  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // For modal preview
  const [isSharedEdit, setIsSharedEdit] = useState(false);
  const [shareLink, setShareLink] = useState<any>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const stagePlotRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isSharedEditRoute = location.pathname.includes("/shared/stage-plot/edit/");
    setIsSharedEdit(isSharedEditRoute);

    if (screenSize === "mobile" || screenSize === "tablet") {
      setIsViewMode(true);
    } else {
      setIsViewMode(false);
    }
  }, [screenSize, location.pathname]);

  const loadStagePlotData = (data: any) => {
    setStagePlot(data);
    setStageSize(
      data.stage_size && data.stage_size.includes("-")
        ? parseStageSize(data.stage_size)
        : { width: "wide", depth: data.stage_size || "medium" },
    );

    if (data.elements && Array.isArray(data.elements)) {
      const cleanedElements = data.elements.map((el: any) => ({
        ...el,
        icon: undefined,
        labelHidden: el.labelHidden || false,
      }));
      setElements(cleanedElements);
    } else {
      setElements([]);
    }

    if (data.backgroundImage) {
      setBackgroundImage(data.backgroundImage);
      setImageUrl(data.backgroundImage); // For modal preview consistency
    }
    setBackgroundOpacity(data.backgroundOpacity !== undefined ? data.backgroundOpacity : 50);
    setBackgroundImageX(data.background_image_x !== undefined ? data.background_image_x : 0);
    setBackgroundImageY(data.background_image_y !== undefined ? data.background_image_y : 0);
    setBackgroundImageScale(
      data.background_image_scale !== undefined ? data.background_image_scale : 1,
    );
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      }
    };

    const fetchStagePlot = async () => {
      setLoading(true);
      if (isSharedEdit && shareCode) {
        try {
          const { resource, shareLink: fetchedShareLink } = await getSharedResource(shareCode);
          if (fetchedShareLink.link_type !== "edit") {
            navigate(`/shared/stage-plot/${shareCode}`);
            return;
          }
          setShareLink(fetchedShareLink);
          loadStagePlotData(resource);
        } catch (error) {
          console.error("Error fetching shared stage plot:", error);
          window.location.href = "https://sounddocs.org/";
        } finally {
          setLoading(false);
        }
        return;
      }

      if (id === "new") {
        if (screenSize === "mobile" || screenSize === "tablet") {
          navigate("/dashboard");
          return;
        }
        const newPlotData = {
          name: "Untitled Stage Plot",
          created_at: new Date().toISOString(),
          stage_size: "medium-wide",
          elements: [],
          backgroundImage: null,
          backgroundOpacity: 50,
          background_image_x: 0,
          background_image_y: 0,
          background_image_scale: 1,
        };
        loadStagePlotData(newPlotData);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("stage_plots")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        loadStagePlotData(data);
      } catch (error) {
        console.error("Error fetching stage plot:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    fetchStagePlot();
  }, [id, navigate, screenSize, isSharedEdit, shareCode, location.pathname]);

  const getDefaultColorForType = (type: string): string => {
    if (type === "electric-guitar") return "#2563eb";
    if (type === "acoustic-guitar") return "#a16207";
    if (type === "bass-guitar") return "#1d4ed8";
    if (type === "keyboard") return "#0f766e";
    if (type === "drums") return "#9333ea";
    if (type === "percussion") return "#6d28d9";
    if (type === "violin") return "#c2410c";
    if (type === "cello") return "#9a3412";
    if (type === "trumpet") return "#b45309";
    if (type === "saxophone") return "#b91c1c";
    if (type === "generic-instrument") return "#2563eb";
    if (type === "custom-image") return "#6b7280";

    switch (type) {
      case "microphone": return "#4f46e5";
      case "power-strip": return "#dc2626";
      case "amplifier": return "#7e22ce";
      case "monitor-wedge": return "#16a34a";
      case "speaker": return "#0891b2";
      case "di-box": return "#eab308";
      case "iem": return "#ea580c";
      case "person": return "#be185d";
      default: return "#6b7280";
    }
  };

  const handleStageSizeChange = (size: StageSize) => {
    if (isViewMode) return;
    setStageSize(size);
  };

  const handleAddElement = (type: string, label: string) => {
    if (isViewMode) return;
    const stageCanvas = canvasRef.current?.querySelector('[class*="bg-grid-pattern"]');
    const canvasWidth = stageCanvas?.clientWidth || 600;
    const canvasHeight = stageCanvas?.clientHeight || 400;
    const newElement: StageElementProps = {
      id: uuidv4(), type, label, x: canvasWidth / 2 - 30, y: canvasHeight / 2 - 30,
      rotation: 0, color: getDefaultColorForType(type),
      customImageUrl: type === "custom-image" ? null : undefined, labelHidden: false,
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const handleSelectElement = (elementId: string | null) => {
    if (isViewMode) return;
    setSelectedElementId(elementId);
  };

  const handleElementDragStop = (elementId: string, x: number, y: number) => {
    if (isViewMode) return;
    setElements(elements.map((el) => (el.id === elementId ? { ...el, x, y } : el)));
  };

  const handleElementRotate = (elementId: string, rotation: number) => {
    if (isViewMode) return;
    setElements(elements.map((el) => (el.id === elementId ? { ...el, rotation } : el)));
  };

  const handleElementLabelChange = (elementId: string, label: string) => {
    if (isViewMode) return;
    setElements(elements.map((el) => (el.id === elementId ? { ...el, label } : el)));
  };

  const handleElementDelete = (elementId: string) => {
    if (isViewMode) return;
    setElements(elements.filter((el) => el.id !== elementId));
    if (selectedElementId === elementId) setSelectedElementId(null);
  };

  const handleElementDuplicate = (elementId: string) => {
    if (isViewMode) return;
    const elementToDuplicate = elements.find((el) => el.id === elementId);
    if (!elementToDuplicate) return;
    const newElement = { ...elementToDuplicate, id: uuidv4(), x: elementToDuplicate.x + 20, y: elementToDuplicate.y + 20 };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const handleElementResize = (elementId: string, width: number, height: number) => {
    if (isViewMode) return;
    setElements(elements.map((el) => (el.id === elementId ? { ...el, width, height } : el)));
  };

  const handlePropertyChange = (elementId: string, property: string, value: any) => {
    if (isViewMode) return;
    setElements(elements.map((el) => (el.id === elementId ? { ...el, [property]: value } : el)));
  };

  const handleSave = async () => {
    if (isViewMode) return;
    setSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      const cleanedElements = elements.map(({ icon, ...rest }) => rest);
      const stagePlotData = {
        ...stagePlot,
        elements: cleanedElements,
        stage_size: stringifyStageSize(stageSize),
        backgroundImage: backgroundImage,
        backgroundOpacity: backgroundOpacity,
        background_image_x: backgroundImageX,
        background_image_y: backgroundImageY,
        background_image_scale: backgroundImageScale,
        last_edited: new Date().toISOString(),
      };

      if (isSharedEdit && shareCode) {
        const result = await updateSharedResource(shareCode, "stage_plot", stagePlotData);
        if (result) {
          setStagePlot(stagePlotData); // Update local state to reflect saved data
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } else if (user) {
        if (id === "new") {
          const { data: newPlot, error } = await supabase
            .from("stage_plots")
            .insert([{ ...stagePlotData, user_id: user.id }])
            .select()
            .single();
          if (error) throw error;
          if (newPlot) {
            navigate(`/stage-plot/${newPlot.id}`);
            loadStagePlotData(newPlot); // Ensure local state matches db
          }
        } else {
          const { data: updatedPlot, error } = await supabase
            .from("stage_plots")
            .update(stagePlotData)
            .eq("id", id)
            .select()
            .single();
          if (error) throw error;
          if (updatedPlot) loadStagePlotData(updatedPlot); // Ensure local state matches db
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      }
    } catch (error) {
      console.error("Error saving stage plot:", error);
      setSaveError("Error saving stage plot. Please try again.");
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    if (isViewMode) return;
    if (window.confirm("Are you sure you want to clear all elements from the stage plot?")) {
      setElements([]);
      setSelectedElementId(null);
    }
  };

  const handleRemoveBackgroundImage = () => {
    if (isViewMode) return;
    setBackgroundImage(null);
    setImageUrl(null); // Clear modal preview as well
    setBackgroundImageX(0);
    setBackgroundImageY(0);
    setBackgroundImageScale(1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be less than 5MB"); return; }
    if (!file.type.startsWith("image/")) { alert("Please select an image file"); return; }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target?.result) return;
      const newImageUrl = evt.target.result as string;
      setImageUrl(newImageUrl); // For modal preview
      setBackgroundImage(newImageUrl); // For canvas
      // Reset transform for new image
      setBackgroundImageX(0);
      setBackgroundImageY(0);
      setBackgroundImageScale(1);
      // setShowImageUpload(false); // Keep modal open to adjust transform
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingImage(true); };
  const handleDragLeave = () => { setIsDraggingImage(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be less than 5MB"); return; }
    if (!file.type.startsWith("image/")) { alert("Please select an image file"); return; }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target?.result) return;
      const newImageUrl = evt.target.result as string;
      setImageUrl(newImageUrl);
      setBackgroundImage(newImageUrl);
      setBackgroundImageX(0);
      setBackgroundImageY(0);
      setBackgroundImageScale(1);
      // setShowImageUpload(false); // Keep modal open
    };
    reader.readAsDataURL(file);
  };

  const handleResetBgTransform = () => {
    setBackgroundImageX(0);
    setBackgroundImageY(0);
    setBackgroundImageScale(1);
  };

  const getSelectedElement = () => {
    if (!selectedElementId) return null;
    return elements.find((el) => el.id === selectedElementId) || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if ((screenSize === "mobile" || screenSize === "tablet") && id === "new") {
    return (
      <MobileScreenWarning
        title="Not Available on Mobile"
        description="Creating stage plots is only available on desktop devices. Please use a computer to create a new stage plot."
        continueAnyway={false} returnPath="/dashboard" editorType="stage"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {(screenSize === "mobile" || screenSize === "tablet") && (
        <MobileScreenWarning
          title="View-Only Mode"
          description={id === "new" ? "Creating stage plots requires a desktop device." : "You can view this stage plot, but editing is only available on desktop devices."}
          continueAnyway={true} returnPath="/dashboard" editorType="stage"
        />
      )}
      <Header dashboard={!isSharedEdit} />
      <main className="flex-grow container mx-auto px-4 py-4 md:py-8 mt-16 md:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-4">
          <div className="flex items-center">
            <button
              onClick={() => isSharedEdit ? (window.location.href = `https://sounddocs.org/shared/stage-plot/${shareCode}`) : navigate("/dashboard")}
              className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors"
            ><ArrowLeft className="h-5 w-5" /></button>
            <div>
              <input
                type="text" value={stagePlot?.name || "Untitled Stage Plot"}
                onChange={(e) => !isViewMode && setStagePlot({ ...stagePlot, name: e.target.value })}
                className={`text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full max-w-[220px] sm:max-w-none ${isViewMode ? "cursor-default" : ""}`}
                placeholder="Enter stage plot name" readOnly={isViewMode}
              />
              <p className="text-xs sm:text-sm text-gray-400">Last edited: {new Date(stagePlot?.last_edited || stagePlot?.created_at).toLocaleString()}</p>
            </div>
          </div>
          {isViewMode && (<div className="sm:ml-auto flex items-center text-sm text-indigo-400 bg-indigo-900/30 px-3 py-1 rounded-full"><Eye className="h-4 w-4 mr-2" />View mode</div>)}
          {!isViewMode && (
            <div className="flex flex-wrap gap-3 sm:ml-auto">
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed">
                {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />Saving...</>) : (<><Save className="h-4 w-4 mr-2" />Save</>)}
              </button>
              <button onClick={() => setShowImageUpload(!showImageUpload)} className="inline-flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200" title="Manage background image">
                <Image className="h-4 w-4 mr-2" />{backgroundImage ? "Image Settings" : "Add Image"}
              </button>
              <button onClick={handleClearAll} className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200">
                <Trash2 className="h-4 w-4 mr-2" />Clear All
              </button>
            </div>
          )}
        </div>

        {saveError && (<div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-4 flex items-start"><AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" /><p className="text-red-400">{saveError}</p></div>)}
        {saveSuccess && (<div className="bg-green-400/10 border border-green-400 rounded-lg p-4 mb-4 flex items-start"><Save className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" /><p className="text-green-400">Stage plot saved successfully!</p></div>)}
        <div className="bg-indigo-500/10 border border-indigo-400 rounded-lg p-3 md:p-4 mb-4 md:mb-6 flex items-start text-xs md:text-sm">
          <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-indigo-400 mr-2 md:mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-indigo-200"><strong className="font-medium">Export Tip:</strong> To download your stage plot as an image, use the download button from the Dashboard.</p>
        </div>

        {showImageUpload && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Background Image Settings</h3>
              <button className="text-gray-400 hover:text-white" onClick={() => setShowImageUpload(false)}><XCircle className="h-5 w-5" /></button>
            </div>
            {!imageUrl && (
              <div className={`image-upload-container mb-6 ${isDraggingImage ? "drag-active" : ""}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} />
                <Upload className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                <p className="text-gray-300 mb-2">Drag and drop an image here, or click to select</p>
                <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200">Select Image</button>
              </div>
            )}
            {imageUrl && (
              <>
                <div className="mb-6">
                  <div className="bg-gray-750 p-4 rounded-md">
                    <p className="text-sm text-gray-300 mb-2">Preview:</p>
                    <div className="aspect-video mb-4 overflow-hidden rounded-md relative bg-gray-700">
                      <img src={imageUrl} alt="Background Preview" className="object-contain w-full h-full" style={{ opacity: backgroundOpacity / 100, transform: `translate(${backgroundImageX}px, ${backgroundImageY}px) scale(${backgroundImageScale})`, transformOrigin: 'top left' }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Position X (px)</label>
                    <div className="flex items-center space-x-2">
                       <Move className="h-4 w-4 text-gray-400" />
                       <input type="number" value={backgroundImageX} onChange={(e) => setBackgroundImageX(parseInt(e.target.value))} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Position Y (px)</label>
                     <div className="flex items-center space-x-2">
                       <Move className="h-4 w-4 text-gray-400" />
                       <input type="number" value={backgroundImageY} onChange={(e) => setBackgroundImageY(parseInt(e.target.value))} className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-300 text-sm mb-1">Scale: {Number(backgroundImageScale).toFixed(2)}x</label>
                  <div className="flex items-center space-x-2">
                    <Maximize className="h-4 w-4 text-gray-400" />
                    <input type="range" min="0.1" max="3" step="0.05" value={backgroundImageScale} onChange={(e) => setBackgroundImageScale(parseFloat(e.target.value))} className="w-full" />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-300 text-sm mb-1">Opacity: {backgroundOpacity}%</label>
                  <div className="flex items-center space-x-2">
                    <SliderIcon className="h-4 w-4 text-gray-400" />
                    <input type="range" min="5" max="100" value={backgroundOpacity} onChange={(e) => setBackgroundOpacity(parseInt(e.target.value))} className="w-full" />
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex gap-3">
                    <button onClick={handleResetBgTransform} className="inline-flex items-center bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm">
                      <RefreshCw className="h-4 w-4 mr-2" /> Reset Transform
                    </button>
                    <button onClick={handleRemoveBackgroundImage} className="inline-flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm">
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </button>
                  </div>
                  <button onClick={() => setShowImageUpload(false)} className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm">
                    Apply & Close
                  </button>
                </div>
                 <button onClick={() => fileInputRef.current?.click()} className="mt-4 w-full text-center bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm">
                    Change Image File
                  </button>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} />
              </>
            )}
          </div>
        )}

        {/* Quick controls when modal is closed but image exists - might be removed if too cluttered */}
        {backgroundImage && !showImageUpload && !isViewMode && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-300 text-sm">Background image active.</p>
              <button onClick={() => setShowImageUpload(true)} className="inline-flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md font-medium text-sm">
                <SliderIcon className="h-4 w-4 mr-2" /> Image Settings
              </button>
            </div>
          </div>
        )}

        <div className="mb-4 md:mb-8" ref={stagePlotRef}>
          <div className="bg-gray-850 rounded-lg overflow-hidden" ref={canvasRef}>
            <StageCanvas
              stageSize={stringifyStageSize(stageSize)}
              elements={elements}
              selectedElementId={selectedElementId}
              backgroundImage={backgroundImage}
              backgroundOpacity={backgroundOpacity}
              backgroundImageX={backgroundImageX}
              backgroundImageY={backgroundImageY}
              backgroundImageScale={backgroundImageScale}
              onSelectElement={handleSelectElement}
              onElementDragStop={handleElementDragStop}
              onElementRotate={handleElementRotate}
              onElementLabelChange={handleElementLabelChange}
              onElementDelete={handleElementDelete}
              onElementDuplicate={handleElementDuplicate}
              onElementResize={handleElementResize}
            />
          </div>
        </div>

        {!isViewMode && (
          <>
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Stage Size</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <h4 className="text-sm text-gray-400 mb-2">Width</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button className={`px-3 py-2 rounded-md text-sm ${stageSize.width === "narrow" ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`} onClick={() => { handleStageSizeChange({ ...stageSize, width: "narrow" }); }}>Narrow</button>
                    <button className={`px-3 py-2 rounded-md text-sm ${stageSize.width === "wide" ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`} onClick={() => { handleStageSizeChange({ ...stageSize, width: "wide" }); }}>Wide</button>
                  </div>
                </div>
                <div className="md:col-span-4">
                  <h4 className="text-sm text-gray-400 mb-2">Stage Depth</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {STAGE_DEPTHS.map((depth) => (<button key={depth} className={`px-3 py-2 rounded-md text-sm ${stageSize.depth === depth ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`} onClick={() => handleStageSizeChange({ ...stageSize, depth })}>{depth.replace("x-", "X-")}</button>))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><ElementProperties selectedElement={getSelectedElement()} onPropertyChange={handlePropertyChange} /></div>
              <div><ElementToolbar onAddElement={handleAddElement} /></div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StagePlotEditor;
