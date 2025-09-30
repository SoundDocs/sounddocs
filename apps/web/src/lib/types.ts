import { TFData } from "@sounddocs/analyzer-protocol";
import { CrewKeyItem } from "../components/production-schedule/ProductionScheduleCrewKey";
import { LaborScheduleItem } from "../components/production-schedule/ProductionScheduleLabor";
import { DetailedScheduleItem } from "../components/production-schedule/ProductionScheduleDetail";
import { EqSetting } from "./dsp";

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

export interface Measurement {
  id: string;
  name: string;
  created_at: string;
  tf_data: TFData;
  color?: string;
  sample_rate: number;
  eq_settings?: EqSetting[];
  phase_flipped?: boolean;
  isMathTrace?: boolean;
}

// Technical Rider Interfaces
export interface BandMember {
  id: string;
  name: string;
  instrument: string;
  input_needs: string;
}

export interface InputChannel {
  id: string;
  channel_number: string;
  name: string;
  type: string;
  mic_type?: string;
  phantom_power: boolean;
  di_needed: boolean;
  notes: string;
}

export interface BacklineItem {
  id: string;
  item: string;
  quantity: string;
  notes: string;
}

export interface StaffRequirement {
  id: string;
  role: string;
  quantity: string;
  notes: string;
}

export interface RiderForExport {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  artist_name: string;
  band_members: BandMember[];
  genre: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  stage_plot_url?: string;
  input_list: InputChannel[];
  pa_requirements: string;
  monitor_requirements: string;
  console_requirements: string;
  backline_requirements: BacklineItem[];
  artist_provided_gear: BacklineItem[];
  required_staff: StaffRequirement[];
  special_requirements: string;
  power_requirements: string;
  lighting_notes: string;
  hospitality_notes: string;
  additional_notes: string;
}
