import { supabase } from "./supabase";
import { nanoid } from "nanoid";

export interface SharedLink {
  id: string;
  resource_id: string;
  resource_type: "patch_sheet" | "stage_plot";
  link_type: "view" | "edit";
  share_code: string;
  expires_at: string | null;
  created_at: string;
  last_accessed: string | null;
  access_count: number;
  user_id?: string; // Added user_id for clarity
}

// Generate a share link with a custom expiration
export const createShareLink = async (
  resourceId: string,
  resourceType: "patch_sheet" | "stage_plot",
  linkType: "view" | "edit",
  expirationDays: number | null,
): Promise<SharedLink> => {
  // Added return type promise
  try {
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("Authentication error:", userError);
      throw new Error("User not authenticated");
    }
    const userId = userData.user.id;

    // Generate a unique share code
    const shareCode = nanoid(12);

    // Calculate expiration date if provided
    const expiresAt = expirationDays
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Prepare data for upsert
    const linkData = {
      user_id: userId, // Add user_id for RLS policy
      resource_id: resourceId,
      resource_type: resourceType,
      link_type: linkType,
      share_code: shareCode,
      expires_at: expiresAt,
      last_accessed: null,
      access_count: 0,
    };

    console.log("Attempting to create share link with data:", linkData);

    // Add entry to shared_links table with user_id
    const { data, error } = await supabase
      .from("shared_links")
      .upsert([linkData], {
        // Define conflict target based on your table constraints
        // Assuming a unique constraint on (user_id, resource_id, resource_type, link_type)
        onConflict: "user_id,resource_id,resource_type,link_type",
      })
      .select()
      .single(); // Use single() if upsert should return only one row

    if (error) {
      console.error("Supabase error creating share link:", error);
      throw new Error(`Failed to create share link: ${error.message}`);
    }

    if (!data) {
      console.error("No data returned after creating share link.");
      throw new Error("Failed to create share link: No data returned.");
    }

    console.log("Share link created successfully:", data);
    return data as SharedLink; // Cast to SharedLink
  } catch (error) {
    console.error("Error in createShareLink function:", error);
    // Re-throw the specific error or a generic one
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while creating the share link.");
  }
};

// Get all share links for a specific resource
export const getShareLinks = async (
  resourceId: string,
  resourceType: "patch_sheet" | "stage_plot",
): Promise<SharedLink[]> => {
  try {
    const { data, error } = await supabase
      .from("shared_links")
      .select("*")
      .eq("resource_id", resourceId)
      .eq("resource_type", resourceType)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error fetching share links:", error);
      throw error;
    }

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

    if (error) {
      console.error("Supabase error deleting share link:", error);
      throw error;
    }

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
      .single(); // Expecting a single row update

    if (error) {
      console.error("Supabase error updating share link expiration:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Failed to update share link: No data returned.");
    }

    return data as SharedLink;
  } catch (error) {
    console.error("Error updating share link expiration:", error);
    throw error;
  }
};

// Verify a share link and increment access count (using RPC)
export const verifyShareLink = async (shareCode: string): Promise<SharedLink> => {
  try {
    console.log(`Verifying share link with code: ${shareCode}`);
    // Use the database function to get the share link
    const { data, error } = await supabase.rpc("get_shared_link_by_code", {
      p_share_code: shareCode,
    });

    if (error) {
      console.error("Error calling RPC get_shared_link_by_code:", error);
      throw new Error(`Share link verification failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn(`Share link not found for code: ${shareCode}`);
      throw new Error("Share link not found");
    }

    // Get the first (and should be only) result
    const shareLink = data[0] as SharedLink; // Cast the result
    console.log("Found share link:", shareLink);

    // Check if link is expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      console.warn(`Share link expired: ${shareCode}`);
      throw new Error("Share link has expired");
    }

    // Update access count and last accessed (no need to wait for this)
    supabase
      .from("shared_links")
      .update({
        last_accessed: new Date().toISOString(),
        access_count: (shareLink.access_count || 0) + 1,
      })
      .eq("id", shareLink.id)
      .then(({ error: updateError }) => {
        if (updateError) {
          console.error("Error updating access count/last accessed:", updateError);
        } else {
          console.log(`Access count updated for link ID: ${shareLink.id}`);
        }
      });

    return shareLink;
  } catch (error) {
    console.error("Error verifying share link:", error);
    // Re-throw the specific error or a generic one
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred during share link verification.");
  }
};

// Get shared resource data
export const getSharedResource = async (shareCode: string) => {
  try {
    if (!shareCode) {
      throw new Error("Share code is required");
    }
    console.log(`Getting shared resource for code: ${shareCode}`);

    // Use the verify function which includes RPC call and checks
    const shareLink = await verifyShareLink(shareCode);
    console.log(`Verified share link for resource fetch:`, shareLink);

    // Fetch the resource using the resource_id and resource_type from the link
    const tableName = shareLink.resource_type === "patch_sheet" ? "patch_sheets" : "stage_plots";
    console.log(`Fetching resource from table: ${tableName}, ID: ${shareLink.resource_id}`);

    const { data: resourceData, error: resourceError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", shareLink.resource_id)
      .single();

    if (resourceError) {
      console.error(`Error fetching resource from ${tableName}:`, resourceError);
      throw new Error(`Error fetching resource: ${resourceError.message}`);
    }

    if (!resourceData) {
      console.error(`Resource not found in ${tableName} with ID: ${shareLink.resource_id}`);
      throw new Error("Resource not found");
    }

    console.log("Successfully fetched resource:", resourceData);

    // Access count update is now handled within verifyShareLink

    return {
      resource: resourceData,
      shareLink, // Return the verified shareLink object
    };
  } catch (error) {
    console.error("Error getting shared resource:", error);
    // Propagate the error message from verifyShareLink or resource fetching
    throw error;
  }
};

// Generate frontend URL for a share link
export const getShareUrl = (
  shareCode: string,
  resourceType?: "patch_sheet" | "stage_plot",
  linkType?: "view" | "edit",
): string => {
  const baseUrl = "https://sounddocs.org"; // Use production URL always for sharing

  // Construct more specific URLs based on type if available
  if (resourceType === "stage_plot") {
    if (linkType === "edit") {
      return `${baseUrl}/shared/stage-plot/edit/${shareCode}`;
    }
    return `${baseUrl}/shared/stage-plot/${shareCode}`;
  } else if (resourceType === "patch_sheet") {
    if (linkType === "edit") {
      // Assuming '/shared/edit/' is for patch sheets based on App.tsx
      return `${baseUrl}/shared/edit/${shareCode}`;
    }
    // Fallback to generic /shared/ for patch sheet view links
    return `${baseUrl}/shared/${shareCode}`;
  }

  // Fallback for older links or if type is unknown
  console.warn("Generating generic share URL as resourceType was not provided.");
  return `${baseUrl}/shared/${shareCode}`;
};

// Update a shared resource (for edit links)
export const updateSharedResource = async (
  shareCode: string,
  resourceType: "patch_sheet" | "stage_plot",
  updates: any,
) => {
  try {
    if (!shareCode) {
      throw new Error("Share code is required");
    }
    console.log(`Attempting to update shared resource: ${resourceType} with code: ${shareCode}`);

    // First verify the share link and permissions using our verify function
    const shareLink = await verifyShareLink(shareCode);
    console.log("Verified share link for update:", shareLink);

    if (shareLink.link_type !== "edit") {
      console.warn(`Attempted update with non-edit link: ${shareCode}`);
      throw new Error("This link does not have edit permissions");
    }

    if (shareLink.resource_type !== resourceType) {
      console.error(
        `Resource type mismatch during update. Expected ${resourceType}, got ${shareLink.resource_type}`,
      );
      throw new Error("Resource type mismatch");
    }

    // Add last_edited field to updates
    const updatesWithTimestamp = {
      ...updates,
      last_edited: new Date().toISOString(),
    };

    // Determine table name
    const tableName = resourceType === "patch_sheet" ? "patch_sheets" : "stage_plots";
    console.log(`Updating resource in table: ${tableName}, ID: ${shareLink.resource_id}`);

    // Update the appropriate resource
    const { data, error } = await supabase
      .from(tableName)
      .update(updatesWithTimestamp)
      .eq("id", shareLink.resource_id)
      .select()
      .single(); // Expecting a single row update

    if (error) {
      console.error(`Supabase error updating shared resource in ${tableName}:`, error);
      throw new Error(`Error updating shared resource: ${error.message}`);
    }

    if (!data) {
      console.error(`No data returned after updating shared resource in ${tableName}.`);
      throw new Error("Failed to update shared resource: No data returned.");
    }

    console.log("Shared resource updated successfully:", data);
    return data; // Return the updated resource data
  } catch (error) {
    console.error("Error updating shared resource:", error);
    // Re-throw the specific error or a generic one
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while updating the shared resource.");
  }
};
