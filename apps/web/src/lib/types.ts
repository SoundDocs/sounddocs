import { CrewKeyItem } from "../components/production-schedule/ProductionScheduleCrewKey";
import { LaborScheduleItem } from "../components/production-schedule/ProductionScheduleLabor";
import { DetailedScheduleItem } from "../components/production-schedule/ProductionScheduleDetail";

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
    strike_datetime?: string | null;
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
