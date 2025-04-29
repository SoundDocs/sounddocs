import { supabase } from './supabase';
import { nanoid } from 'nanoid';

export interface SharedLink {
  id: string;
  resource_id: string;
  resource_type: 'patch_sheet' | 'stage_plot';
  link_type: 'view' | 'edit';
  share_code: string;
  expires_at: string | null;
  created_at: string;
  last_accessed: string | null;
  access_count: number;
}

// Generate a share link with a custom expiration
export const createShareLink = async (
  resourceId: string, 
  resourceType: 'patch_sheet' | 'stage_plot',
  linkType: 'view' | 'edit',
  expirationDays: number | null
) => {
  try {
    // Get the current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }

    // Generate a unique share code
    const shareCode = nanoid(12);
    
    // Calculate expiration date if provided
    const expiresAt = expirationDays 
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString() 
      : null;
    
    // Add entry to shared_links table with user_id
    const { data, error } = await supabase
      .from('shared_links')
      .upsert([
        {
          user_id: userData.user.id, // Add user_id for RLS policy
          resource_id: resourceId,
          resource_type: resourceType,
          link_type: linkType,
          share_code: shareCode,
          expires_at: expiresAt,
          last_accessed: null,
          access_count: 0
        }
      ], {
        onConflict: 'user_id,resource_id,resource_type,link_type'
      })
      .select();
    
    if (error) throw error;
    
    return data?.[0];
  } catch (error) {
    console.error('Error creating share link:', error);
    throw error;
  }
};

// Get all share links for a specific resource
export const getShareLinks = async (resourceId: string, resourceType: 'patch_sheet' | 'stage_plot') => {
  try {
    const { data, error } = await supabase
      .from('shared_links')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data as SharedLink[];
  } catch (error) {
    console.error('Error fetching share links:', error);
    throw error;
  }
};

// Delete a share link
export const deleteShareLink = async (linkId: string) => {
  try {
    const { error } = await supabase
      .from('shared_links')
      .delete()
      .eq('id', linkId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting share link:', error);
    throw error;
  }
};

// Update a share link's expiration
export const updateShareLinkExpiration = async (linkId: string, expirationDays: number | null) => {
  try {
    const expiresAt = expirationDays 
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString() 
      : null;
      
    const { data, error } = await supabase
      .from('shared_links')
      .update({ expires_at: expiresAt })
      .eq('id', linkId)
      .select();
    
    if (error) throw error;
    
    return data?.[0] as SharedLink;
  } catch (error) {
    console.error('Error updating share link:', error);
    throw error;
  }
};

// Verify a share link and increment access count
export const verifyShareLink = async (shareCode: string) => {
  try {
    // Use the database function to get the share link
    const { data, error } = await supabase
      .rpc('get_shared_link_by_code', { p_share_code: shareCode });
    
    if (error) {
      console.error('Error fetching share link:', error);
      throw new Error('Share link not found');
    }
    
    if (!data || data.length === 0) {
      throw new Error('Share link not found');
    }
    
    // Get the first (and should be only) result
    const shareLink = data[0];
    
    // Check if link is expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      throw new Error('Share link has expired');
    }
    
    // Update access count and last accessed
    const { error: updateError } = await supabase
      .from('shared_links')
      .update({ 
        last_accessed: new Date().toISOString(),
        access_count: (shareLink.access_count || 0) + 1
      })
      .eq('id', shareLink.id);
    
    if (updateError) throw updateError;
    
    return shareLink;
  } catch (error) {
    console.error('Error verifying share link:', error);
    throw error;
  }
};

// Get shared resource data
export const getSharedResource = async (shareCode: string) => {
  try {
    if (!shareCode) {
      throw new Error('Share code is required');
    }
    
    // Use the database function to reliably fetch the share link
    const { data: shareLinkData, error: shareLinkError } = await supabase
      .rpc('get_shared_link_by_code', { p_share_code: shareCode });
      
    if (shareLinkError) {
      console.error('Link error:', shareLinkError);
      throw new Error('Error fetching share link: ' + shareLinkError.message);
    }
    
    if (!shareLinkData || shareLinkData.length === 0) {
      throw new Error('Share link not found');
    }
    
    // Get the first (and should be only) result
    const shareLink = shareLinkData[0];
    
    // Check if link is expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      throw new Error('Share link has expired');
    }
    
    // Fetch the resource using the resource_id from the link
    const { data: resourceData, error: resourceError } = shareLink.resource_type === 'patch_sheet'
      ? await supabase
          .from('patch_sheets')
          .select('*')
          .eq('id', shareLink.resource_id)
          .single()
      : await supabase
          .from('stage_plots')
          .select('*')
          .eq('id', shareLink.resource_id)
          .single();
    
    if (resourceError) {
      console.error('Resource error:', resourceError);
      throw new Error('Error fetching resource: ' + resourceError.message);
    }
    
    if (!resourceData) {
      throw new Error('Resource not found');
    }
    
    // Update access count and last accessed timestamp
    await supabase
      .from('shared_links')
      .update({ 
        last_accessed: new Date().toISOString(),
        access_count: (shareLink.access_count || 0) + 1
      })
      .eq('id', shareLink.id);
    
    return {
      resource: resourceData,
      shareLink
    };
  } catch (error) {
    console.error('Error fetching shared resource:', error);
    throw error;
  }
};

// Generate frontend URL for a share link
export const getShareUrl = (shareCode: string) => {
  // Always use sounddocs.org domain for share links
  return `https://sounddocs.org/shared/${shareCode}`;
};

// Update a shared resource (for edit links)
export const updateSharedResource = async (
  shareCode: string,
  resourceType: 'patch_sheet' | 'stage_plot',
  updates: any
) => {
  try {
    if (!shareCode) {
      throw new Error('Share code is required');
    }
    
    // First verify the share link and permissions using our database function
    const { data: shareLinkData, error: linkError } = await supabase
      .rpc('get_shared_link_by_code', { p_share_code: shareCode });
    
    if (linkError) {
      console.error('Link error:', linkError);
      throw new Error('Error fetching share link: ' + linkError.message);
    }
    
    if (!shareLinkData || shareLinkData.length === 0) {
      throw new Error('Share link not found');
    }
    
    // Get the first (and should be only) result
    const shareLink = shareLinkData[0];
    
    if (shareLink.link_type !== 'edit') {
      throw new Error('This link does not have edit permissions');
    }
    
    if (shareLink.resource_type !== resourceType) {
      throw new Error('Resource type mismatch');
    }
    
    // Check if link is expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      throw new Error('Share link has expired');
    }
    
    // Add last_edited field to updates
    const updatesWithTimestamp = {
      ...updates,
      last_edited: new Date().toISOString()
    };
    
    // Update the appropriate resource
    const { data, error } = resourceType === 'patch_sheet'
      ? await supabase
          .from('patch_sheets')
          .update(updatesWithTimestamp)
          .eq('id', shareLink.resource_id)
          .select()
      : await supabase
          .from('stage_plots')
          .update(updatesWithTimestamp)
          .eq('id', shareLink.resource_id)
          .select();
    
    if (error) {
      console.error('Update error:', error);
      throw new Error('Error updating shared resource: ' + error.message);
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating shared resource:', error);
    throw error;
  }
};
