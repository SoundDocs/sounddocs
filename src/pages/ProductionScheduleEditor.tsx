import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductionScheduleHeader from "../components/production-schedule/ProductionScheduleHeader";
import ProductionScheduleCrewKey, { CrewKeyItem } from "../components/production-schedule/ProductionScheduleCrewKey";
import ProductionScheduleLabor, { LaborScheduleItem } from "../components/production-schedule/ProductionScheduleLabor"; 
import ProductionScheduleDetail, { DetailedScheduleItem } from "../components/production-schedule/ProductionScheduleDetail";
import MobileScreenWarning from "../components/MobileScreenWarning";
import { useScreenSize } from "../hooks/useScreenSize";
import { Loader, ArrowLeft, Save, AlertCircle, Users, ListChecks } from "lucide-react"; 
import { v4 as uuidv4 } from 'uuid';

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
    strike_datetime?: string | null; // Can be null, expected to be UTC ISO string if present
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
  labor_schedule_items: LaborScheduleItem[];
  detailed_schedule_items: DetailedScheduleItem[];
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
  // Stored as UTC ISO string in state after fetch/save, or local YYYY-MM-DDTHH:MM string during editing
  set_datetime: string | null; 
  strike_datetime: string | null; 
  crew_key: CrewKeyItem[];
  labor_schedule_items: LaborScheduleItem[]; 
  detailed_schedule_items: DetailedScheduleItem[];
}

// Helper function to convert a UTC ISO string to a local YYYY-MM-DDTHH:MM string
// for datetime-local input fields.
// IMPORTANT: This function should be used within ProductionScheduleHeader.tsx
// for the `value` prop of datetime-local inputs.
export const formatUTCToLocalDateTimeInputString = (utcIsoString: string | null): string => {
  if (!utcIsoString) return "";
  try {
    const date = new Date(utcIsoString); // Parses UTC string, Date methods give local
    if (isNaN(date.getTime())) {
      // Check if it's already in the target format (e.g. during active editing)
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(utcIsoString)) {
        return utcIsoString;
      }
      console.warn(`Invalid UTC ISO string for input formatting: ${utcIsoString}`);
      return "";
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    console.error("Error formatting UTC to local datetime input string:", e);
    return ""; 
  }
};

// Helper to convert local YYYY-MM-DDTHH:MM string from input to UTC ISO string for saving
const convertLocalInputToUTCISO = (localDateTimeString: string | null): string | null => {
  if (!localDateTimeString) return null;
  try {
    // Input string is YYYY-MM-DDTHH:MM (from datetime-local)
    // This is interpreted as local time by new Date()
    const localDate = new Date(localDateTimeString);
    if (isNaN(localDate.getTime())) {
      console.warn(`Invalid localDateTimeString for UTC conversion: ${localDateTimeString}`);
      return null; 
    }
    return localDate.toISOString(); // Converts to UTC ISO string
  } catch (e) {
    console.error("Error converting local input to UTC ISO:", e);
    return null;
  }
};

// Helper to parse a UTC ISO string into local date and time parts for export info
const parseUtcToLocalPartsForExportInfo = (utcIsoDateTimeStr: string | null | undefined) => {
  if (!utcIsoDateTimeStr) return { date: undefined, time: undefined };
  try {
    const d = new Date(utcIsoDateTimeStr); // Parses UTC string, Date methods yield local equivalents
    if (isNaN(d.getTime())) {
      console.warn(`Invalid UTC ISO string for export parsing: ${utcIsoDateTimeStr}`);
      return { date: utcIsoDateTimeStr, time: undefined }; 
    }
    
    const localDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    const localTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    
    return {
      date: localDate, 
      time: localTime,
    };
  } catch (e) {
    console.error("Error parsing UTC date for export info:", e);
    return { date: utcIsoDateTimeStr, time: undefined }; 
  }
};


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
          set_datetime: null, 
          strike_datetime: null, 
          crew_key: [],
          labor_schedule_items: [], 
          detailed_schedule_items: [],
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
            // Data from Supabase (set_datetime, strike_datetime) is UTC ISO string
            setSchedule({
              ...data, 
              set_datetime: data.set_datetime || null, 
              strike_datetime: data.strike_datetime || null, 
              crew_key: data.crew_key || [],
              labor_schedule_items: data.labor_schedule_items || [], 
              detailed_schedule_items: (data.detailed_schedule_items || []).map((item: any) => ({
                ...item,
                assigned_crew_ids: item.assigned_crew_ids || (item.assigned_crew_id ? [item.assigned_crew_id] : []) 
              })),
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
      // Value from datetime-local input is YYYY-MM-DDTHH:MM (local time string)
      // Store this local string in state during editing.
      // It will be converted to UTC ISO on save.
      setSchedule({
        ...schedule,
        [field]: value || null, 
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
      const updatedDetailedScheduleItems = schedule.detailed_schedule_items.map(detailItem => ({
        ...detailItem,
        assigned_crew_ids: (detailItem.assigned_crew_ids || []).filter(crewId => crewId !== itemId),
      }));

      setSchedule({
        ...schedule,
        crew_key: schedule.crew_key.filter(item => item.id !== itemId),
        detailed_schedule_items: updatedDetailedScheduleItems,
      });
    }
  };

  const handleUpdateLaborScheduleItems = (items: LaborScheduleItem[]) => { 
    if (schedule) {
      setSchedule({
        ...schedule,
        labor_schedule_items: items,
      });
    }
  };

  const handleUpdateDetailedScheduleItems = (items: DetailedScheduleItem[]) => {
    if (schedule) {
      setSchedule({
        ...schedule,
        detailed_schedule_items: items,
      });
    }
  };

  const handleSave = async () => {
    if (!schedule || !user) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const sanitizedCrewKey = (schedule.crew_key || []).map(item => ({
      id: item.id, name: item.name, color: item.color,
    }));
    
    const sanitizedLaborScheduleItems = (schedule.labor_schedule_items || []).map(item => ({ 
      id: item.id, name: item.name, position: item.position, date: item.date,
      time_in: item.time_in, time_out: item.time_out, notes: item.notes,
    }));

    const sanitizedDetailedScheduleItems = (schedule.detailed_schedule_items || []).map(item => ({
      id: item.id, date: item.date, start_time: item.start_time, end_time: item.end_time,
      activity: item.activity, notes: item.notes, 
      assigned_crew_ids: item.assigned_crew_ids || [], 
    }));

    // schedule.set_datetime and schedule.strike_datetime are local YYYY-MM-DDTHH:MM strings here
    // Convert them to UTC ISO for saving
    const scheduleDataToSave = {
      name: schedule.name,
      show_name: schedule.show_name,
      job_number: schedule.job_number,
      facility_name: schedule.facility_name,
      project_manager: schedule.project_manager,
      production_manager: schedule.production_manager,
      account_manager: schedule.account_manager,
      set_datetime: convertLocalInputToUTCISO(schedule.set_datetime),
      strike_datetime: convertLocalInputToUTCISO(schedule.strike_datetime),
      user_id: user.id,
      last_edited: new Date().toISOString(),
      crew_key: sanitizedCrewKey,
      labor_schedule_items: sanitizedLaborScheduleItems,
      detailed_schedule_items: sanitizedDetailedScheduleItems,
      ...(id !== "new" && { id: schedule.id }),
      ...(id === "new" && schedule.created_at && { created_at: schedule.created_at }),
    };
    
    let finalDataToSave: any = scheduleDataToSave;
    if (id === "new") {
      const { id: scheduleId, ...rest } = scheduleDataToSave; 
      finalDataToSave = rest;
    }

    try {
      let savedData;
      if (id === "new") {
        const { data, error } = await supabase
          .from("production_schedules")
          .insert(finalDataToSave)
          .select()
          .single();
        if (error) throw error;
        savedData = data;
        if (data) navigate(`/production-schedule/${data.id}`);
      } else {
        const { data, error } = await supabase
          .from("production_schedules")
          .update(finalDataToSave)
          .eq("id", id as string)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        savedData = data;
      }

      if (savedData) {
        // savedData contains UTC ISO strings for datetime fields
        const reloadedData: ProductionScheduleData = {
          ...savedData,
          set_datetime: savedData.set_datetime || null,
          strike_datetime: savedData.strike_datetime || null,
          crew_key: savedData.crew_key || [],
          labor_schedule_items: savedData.labor_schedule_items || [],
          detailed_schedule_items: (savedData.detailed_schedule_items || []).map((item: any) => ({ 
            ...item,
            assigned_crew_ids: item.assigned_crew_ids || (item.assigned_crew_id ? [item.assigned_crew_id] : [])
          })),
        };
        setSchedule(reloadedData); // State now holds UTC ISO strings
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


  if (loading || !schedule) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin" />
      </div>
    );
  }
  
  const currentDetailedScheduleItems = schedule.detailed_schedule_items || [];
  
  // schedule.set_datetime is a UTC ISO string here (after fetch/save)
  const parsedSetDateTimeForExport = parseUtcToLocalPartsForExportInfo(schedule.set_datetime);

  const scheduleForExportProps: ScheduleForExport = {
    id: schedule.id || uuidv4(), 
    name: schedule.name,
    created_at: schedule.created_at || new Date().toISOString(),
    last_edited: schedule.last_edited,
    info: { 
      event_name: schedule.show_name,
      job_number: schedule.job_number,
      venue: schedule.facility_name,
      project_manager: schedule.project_manager,
      production_manager: schedule.production_manager,
      account_manager: schedule.account_manager,
      date: parsedSetDateTimeForExport.date, // Local date string (YYYY-MM-DD)
      load_in: parsedSetDateTimeForExport.time, // Local time string (HH:MM)
      strike_datetime: schedule.strike_datetime, // UTC ISO string, export components will format to local
      event_start: undefined, 
      event_end: undefined, 
      event_type: undefined, 
      sound_check: undefined, 
      room: undefined, 
      address: undefined, 
      client_artist: undefined, 
      contact_name: undefined, 
      contact_email: undefined, 
      contact_phone: undefined, 
      foh_engineer: undefined, 
      monitor_engineer: undefined, 
    },
    crew_key: schedule.crew_key || [],
    labor_schedule_items: schedule.labor_schedule_items || [], 
    detailed_schedule_items: currentDetailedScheduleItems,
  };

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

      <Header dashboard={true} scheduleForExport={scheduleForExportProps} scheduleType="production" />


      <main className="flex-grow container mx-auto px-4 py-6 md:py-12 mt-16 md:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4">
          <div className="flex items-center flex-grow min-w-0"> 
            <button
              onClick={() => navigate("/dashboard")}
              className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors flex-shrink-0" 
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-grow min-w-0"> 
              <input
                type="text"
                value={schedule.name}
                onChange={handleNameChange}
                className="text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full" 
                placeholder="Enter schedule name"
              />
              <p className="text-xs sm:text-sm text-gray-400 truncate"> 
                {schedule.last_edited
                  ? `Last edited: ${new Date(schedule.last_edited).toLocaleString()}`
                  : `Created: ${new Date(schedule.created_at || Date.now()).toLocaleString()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 fixed bottom-4 right-4 z-20 md:static md:z-auto sm:ml-auto flex-shrink-0"> 
            <button
              onClick={handleSave}
              disabled={saving} 
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
              {/* 
                IMPORTANT: ProductionScheduleHeader.tsx needs to use the 
                `formatUTCToLocalDateTimeInputString` helper function (defined in this file)
                for the `value` prop of its datetime-local inputs.
                Example for set_datetime input:
                value={formatUTCToLocalDateTimeInputString(scheduleData.set_datetime)}
                onChange={(e) => updateField("set_datetime", e.target.value)}

                `scheduleData.set_datetime` (and strike_datetime) will be UTC ISO strings
                from the `schedule` state. `updateField` will pass the local YYYY-MM-DDTHH:MM
                string from the input back to `handleHeaderFieldUpdate`.
              */}
              <ProductionScheduleHeader
                scheduleData={{
                  show_name: schedule.show_name,
                  job_number: schedule.job_number,
                  facility_name: schedule.facility_name,
                  project_manager: schedule.project_manager,
                  production_manager: schedule.production_manager,
                  account_manager: schedule.account_manager,
                  // Pass the state values directly; header component handles formatting for display
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
            <h2 className="text-xl font-medium text-white">Crew &amp; Department Key</h2>
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
            <div className="flex items-center">
              <ListChecks className="h-6 w-6 mr-3 text-indigo-400" />
              <div>
                <h2 className="text-xl font-medium text-white">Detailed Production Schedule</h2>
                <p className="text-gray-400 text-sm">
                  Outline the event's timeline, activities, and assigned crew.
                </p>
              </div>
            </div>
          </div>
          <div className="p-0 md:p-2 lg:p-4 overflow-x-auto">
             <div className="min-w-[1000px] md:min-w-0"> 
                <ProductionScheduleDetail
                    detailedItems={schedule.detailed_schedule_items}
                    onUpdateDetailedItems={handleUpdateDetailedScheduleItems}
                    crewKey={schedule.crew_key} 
                />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-3 text-indigo-400" />
              <div>
                <h2 className="text-xl font-medium text-white">Labor Schedule</h2>
                <p className="text-gray-400 text-sm">
                  Manage labor assignments, call times, and positions.
                </p>
              </div>
            </div>
          </div>
          <div className="p-0 md:p-2 lg:p-4 overflow-x-auto">
             <div className="min-w-[900px] md:min-w-0">
                <ProductionScheduleLabor
                    laborItems={schedule.labor_schedule_items}
                    onUpdateLaborItems={handleUpdateLaborScheduleItems}
                    crewKey={schedule.crew_key} 
                />
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
    </div>
  );
};

export default ProductionScheduleEditor;
