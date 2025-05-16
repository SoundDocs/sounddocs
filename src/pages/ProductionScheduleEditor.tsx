import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductionScheduleHeader from "../components/production-schedule/ProductionScheduleHeader";
import ProductionScheduleCrewKey, { CrewKeyItem } from "../components/production-schedule/ProductionScheduleCrewKey";
import ProductionScheduleTable, { ScheduleItem } from "../components/production-schedule/ProductionScheduleTable";
import MobileScreenWarning from "../components/MobileScreenWarning";
import { useScreenSize } from "../hooks/useScreenSize";
import { Loader, ArrowLeft, Save, AlertCircle, Download } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import html2canvas from 'html2canvas';
import ExportModal from "../components/ExportModal";
import ProductionScheduleExport from "../components/production-schedule/ProductionScheduleExport";
import PrintProductionScheduleExport from "../components/production-schedule/PrintProductionScheduleExport";

// Define the type for the data structure expected by export components
export interface ScheduleForExport {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  info: {
    event_name?: string;
    job_number?: string;
    venue?: string;
    project_manager?: string;
    production_manager?: string;
    account_manager?: string;
    date?: string; 
    load_in?: string; 
    event_start?: string; 
    event_end?: string; 
    strike_datetime?: string; 
    event_type?: string;
    sound_check?: string;
    room?: string;
    address?: string;
    client_artist?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    foh_engineer?: string;
    monitor_engineer?: string;
  };
  crew_key: CrewKeyItem[];
  schedule_items: Array<{
    id: string;
    start_time: string;
    end_time: string;
    activity: string;
    notes: string;
    crew_ids: string[];
  }>;
}


const defaultColors = [
  "#EF4444", "#3B82F6", "#22C55E", "#EAB308", "#A855F7", 
  "#EC4899", "#F97316", "#14B8A6", "#64748B", "#84CC16"
];

interface ProductionScheduleData {
  id?: string;
  user_id?: string;
  name: string;
  created_at?: string;
  last_edited?: string;
  show_name: string;
  job_number: string;
  facility_name: string;
  project_manager: string;
  production_manager: string;
  account_manager: string;
  set_datetime: string;
  strike_datetime: string;
  crew_key: CrewKeyItem[];
  schedule_items: ScheduleItem[];
}

const ProductionScheduleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<ProductionScheduleData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [scheduleForExportData, setScheduleForExportData] = useState<ScheduleForExport | null>(null);

  const exportRef = useRef<HTMLDivElement>(null);
  const printExportRef = useRef<HTMLDivElement>(null);

  const parseDateTime = (dateTimeStr: string | null | undefined) => {
    if (!dateTimeStr) return { date: undefined, time: undefined, full: undefined };
    try {
      const d = new Date(dateTimeStr);
      if (isNaN(d.getTime())) return { date: dateTimeStr, time: undefined, full: dateTimeStr }; // Return original if invalid
      return {
        date: d.toISOString().split('T')[0], // YYYY-MM-DD
        time: d.toTimeString().split(' ')[0].substring(0, 5), // HH:MM
        full: dateTimeStr,
      };
    } catch (e) {
      return { date: dateTimeStr, time: undefined, full: dateTimeStr }; // Return original on error
    }
  };
  
  const prepareScheduleForExport = (currentSchedule: ProductionScheduleData | null): ScheduleForExport | null => {
    if (!currentSchedule) return null;
  
    const setDateTimeParts = parseDateTime(currentSchedule.set_datetime);
    const strikeDateTimeParts = parseDateTime(currentSchedule.strike_datetime);
  
    return {
      id: currentSchedule.id || uuidv4(),
      name: currentSchedule.name,
      created_at: currentSchedule.created_at || new Date().toISOString(),
      last_edited: currentSchedule.last_edited,
      info: {
        event_name: currentSchedule.show_name,
        job_number: currentSchedule.job_number,
        venue: currentSchedule.facility_name,
        project_manager: currentSchedule.project_manager,
        production_manager: currentSchedule.production_manager,
        account_manager: currentSchedule.account_manager,
        date: setDateTimeParts.date,
        load_in: setDateTimeParts.time, 
        event_start: setDateTimeParts.time, // Assuming set_datetime is event_start time for now
        event_end: strikeDateTimeParts.time, // Assuming strike_datetime end is event_end time
        strike_datetime: currentSchedule.strike_datetime, 
      },
      crew_key: currentSchedule.crew_key.map(ck => ({ ...ck })),
      schedule_items: currentSchedule.schedule_items.map(item => ({
        id: item.id,
        start_time: item.startTime, // Should be HH:MM
        end_time: item.endTime,   // Should be HH:MM
        activity: item.activity,
        notes: item.notes,
        crew_ids: [...item.assignedCrewIds],
      })),
    };
  };

  useEffect(() => {
    if (screenSize === "mobile" || screenSize === "tablet") {
      setShowMobileWarning(true);
    }
  }, [screenSize]);

  useEffect(() => {
    const fetchUserAndSchedule = async () => {
      setLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error("User not authenticated:", userError);
        navigate("/login");
        return;
      }
      setUser(userData.user);

      if (id === "new") {
        const newSchedule: ProductionScheduleData = {
          name: "Untitled Production Schedule",
          show_name: "",
          job_number: "",
          facility_name: "",
          project_manager: "",
          production_manager: "",
          account_manager: "",
          set_datetime: "",
          strike_datetime: "",
          crew_key: [],
          schedule_items: [],
        };
        setSchedule(newSchedule);
        setLoading(false);
      } else {
        try {
          const { data, error } = await supabase
            .from("production_schedules")
            .select("*")
            .eq("id", id)
            .eq("user_id", userData.user.id)
            .single();

          if (error) throw error;
          if (data) {
            setSchedule({
              ...data,
              set_datetime: data.set_datetime || "",
              strike_datetime: data.strike_datetime || "",
              crew_key: data.crew_key || [],
              schedule_items: data.schedule_items || [],
            });
          } else {
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("Error fetching production schedule:", error);
          navigate("/dashboard");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserAndSchedule();
  }, [id, navigate]);

  const handleHeaderFieldUpdate = (field: string, value: string) => {
    if (schedule) {
      setSchedule({
        ...schedule,
        [field]: value,
      });
    }
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (schedule) {
      setSchedule({ ...schedule, name: e.target.value });
    }
  };

  const handleAddCrewKeyItem = () => {
    if (schedule) {
      const nextColorIndex = schedule.crew_key.length % defaultColors.length;
      const newItem: CrewKeyItem = {
        id: uuidv4(),
        name: "",
        color: defaultColors[nextColorIndex],
      };
      setSchedule({
        ...schedule,
        crew_key: [...schedule.crew_key, newItem],
      });
    }
  };

  const handleUpdateCrewKeyItem = (itemId: string, field: "name" | "color", value: string) => {
    if (schedule) {
      setSchedule({
        ...schedule,
        crew_key: schedule.crew_key.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      });
    }
  };

  const handleDeleteCrewKeyItem = (itemId: string) => {
    if (schedule) {
      const updatedScheduleItems = schedule.schedule_items.map(item => ({
        ...item,
        assignedCrewIds: item.assignedCrewIds.filter(id => id !== itemId),
      }));

      setSchedule({
        ...schedule,
        crew_key: schedule.crew_key.filter(item => item.id !== itemId),
        schedule_items: updatedScheduleItems,
      });
    }
  };

  const handleUpdateScheduleItems = (items: ScheduleItem[]) => {
    if (schedule) {
      setSchedule({
        ...schedule,
        schedule_items: items,
      });
    }
  };

  const handleSave = async () => {
    if (!schedule || !user) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const sanitizedCrewKey = schedule.crew_key.map(item => ({
      id: item.id, name: item.name, color: item.color,
    }));
    const sanitizedScheduleItems = schedule.schedule_items.map(item => ({
      id: item.id, startTime: item.startTime, endTime: item.endTime,
      activity: item.activity, notes: item.notes, assignedCrewIds: item.assignedCrewIds,
    }));

    const scheduleDataToSave: Omit<ProductionScheduleData, 'id' | 'user_id' | 'created_at'> & { user_id: string, id?: string, created_at?: string } = {
      ...schedule,
      user_id: user.id,
      last_edited: new Date().toISOString(),
      set_datetime: schedule.set_datetime || null as any,
      strike_datetime: schedule.strike_datetime || null as any,
      crew_key: sanitizedCrewKey,
      schedule_items: sanitizedScheduleItems,
    };
    
    if (id === "new" && scheduleDataToSave.id) {
      delete scheduleDataToSave.id; 
    }

    try {
      if (id === "new") {
        const { data, error } = await supabase
          .from("production_schedules")
          .insert(scheduleDataToSave)
          .select()
          .single();
        if (error) throw error;
        if (data) {
          navigate(`/production-schedule/${data.id}`);
          setSchedule(data as ProductionScheduleData); 
        }
      } else {
        const { data, error } = await supabase
          .from("production_schedules")
          .update(scheduleDataToSave)
          .eq("id", id as string)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        if (data) setSchedule(data as ProductionScheduleData);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving production schedule:", error);
      setSaveError(`Error saving schedule: ${error.message || "Please try again."}`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const openExportModalHandler = () => {
    const dataForExport = prepareScheduleForExport(schedule);
    // console.log("Data prepared for export modal:", JSON.parse(JSON.stringify(dataForExport)));
    setScheduleForExportData(dataForExport);
    setShowExportModal(true);
  };

  const exportImageWithCanvas = async (targetRef: React.RefObject<HTMLDivElement>, fileName: string, backgroundColor: string) => {
    if (!targetRef.current || !scheduleForExportData) {
      console.error("Export component not ready or no data for export.", { hasTargetRef: !!targetRef.current, hasData: !!scheduleForExportData });
      setSaveError("Export component not ready. Please try again.");
      return;
    }
    setIsExporting(true);
    // console.log(`Exporting ${fileName}. Data being used:`, JSON.parse(JSON.stringify(scheduleForExportData)));
    // console.log("Target DOM element for html2canvas:", targetRef.current);

    // Give React a bit more time to render the off-screen component with the data
    await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay

    try {
      const canvas = await html2canvas(targetRef.current!, {
        scale: 2,
        backgroundColor: backgroundColor,
        useCORS: true,
        logging: process.env.NODE_ENV === 'development',
        onclone: (document) => {
          // You could potentially manipulate the cloned document here if needed
          // For example, force styles or ensure visibility
          // console.log("html2canvas onclone document:", document);
        }
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${scheduleForExportData.name || "production-schedule"}-${fileName}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error(`Error exporting ${fileName}:`, error);
      setSaveError(`Failed to export ${fileName}. See console for details.`);
    } finally {
      setIsExporting(false);
      setShowExportModal(false); // Close modal after attempt
    }
  };

  const handleExportImage = () => {
    exportImageWithCanvas(exportRef, "image", '#0f172a');
  };

  const handleExportPrintFriendlyImage = () => {
    exportImageWithCanvas(printExportRef, "print-friendly", '#ffffff');
  };


  if (loading || !schedule) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {showMobileWarning && (
        <MobileScreenWarning
          title="Optimized for Larger Screens"
          description="This editor works best on larger screens. You can continue, but some features may be harder to use on mobile."
          continueAnyway={true}
          editorType="schedule"
        />
      )}

      <Header dashboard={true} />

      <main className="flex-grow container mx-auto px-4 py-6 md:py-12 mt-16 md:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <input
                type="text"
                value={schedule.name}
                onChange={handleNameChange}
                className="text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full max-w-[220px] sm:max-w-none"
                placeholder="Enter schedule name"
              />
              <p className="text-xs sm:text-sm text-gray-400">
                {schedule.last_edited
                  ? `Last edited: ${new Date(schedule.last_edited).toLocaleString()}`
                  : `Created: ${new Date(schedule.created_at || Date.now()).toLocaleString()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 fixed bottom-4 right-4 z-20 md:static md:z-auto sm:ml-auto">
            <button
              onClick={openExportModalHandler}
              disabled={saving || isExporting}
              className="inline-flex items-center bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg md:shadow-none"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={handleSave}
              disabled={saving || isExporting}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg md:shadow-none"
            >
              {saving ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
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
            <p className="text-green-400 text-sm">Production schedule saved successfully!</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl font-medium text-white">Production Schedule Details</h2>
            <p className="text-gray-400 text-sm">
              Manage the core information for your event.
            </p>
          </div>
          <div className="p-4 md:p-6 overflow-x-auto">
            <div className="min-w-[800px] md:min-w-0">
              <ProductionScheduleHeader
                scheduleData={{
                  show_name: schedule.show_name,
                  job_number: schedule.job_number,
                  facility_name: schedule.facility_name,
                  project_manager: schedule.project_manager,
                  production_manager: schedule.production_manager,
                  account_manager: schedule.account_manager,
                  set_datetime: schedule.set_datetime,
                  strike_datetime: schedule.strike_datetime,
                }}
                updateField={handleHeaderFieldUpdate}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
           <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl font-medium text-white">Crew & Department Key</h2>
            <p className="text-gray-400 text-sm">
              Define crew types and assign colors for easy identification in the schedule.
            </p>
          </div>
          <div className="p-4 md:p-6 overflow-x-auto">
            <div className="min-w-[600px] md:min-w-0">
              <ProductionScheduleCrewKey
                crewKey={schedule.crew_key}
                onUpdateCrewKeyItem={handleUpdateCrewKeyItem}
                onAddCrewKeyItem={handleAddCrewKeyItem}
                onDeleteCrewKeyItem={handleDeleteCrewKeyItem}
              />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl font-medium text-white">Schedule Timeline</h2>
            <p className="text-gray-400 text-sm">
              Add and manage schedule items.
            </p>
          </div>
          <div className="p-0 md:p-2 lg:p-4 overflow-x-auto">
             <div className="min-w-[900px] md:min-w-0">
                <ProductionScheduleTable
                    scheduleItems={schedule.schedule_items}
                    crewKey={schedule.crew_key}
                    onUpdateScheduleItems={handleUpdateScheduleItems}
                />
            </div>
          </div>
        </div>

        <div className="flex justify-center py-8">
          <button
            onClick={handleSave}
            disabled={saving || isExporting}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg text-base"
          >
            {saving ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Saving Schedule...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Production Schedule
              </>
            )}
          </button>
        </div>
      </main>

      <Footer />

      {showExportModal && scheduleForExportData && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => {
            if (!isExporting) {
              setShowExportModal(false);
              // setScheduleForExportData(null); // Keep data for potential re-export attempts if needed, or clear if modal is truly done
            }
          }}
          onExportImage={handleExportImage}
          onExportPdf={handleExportPrintFriendlyImage} // This is for print-friendly PNG
          title="Production Schedule"
          isExporting={isExporting}
        />
      )}

      {/* Hidden components for export rendering, ensure they re-render if scheduleForExportData changes */}
      {scheduleForExportData && (
        <>
          <ProductionScheduleExport 
            key={`export-${scheduleForExportData.id}-${scheduleForExportData.last_edited || scheduleForExportData.created_at}`} 
            ref={exportRef} 
            schedule={scheduleForExportData} 
          />
          <PrintProductionScheduleExport 
            key={`print-export-${scheduleForExportData.id}-${scheduleForExportData.last_edited || scheduleForExportData.created_at}`} 
            ref={printExportRef} 
            schedule={scheduleForExportData} 
          />
        </>
      )}
    </div>
  );
};

export default ProductionScheduleEditor;
