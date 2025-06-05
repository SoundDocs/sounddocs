import { supabase } from "./supabase";
import { nanoid } from "nanoid";

// Updated ResourceType to include 'run_of_show'
export type ResourceType = "patch_sheet" | "stage_plot" | "production_schedule" | "run_of_show";

export interface SharedLink {
  id: string; // This is shared_links.id
  resource_id: string; // This is the ID of the actual resource (e.g., run_of_shows.id)
  resource_type: ResourceType;
  link_type: "view" | "edit";
  share_code: string;
  expires_at: string | null;
  created_at: string;
  last_accessed: string | null;
  access_count: number;
  user_id?: string; // Original owner of the share link
}

// Interface for the data returned by get_public_run_of_show_by_share_code RPC
export interface SharedRunOfShowData {
  id: string; // run_of_shows.id
  name: string;
  items: any[]; // Sanitized items
  custom_column_definitions: any[];
  created_at: string;
  last_edited: string | null;
  live_show_data: any | null; // To store { currentItemIndex, isTimerActive, timeRemaining }
  resource_id: string; // Corresponds to SharedLink.resource_id
  resource_type: string; // Should be 'run_of_show'
  link_id: string; // Corresponds to SharedLink.id
}

export interface ClaimedDocumentInfo {
  claimed_share_id: string;
  shared_link_id: string;
  resource_id: string;
  resource_type: ResourceType;
  link_type: "view" | "edit";
  resource_name: string;
  claimed_at: string;
  share_code: string;
  original_owner_id: string | null;
}


// Generate a share link with a custom expiration
export const createShareLink = async (
  resourceId: string,
  resourceType: ResourceType,
  linkType: "view" | "edit",
  expirationDays: number | null,
): Promise<SharedLink> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("Authentication error:", userError);
      throw new Error("User not authenticated");
    }
    const userId = userData.user.id;
    const shareCode = nanoid(12);
    const expiresAt = expirationDays
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const linkData = {
      user_id: userId,
      resource_id: resourceId,
      resource_type: resourceType,
      link_type: linkType,
      share_code: shareCode,
      expires_at: expiresAt,
      last_accessed: null,
      access_count: 0,
    };

    const { data, error } = await supabase
      .from("shared_links")
      .upsert([linkData], {
        onConflict: "user_id,resource_id,resource_type,link_type", // Ensure this constraint exists or adjust
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating share link:", error);
      throw new Error(`Failed to create share link: ${error.message}`);
    }
    if (!data) {
      console.error("No data returned after creating share link.");
      throw new Error("Failed to create share link: No data returned.");
    }
    return data as SharedLink;
  } catch (error) {
    console.error("Error in createShareLink function:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while creating the share link.");
  }
};

// Get all share links for a specific resource
export const getShareLinks = async (
  resourceId: string,
  resourceType: ResourceType,
): Promise<SharedLink[]> => {
  try {
    const { data, error } = await supabase
      .from("shared_links")
      .select("*")
      .eq("resource_id", resourceId)
      .eq("resource_type", resourceType)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as SharedLink[];
  } catch (error) {
    console.error("Error fetching share links:", error);
    throw error;
  }
};

// Delete a share link
export const deleteShareLink = async (linkId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("shared_links").delete().eq("id", linkId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting share link:", error);
    throw error;
  }
};

// Update a share link's expiration
export const updateShareLinkExpiration = async (
  linkId: string,
  expirationDays: number | null,
): Promise<SharedLink> => {
  try {
    const expiresAt = expirationDays
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from("shared_links")
      .update({ expires_at: expiresAt })
      .eq("id", linkId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update share link: No data returned.");
    return data as SharedLink;
  } catch (error) {
    console.error("Error updating share link expiration:", error);
    throw error;
  }
};

export const verifyShareLink = async (shareCode: string): Promise<SharedLink> => {
  try {
    const { data, error } = await supabase.rpc("get_shared_link_by_code", {
      p_share_code: shareCode,
    });

    if (error) throw new Error(`Share link verification failed: ${error.message}`);
    if (!data || data.length === 0) throw new Error("Share link not found or invalid.");
    
    const shareLink = data[0] as SharedLink;

    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      throw new Error("Share link has expired");
    }
    return shareLink;
  } catch (error) {
    console.error("Error verifying share link:", error);
    // Make error messages more user-friendly
    if (error instanceof Error) {
        if (error.message.includes("SHARE_LINK_NOT_FOUND")) {
            throw new Error("Invalid or expired share code.");
        }
        if (error.message.includes("SHARE_LINK_EXPIRED")) {
            throw new Error("This share link has expired.");
        }
    }
    throw error;
  }
};

export const getSharedResource = async (shareCode: string): Promise<{ resource: any; shareLink: SharedLink }> => {
  try {
    if (!shareCode) throw new Error("Share code is required");

    const { data: linkRpcData, error: linkRpcError } = await supabase.rpc("get_shared_link_by_code", {
      p_share_code: shareCode,
    });

    if (linkRpcError) {
      console.error("Error calling RPC get_shared_link_by_code:", linkRpcError);
      if (linkRpcError.message.includes("SHARE_LINK_NOT_FOUND")) throw new Error("Share link not found.");
      if (linkRpcError.message.includes("SHARE_LINK_EXPIRED")) throw new Error("This share link has expired.");
      if (linkRpcError.message.includes("LINK_NOT_FOR_VIEWING")) throw new Error("Failed to fetch shared Run of Show: LINK_NOT_FOR_VIEWING");
      throw new Error(`Share link verification failed: ${linkRpcError.message}`);
    }

    if (!linkRpcData || linkRpcData.length === 0) {
      throw new Error("Share link not found.");
    }
    
    const verifiedLink = linkRpcData[0] as SharedLink; 

    if (verifiedLink.expires_at && new Date(verifiedLink.expires_at) < new Date()) {
      throw new Error("This share link has expired.");
    }

    let resourceData;

    if (verifiedLink.resource_type === "run_of_show") {
      // This RPC is for VIEWING. For EDITING, the editor component will fetch directly.
      // If link_type is 'edit', this RPC will throw LINK_NOT_FOR_VIEWING, which is handled above.
      const { data: rosData, error: rosError } = await supabase.rpc("get_public_run_of_show_by_share_code", {
        p_share_code: shareCode,
      });

      if (rosError) {
        console.error("Error calling RPC get_public_run_of_show_by_share_code:", rosError);
        if (rosError.message.includes("RUN_OF_SHOW_NOT_FOUND")) throw new Error("The linked Run of Show could not be found.");
        // The LINK_NOT_FOR_VIEWING case is now handled by the get_shared_link_by_code RPC error check if it propagates
        throw new Error(`Failed to fetch shared Run of Show: ${rosError.message}`);
      }
      if (!rosData || rosData.length === 0) {
        throw new Error("Shared Run of Show data not found.");
      }
      resourceData = rosData[0] as SharedRunOfShowData;
    } else {
      const tableName =
        verifiedLink.resource_type === "patch_sheet"
          ? "patch_sheets"
          : verifiedLink.resource_type === "stage_plot"
            ? "stage_plots"
            : "production_schedules"; 

      const { data: tableResourceData, error: tableResourceError } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", verifiedLink.resource_id)
        .single();

      if (tableResourceError) {
        console.error(`Error fetching resource from ${tableName}:`, tableResourceError);
        throw new Error(`Error fetching resource: ${tableResourceError.message}`);
      }
      if (!tableResourceData) {
        throw new Error("Resource not found");
      }
      resourceData = tableResourceData;

      supabase
        .from("shared_links")
        .update({
          last_accessed: new Date().toISOString(),
          access_count: (verifiedLink.access_count || 0) + 1,
        })
        .eq("id", verifiedLink.id) 
        .then(({ error: updateError }) => {
          if (updateError) console.error("Error updating access count/last accessed:", updateError);
        });
    }

    return {
      resource: resourceData,
      shareLink: verifiedLink, 
    };

  } catch (error) {
    console.error("Error getting shared resource:", error);
    throw error;
  }
};

export const getShareUrl = (
  shareCode: string,
  resourceType?: ResourceType,
  linkType?: "view" | "edit",
): string => {
  const baseUrl = window.location.origin; 

  if (resourceType === "run_of_show") {
    if (linkType === "edit") {
      return `${baseUrl}/shared/run-of-show/edit/${shareCode}`;
    }
    return `${baseUrl}/shared/run-of-show/${shareCode}`; // View-only (Show Mode)
  } else if (resourceType === "stage_plot") {
    if (linkType === "edit") {
      return `${baseUrl}/shared/stage-plot/edit/${shareCode}`;
    }
    return `${baseUrl}/shared/stage-plot/${shareCode}`;
  } else if (resourceType === "patch_sheet") {
    if (linkType === "edit") {
      return `${baseUrl}/shared/edit/${shareCode}`; // Generic edit for patch sheets
    }
    return `${baseUrl}/shared/${shareCode}`; // Generic view for patch sheets
  } else if (resourceType === "production_schedule") {
    if (linkType === "edit") {
      return `${baseUrl}/shared/production-schedule/edit/${shareCode}`;
    }
    return `${baseUrl}/shared/production-schedule/${shareCode}`;
  }

  console.warn(`Generating generic share URL for share_code ${shareCode} as resourceType "${resourceType}" or linkType "${linkType}" was not fully matched or provided for specific routing.`);
  return `${baseUrl}/shared/${shareCode}`; 
};

export const updateSharedResource = async (
  shareCode: string,
  resourceType: ResourceType,
  updates: any,
) => {
  try {
    if (!shareCode) throw new Error("Share code is required");
    
    // For Run of Show, updates are handled directly in RunOfShowEditor due to complexity (live_show_data etc.)
    // This function can be used for simpler resources or adapted if needed.
    if (resourceType === "run_of_show") {
        console.warn("Run of Show updates should be handled by RunOfShowEditor's save logic directly.");
        throw new Error("Direct update for Run of Show via this generic function is not recommended.");
    }

    const verifiedLink = await verifyShareLink(shareCode); 

    if (verifiedLink.link_type !== "edit") {
      throw new Error("This link does not have edit permissions");
    }
    if (verifiedLink.resource_type !== resourceType) {
      throw new Error("Resource type mismatch");
    }

    const updatesWithTimestamp = { ...updates, last_edited: new Date().toISOString() };
    const tableName =
      resourceType === "patch_sheet"
        ? "patch_sheets"
        : resourceType === "stage_plot"
          ? "stage_plots"
          : "production_schedules"; // Excludes run_of_shows here

    const { data, error } = await supabase
      .from(tableName)
      .update(updatesWithTimestamp)
      .eq("id", verifiedLink.resource_id)
      .select()
      .single();

    if (error) throw new Error(`Error updating shared resource: ${error.message}`);
    if (!data) throw new Error("Failed to update shared resource: No data returned.");
    return data;
  } catch (error) {
    console.error("Error updating shared resource:", error);
    throw error;
  }
};

/**
 * Adds a shared link to the current user's claimed shares.
 * @param userId The ID of the user claiming the share.
 * @param sharedLinkId The ID of the shared_links record.
 * @returns The newly created user_claimed_shares record.
 */
export const addClaimedShare = async (userId: string, sharedLinkId: string): Promise<any> => {
  if (!userId || !sharedLinkId) {
    throw new Error("User ID and Shared Link ID are required to claim a share.");
  }

  console.log('[addClaimedShare] Attempting to insert:', { user_id: userId, shared_link_id: sharedLinkId });

  const { data, error, status, statusText, count } = await supabase
    .from("user_claimed_shares")
    .insert({ user_id: userId, shared_link_id: sharedLinkId });

  console.log('[addClaimedShare] Insert operation response:', { data, error, status, statusText, count });

  if (error) {
    console.error("Error claiming shared link (raw Supabase error object):", JSON.stringify(error, null, 2));
    let errorMessage = `Failed to claim document: ${error.message}`;
    if (error.code) errorMessage += ` (Code: ${error.code})`;
    if (error.details) errorMessage += ` (Details: ${error.details})`;
    if (error.hint) errorMessage += ` (Hint: ${error.hint})`;
    
    if (error.code === '23505') { 
      throw new Error("You have already claimed this document.");
    }
    throw new Error(errorMessage);
  }
  return { success: true, user_id: userId, shared_link_id: sharedLinkId, claimed_at: new Date().toISOString() };
};

/**
 * Fetches all documents claimed by the current user.
 * @returns A promise that resolves to an array of ClaimedDocumentInfo.
 */
export const getClaimedDocuments = async (): Promise<ClaimedDocumentInfo[]> => {
  const { data, error } = await supabase.rpc("get_user_claimed_documents");

  if (error) {
    console.error("Error fetching claimed documents:", error);
    throw new Error(`Failed to fetch claimed documents: ${error.message}`);
  }
  return data as ClaimedDocumentInfo[];
};
