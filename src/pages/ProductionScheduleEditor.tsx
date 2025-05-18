import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductionScheduleHeader from "../components/production-schedule/ProductionScheduleHeader";
import ProductionScheduleCrewKey, { CrewKeyItem } from "../components/production-schedule/ProductionScheduleCrewKey";
// Import ScheduleItem from its definition source
import ProductionScheduleTable, { ScheduleItem as EditorScheduleItem } from "../components/production-schedule/ProductionScheduleTable";
import ProductionScheduleLabor, { LaborScheduleItem } from "../components/production-schedule/ProductionScheduleLabor"; 
import MobileScreenWarning from "../components/MobileScreenWarning";
import { useScreenSize } from "../hooks/useScreenSize";
import { Loader, ArrowLeft, Save, AlertCircle, Users } from "lucide-react"; 
import { v4 as uuidv4 } from 'uuid';

// Define the item structure for export, matching ScheduleItem from the editor
// This will now use snake_case for time and crew ID fields to align with labor schedule pattern
interface ExportScheduleItem {
  id: string;
  date?: string;
  start_time: string; // Changed from startTime
  end_time: string;   // Changed from endTime
  activity: string;
  notes: string;
  assigned_crew_ids: string[]; // Changed from assignedCrewIds
}

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
  schedule_items: ExportScheduleItem[]; // Uses snake_case keys now
  labor_schedule_items: LaborScheduleItem[];
}


const defaultColors = [
  "#EF4444", "#3B82F6", "#22C55E", "#EAB308", "#A855F7", 
  "#EC4899", "#F97316", "#14B8A6", "#64748B", "#84CC16"
];

// This interface uses the ScheduleItem imported from ProductionScheduleTable,
// which now includes `isNewlyAdded`. EditorScheduleItem uses camelCase internally.
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
  schedule_items: EditorScheduleItem[]; // Internal state uses camelCase (startTime, endTime)
  labor_schedule_items: LaborScheduleItem[]; // Labor items use snake_case (time_in, time_out)
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

  const parseDateTime = (dateTimeStr: string | null | undefined) => {
    if (!dateTimeStr) return { date: undefined, time: undefined, full: undefined };
    try {
      const d = new Date(dateTimeStr);
      if (isNaN(d.getTime())) return { date: dateTimeStr, time: undefined, full: dateTimeStr }; 
      return {
        date: d.toISOString().split('T')[0], 
        time: d.toTimeString().split(' ')[0].substring(0, 5), 
        full: dateTimeStr,
      };
    } catch (e) {
      return { date: dateTimeStr, time: undefined, full: dateTimeStr }; 
    }
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
          labor_schedule_items: [], 
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
              schedule_items: (data.schedule_items || []).map((dbItem: any): EditorScheduleItem => {
                // Map from DB snake_case (e.g., start_time) to internal camelCase (e.g., startTime)
                return {
                  id: dbItem.id, 
                  date: dbItem.date || undefined, 
                  startTime: dbItem.start_time || "", // DB: start_time -> State: startTime
                  endTime: dbItem.end_time || "",   // DB: end_time -> State: endTime
                  activity: dbItem.activity || "",
                  notes: dbItem.notes || "",
                  assignedCrewIds: dbItem.assigned_crew_ids || [], // DB: assigned_crew_ids -> State: assignedCrewIds
                  isNewlyAdded: false 
                };
              }),
              // Labor items are assumed to be snake_case in DB and used as such in LaborScheduleItem interface
              labor_schedule_items: data.labor_schedule_items || [], 
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
      // Update assignedCrewIds in schedule_items (which are camelCase in state)
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

  const handleUpdateScheduleItems = (items: EditorScheduleItem[]) => {
    if (schedule) {
      setSchedule({
        ...schedule,
        schedule_items: items, 
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

  const handleSave = async () => {
    if (!schedule || !user) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    // Map internal camelCase (startTime) to DB snake_case (start_time)
    const sanitizedScheduleItems = schedule.schedule_items.map((item: EditorScheduleItem) => {
      const { isNewlyAdded, ...restOfItem } = item; 
      return {
        id: restOfItem.id,
        date: restOfItem.date || null, 
        activity: restOfItem.activity,
        notes: restOfItem.notes,
        start_time: restOfItem.startTime || "", // State: startTime -> DB: start_time
        end_time: restOfItem.endTime || "",     // State: endTime -> DB: end_time
        assigned_crew_ids: restOfItem.assignedCrewIds || [], // State: assignedCrewIds -> DB: assigned_crew_ids
      };
    });

    const sanitizedCrewKey = schedule.crew_key.map(item => ({
      id: item.id, name: item.name, color: item.color,
    }));
    
    // Labor items are assumed to be snake_case (time_in, time_out) already from LaborScheduleItem interface
    const sanitizedLaborScheduleItems = schedule.labor_schedule_items.map(item => ({ 
      id: item.id, name: item.name, position: item.position, date: item.date,
      time_in: item.time_in, time_out: item.time_out, notes: item.notes,
    }));

    const scheduleDataToSave = {
      name: schedule.name,
      show_name: schedule.show_name,
      job_number: schedule.job_number,
      facility_name: schedule.facility_name,
      project_manager: schedule.project_manager,
      production_manager: schedule.production_manager,
      account_manager: schedule.account_manager,
      set_datetime: schedule.set_datetime || null,
      strike_datetime: schedule.strike_datetime || null,
      user_id: user.id,
      last_edited: new Date().toISOString(),
      crew_key: sanitizedCrewKey,
      schedule_items: sanitizedScheduleItems, // Now contains snake_case keys for time and crew
      labor_schedule_items: sanitizedLaborScheduleItems,
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
        // When reloading data, map from DB snake_case back to internal camelCase
        const reloadedData: ProductionScheduleData = {
          ...savedData,
          set_datetime: savedData.set_datetime || "",
          strike_datetime: savedData.strike_datetime || "",
          crew_key: savedData.crew_key || [],
          schedule_items: (savedData.schedule_items || []).map((dbItem: any): EditorScheduleItem => ({
            id: dbItem.id,
            date: dbItem.date || undefined,
            startTime: dbItem.start_time || "", // DB: start_time -> State: startTime
            endTime: dbItem.end_time || "",     // DB: end_time -> State: endTime
            activity: dbItem.activity || "",
            notes: dbItem.notes || "",
            assignedCrewIds: dbItem.assigned_crew_ids || [], // DB: assigned_crew_ids -> State: assignedCrewIds
            isNewlyAdded: false,
          })),
          labor_schedule_items: savedData.labor_schedule_items || [],
        };
        setSchedule(reloadedData);
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

  // Prepare props for export component, mapping internal camelCase to export's snake_case
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
      date: parseDateTime(schedule.set_datetime).date, 
      load_in: parseDateTime(schedule.set_datetime).time, 
      strike_datetime: schedule.strike_datetime,
      event_start: parseDateTime(schedule.set_datetime).full, 
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
    crew_key: schedule.crew_key,
    schedule_items: schedule.schedule_items.map((item: EditorScheduleItem): ExportScheduleItem => {
      // Map from internal camelCase (item.startTime) to export snake_case (start_time)
      return {
        id: item.id,
        date: item.date || "", 
        start_time: item.startTime || "", // State: startTime -> Export: start_time
        end_time: item.endTime || "",   // State: endTime -> Export: end_time
        activity: item.activity || "",
        notes: item.notes || "",
        assigned_crew_ids: item.assignedCrewIds || [], // State: assignedCrewIds -> Export: assigned_crew_ids
      };
    }),
    labor_schedule_items: schedule.labor_schedule_items, // Assumed to be already in correct snake_case format
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
              Add and manage schedule items. Dates will group items. Newly added items appear at the bottom until edited.
            </p>
          </div>
          <div className="p-0 md:p-2 lg:p-4 overflow-x-auto">
             <div className="min-w-[1000px] md:min-w-0"> 
                <ProductionScheduleTable
                    scheduleItems={schedule.schedule_items}
                    crewKey={schedule.crew_key}
                    onUpdateScheduleItems={handleUpdateScheduleItems}
                />
            </div>
          </div>
        </div>

        {/* Labor Schedule Section */}
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
