import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { supabase } from "../lib/supabase";
import { getSharedResource, SharedLink } from "../lib/shareUtils";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductionScheduleExport from "../components/production-schedule/ProductionScheduleExport";
import { ScheduleForExport } from "../lib/types";
import { DetailedScheduleItem } from "../components/production-schedule/ProductionScheduleDetail";
import { LaborScheduleItem } from "../components/production-schedule/ProductionScheduleLabor";
import { Loader, AlertTriangle, Share2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Raw data structure from Supabase for production_schedules
interface FullProductionScheduleData {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  user_id: string;
  show_name?: string;
  job_number?: string;
  facility_name?: string;
  project_manager?: string;
  production_manager?: string;
  account_manager?: string;
  set_datetime?: string;
  strike_datetime?: string;
  crew_key?: Array<{ id: string; name: string; color: string }>;
  detailed_schedule_items?: DetailedScheduleItem[];
  labor_schedule_items?: LaborScheduleItem[];
  // Add contact fields if they are part of the table structure
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

// Utility to parse date/time strings
const parseDateTime = (dateTimeStr: string | null | undefined) => {
  if (!dateTimeStr) return { date: undefined, time: undefined, full: undefined };
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return { date: dateTimeStr, time: undefined, full: dateTimeStr };
    return {
      date: d.toISOString().split("T")[0],
      time: d.toTimeString().split(" ")[0].substring(0, 5),
      full: dateTimeStr,
    };
  } catch {
    return { date: dateTimeStr, time: undefined, full: dateTimeStr };
  }
};

// Transforms raw data to the format expected by ProductionScheduleExport
const transformToScheduleForExport = (
  fullSchedule: FullProductionScheduleData,
): ScheduleForExport => {
  const setDateTimeParts = parseDateTime(fullSchedule.set_datetime);
  const strikeDateTimeParts = parseDateTime(fullSchedule.strike_datetime);

  return {
    id: fullSchedule.id || uuidv4(),
    name: fullSchedule.name,
    created_at: fullSchedule.created_at || new Date().toISOString(),
    last_edited: fullSchedule.last_edited,
    info: {
      event_name: fullSchedule.show_name,
      job_number: fullSchedule.job_number,
      venue: fullSchedule.facility_name,
      project_manager: fullSchedule.project_manager,
      production_manager: fullSchedule.production_manager,
      account_manager: fullSchedule.account_manager,
      date: setDateTimeParts.date,
      load_in: setDateTimeParts.time,
      event_start: setDateTimeParts.time, // Assuming event_start is same as load_in for now
      event_end: strikeDateTimeParts.time, // Assuming event_end is same as strike for now
      strike_datetime: fullSchedule.strike_datetime,
      contact_name: fullSchedule.contact_name,
      contact_email: fullSchedule.contact_email,
      contact_phone: fullSchedule.contact_phone,
    },
    crew_key: fullSchedule.crew_key?.map((ck) => ({ ...ck })) || [],
    detailed_schedule_items:
      fullSchedule.detailed_schedule_items?.map((item) => ({
        ...item,
        assigned_crew_ids: item.assigned_crew_ids || [],
      })) || [],
    labor_schedule_items: fullSchedule.labor_schedule_items?.map((item) => ({ ...item })) || [],
  };
};

const SharedProductionSchedule: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ScheduleForExport | null>(null);
  const [shareLinkInfo, setShareLinkInfo] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null); // This ref might be for a download button not shown here

  useEffect(() => {
    const fetchSharedSchedule = async () => {
      if (!shareCode) {
        setError("Share code is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`[SharedProductionSchedule] Fetching resource for shareCode: ${shareCode}`);
        const { resource, shareLink } = await getSharedResource(shareCode);
        console.log("[SharedProductionSchedule] Fetched resource:", resource);
        console.log("[SharedProductionSchedule] Fetched shareLink:", shareLink);

        if (shareLink.resource_type !== "production_schedule") {
          console.error(
            `[SharedProductionSchedule] Invalid resource type. Expected 'production_schedule', got '${shareLink.resource_type}'`,
          );
          throw new Error("Invalid resource type for this share link.");
        }

        const fullData = resource as FullProductionScheduleData;
        console.log(
          "[SharedProductionSchedule] Raw fullData for transformation:",
          JSON.parse(JSON.stringify(fullData)),
        );

        const transformedSchedule = transformToScheduleForExport(fullData);
        console.log(
          "[SharedProductionSchedule] Transformed schedule for display:",
          JSON.parse(JSON.stringify(transformedSchedule)),
        );

        setSchedule(transformedSchedule);
        setShareLinkInfo(shareLink);
      } catch (err: unknown) {
        console.error("[SharedProductionSchedule] Error fetching shared production schedule:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load shared production schedule. Please check the console for more details.";
        setError(message);
        if (
          err instanceof Error &&
          (err.message === "Share link has expired" || err.message === "Share link not found")
        ) {
          // Optionally redirect or show specific UI for these cases
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSharedSchedule();
  }, [shareCode, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-lg text-gray-300">Loading Shared Production Schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 mt-24">
          {" "}
          {/* Added mt-24 */}
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied or Error</h1>
          <p className="text-lg text-red-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            Go to Homepage
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 mt-24">
          {" "}
          {/* Added mt-24 */}
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Production Schedule Not Found</h1>
          <p className="text-lg text-gray-400 mb-6">
            The requested production schedule could not be loaded.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            Go to Homepage
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-2 py-8 sm:px-4 mt-24">
        {" "}
        {/* Added mt-24 */}
        <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-gray-700">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{schedule.name}</h1>
              <p className="text-sm text-indigo-400 flex items-center mt-1">
                <Share2 className="h-4 w-4 mr-2" /> Shared for viewing
              </p>
            </div>
            {shareLinkInfo && shareLinkInfo.expires_at && (
              <p className="text-xs text-yellow-400 mt-2 sm:mt-0">
                Link expires on: {new Date(shareLinkInfo.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-6">
            This is a shared, view-only version of a production schedule.
            {/* Add a Download PDF/Image button here if needed, which would use exportRef */}
          </p>
        </div>
        <div className="bg-slate-900 p-0 sm:p-0 rounded-lg shadow-lg overflow-x-auto">
          {" "}
          {/* Adjusted padding and added overflow */}
          <ProductionScheduleExport
            ref={exportRef}
            schedule={schedule}
            forDisplay={true} // Pass the new prop
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SharedProductionSchedule;
