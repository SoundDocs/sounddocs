import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches all custom suggestions for a user, optionally filtered by field type prefix.
 * @param userId The ID of the user.
 * @param fieldTypePrefix Optional prefix to filter field types (e.g., 'input_').
 * @returns A record where keys are field types and values are arrays of suggestion strings.
 */
export const fetchUserCustomSuggestions = async (
  userId: string,
  fieldTypePrefix?: string,
): Promise<Record<string, string[]>> => {
  if (!userId) return {};

  let query = supabase
    .from("user_custom_suggestions")
    .select("field_type, value")
    .eq("user_id", userId);

  if (fieldTypePrefix) {
    query = query.like("field_type", `${fieldTypePrefix}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user custom suggestions:", error);
    throw error;
  }

  const suggestionsMap: Record<string, string[]> = {};
  if (data) {
    for (const item of data) {
      if (!suggestionsMap[item.field_type]) {
        suggestionsMap[item.field_type] = [];
      }
      suggestionsMap[item.field_type].push(item.value);
    }
  }
  return suggestionsMap;
};

/**
 * Adds a new custom suggestion for a user if it doesn't already exist.
 * @param userId The ID of the user.
 * @param fieldType The type of the field for the suggestion.
 * @param value The suggestion value.
 */
export const addUserCustomSuggestion = async (
  userId: string,
  fieldType: string,
  value: string,
): Promise<void> => {
  if (!userId || !fieldType || !value.trim()) return;

  const { error } = await supabase
    .from("user_custom_suggestions")
    .insert(
      { user_id: userId, field_type: fieldType, value: value.trim() },
      { onConflict: "user_id, field_type, value" },
    ); // Use onConflict to ignore duplicates

  if (error && error.code !== "23505") {
    // 23505 is unique_violation, which we are handling with onConflict
    console.error("Error adding user custom suggestion:", error);
    throw error;
  }
};

/**
 * Fetches CJ's current location based on the current date.
 * @returns An object with location details or null if no current location is found.
 */
export const fetchCurrentCJLocation = async (): Promise<{
  location_name: string;
  description: string | null;
} | null> => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("cj_location")
    .select("location_name, description")
    .lte("start_date", now)
    .gte("end_date", now)
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // .single() throws an error if no row is found, which is an expected outcome.
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching CJ's location:", error);
    throw error;
  }

  return data;
};

export interface PixelMapPayload {
  userId: string;
  mapType: "led" | "standard";
  projectName: string;
  screenName: string;
  aspectRatioW: number;
  aspectRatioH: number;
  resolutionW: number;
  resolutionH: number;
  settings: object;
}

/**
 * Saves a pixel map configuration to the database.
 * @param payload The data for the pixel map.
 */
export const savePixelMap = async (payload: PixelMapPayload) => {
  const { error } = await supabase.from("pixel_maps").insert({
    user_id: payload.userId,
    map_type: payload.mapType,
    project_name: payload.projectName,
    screen_name: payload.screenName,
    aspect_ratio_w: payload.aspectRatioW,
    aspect_ratio_h: payload.aspectRatioH,
    resolution_w: payload.resolutionW,
    resolution_h: payload.resolutionH,
    settings: payload.settings,
  });

  if (error) {
    console.error("Error saving pixel map:", error);
    throw error;
  }
};
