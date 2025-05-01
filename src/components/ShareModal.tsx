import React, { useState, useEffect } from 'react';
import { Share, Link as LinkIcon, Copy, AlertCircle, Clock, Trash2, CalendarClock, Check, Edit } from 'lucide-react'; // Renamed Link to LinkIcon
import { createShareLink, getShareLinks, deleteShareLink, updateShareLinkExpiration, getShareUrl, SharedLink } from '../lib/shareUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceType: 'patch_sheet' | 'stage_plot';
  resourceName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, resourceId, resourceType, resourceName }) => {
  const [loading, setLoading] = useState(false);
  const [shareLinks, setShareLinks] = useState<SharedLink[]>([]);
  const [newLinkType, setNewLinkType] = useState<'view' | 'edit'>('view');
  const [newLinkExpiration, setNewLinkExpiration] = useState<number | null>(7); // Default to 7 days
  const [error, setError] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [customExpirationDays, setCustomExpirationDays] = useState<number>(30);
  const [showCustomExpirationInput, setShowCustomExpirationInput] = useState(false); // State to control custom input visibility
  
  const resourceTypeLabel = resourceType === 'patch_sheet' ? 'Patch Sheet' : 'Stage Plot';

  // Load existing share links when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null); // Clear previous errors
      setNewLinkType('view'); // Reset new link type
      setNewLinkExpiration(7); // Reset expiration
      setShowCustomExpirationInput(false); // Hide custom input
      fetchShareLinks();
    }
  }, [isOpen, resourceId, resourceType]);

  const fetchShareLinks = async () => {
    try {
      setLoading(true);
      setError(null); // Clear error before fetching
      const links = await getShareLinks(resourceId, resourceType);
      setShareLinks(links);
    } catch (err: any) {
      console.error('Error fetching share links:', err);
      setError(`Failed to load existing share links: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewLink = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if a link of this type already exists
      const existingLink = shareLinks.find(link => link.link_type === newLinkType);
      
      if (existingLink) {
        setError(`A ${newLinkType} link already exists for this ${resourceTypeLabel.toLowerCase()}. Please delete it first or modify its expiration.`);
        setLoading(false);
        return;
      }
      
      // Determine the expiration days to use
      let expiration = newLinkExpiration;
      if (showCustomExpirationInput) {
        expiration = customExpirationDays > 0 ? customExpirationDays : null; // Use custom days, or null if invalid/zero
      }

      console.log(`Creating link: type=${newLinkType}, expiration=${expiration} days`);

      const newLink = await createShareLink(
        resourceId, 
        resourceType, 
        newLinkType, 
        expiration // Use the determined expiration
      );
      
      if (newLink) {
        // Add the new link to the list
        setShareLinks([newLink, ...shareLinks]);
        // Copy the new link to clipboard
        const shareUrl = getShareUrl(newLink.share_code, newLink.resource_type, newLink.link_type);
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLinkId(newLink.id);
        
        // Reset copy indication after 3 seconds
        setTimeout(() => {
          setCopiedLinkId(null);
        }, 3000);

        // Reset form state
        setNewLinkType('view');
        setNewLinkExpiration(7);
        setShowCustomExpirationInput(false);
      }
    } catch (err: any) {
      console.error('Error creating share link:', err);
      setError(`Failed to create share link: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (confirm('Are you sure you want to delete this share link? Anyone using it will lose access.')) {
      try {
        setLoading(true);
        setError(null); // Clear error before deleting
        await deleteShareLink(linkId);
        setShareLinks(shareLinks.filter(link => link.id !== linkId));
      } catch (err: any) {
        console.error('Error deleting share link:', err);
        setError(`Failed to delete share link: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopyLink = async (shareCode: string, linkId: string, resourceType: 'patch_sheet' | 'stage_plot', linkType: 'view' | 'edit') => {
    try {
      setError(null); // Clear error on copy attempt
      const shareUrl = getShareUrl(shareCode, resourceType, linkType);
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLinkId(linkId);
      
      // Reset copy indication after 3 seconds
      setTimeout(() => {
          setCopiedLinkId(null);
        }, 3000);
    } catch (err) {
      console.error('Error copying link:', err);
      setError('Failed to copy link to clipboard');
    }
  };

  const handleUpdateExpiration = async (linkId: string, expirationDays: number | null) => {
    try {
      setLoading(true);
      setError(null); // Clear error before updating
      const updatedLink = await updateShareLinkExpiration(linkId, expirationDays);
      
      if (updatedLink) {
        // Update the link in the list
        setShareLinks(shareLinks.map(link => 
          link.id === linkId ? updatedLink : link
        ));
      }
    } catch (err: any) {
      console.error('Error updating expiration:', err);
      setError(`Failed to update link expiration: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Format expiration date for display
  const formatExpirationDate = (date: string | null) => {
    if (!date) return 'Never expires';
    
    const expirationDate = new Date(date);
    const now = new Date();
    
    // Calculate days remaining
    const diffTime = expirationDate.getTime() - now.getTime();
    
    if (diffTime < 0) return 'Expired'; // Already expired

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Expires today'; // Expires within the next 24 hours
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  // Get status color based on expiration
  const getExpirationStatusColor = (date: string | null) => {
    if (!date) return 'text-green-400'; // Never expires
    
    const expirationDate = new Date(date);
    const now = new Date();
    
    const diffTime = expirationDate.getTime() - now.getTime();
    
    if (diffTime < 0) return 'text-red-400'; // Expired

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 3) return 'text-yellow-400'; // Almost expired (less than 3 days)
    return 'text-green-400'; // Healthy
  };

  // Calculate expiration value for the select dropdown
  const getExpirationSelectValue = (date: string | null): string => {
    if (!date) return 'never';
    
    const expirationDate = new Date(date);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'expired'; // Handle expired case for select if needed

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check against standard options
    if ([1, 7, 30, 90].includes(diffDays)) {
      return diffDays.toString();
    }
    
    // If it's not a standard option or never, consider it custom or handle appropriately
    // For simplicity, if it's a valid future date not matching standard, maybe default to nearest or just show current state
    // Let's just return the days for now, might need refinement
    return diffDays.toString(); 
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl z-10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
          <Share className="h-5 w-5 mr-2 text-indigo-400" />
          Share {resourceTypeLabel}
        </h2>
        <p className="text-gray-300 mb-6">Create links to share "{resourceName}" with others</p>
        
        {error && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-white text-xs">Dismiss</button>
          </div>
        )}
        
        {/* Create new share link section */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Create New Share Link</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Link Type</label>
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 rounded-md flex-1 text-sm ${
                    newLinkType === 'view' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-550'
                  }`}
                  onClick={() => setNewLinkType('view')}
                >
                  View Only
                </button>
                <div className="relative flex-1 group">
                  <button
                    className={`w-full px-4 py-2 rounded-md text-sm ${
                      newLinkType === 'edit' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-550'
                    } opacity-50 cursor-not-allowed`}
                    onClick={() => setNewLinkType('edit')}
                    disabled // Keep disabled for now
                    title="Edit links are currently under development"
                  >
                    View & Edit
                  </button>
                  {/* Tooltip for disabled edit button */}
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-100 pointer-events-none">
                    Edit links coming soon!
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Expiration</label>
              <select
                value={showCustomExpirationInput ? 'custom' : (newLinkExpiration === null ? 'never' : newLinkExpiration.toString())}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'custom') {
                    setShowCustomExpirationInput(true);
                    // Optionally set a default custom value or keep the last one
                    setNewLinkExpiration(null); // Indicate custom mode is active
                  } else {
                    setShowCustomExpirationInput(false);
                    setNewLinkExpiration(value === 'never' ? null : parseInt(value, 10));
                  }
                }}
                className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="custom">Custom...</option>
                <option value="never">Never expires</option>
              </select>
            </div>
            
            {/* Custom expiration input */}
            {showCustomExpirationInput && (
              <div className="md:col-span-2">
                <label className="block text-gray-300 mb-2 text-sm">Custom Expiration (days)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="365" // Set a reasonable max
                    value={customExpirationDays}
                    onChange={(e) => {
                      let days = parseInt(e.target.value, 10);
                      if (isNaN(days) || days < 1) days = 1;
                      if (days > 365) days = 365;
                      setCustomExpirationDays(days);
                    }}
                    className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter days (1-365)"
                  />
                  {/* No separate "Set" button needed, value is used on Create */}
                </div>
                 <p className="text-xs text-gray-400 mt-1">Link will expire after the specified number of days.</p>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleCreateNewLink}
              disabled={loading || (showCustomExpirationInput && (isNaN(customExpirationDays) || customExpirationDays < 1))}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Link...
                </div>
              ) : (
                'Create Share Link'
              )}
            </button>
          </div>
        </div>
        
        {/* Existing share links section */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Existing Share Links</h3>
          
          {loading && shareLinks.length === 0 && ( // Show loading indicator only if list is empty
             <div className="text-center py-4">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 mx-auto"></div>
               <p className="text-gray-400 mt-2 text-sm">Loading links...</p>
             </div>
          )}

          {!loading && shareLinks.length === 0 && ( // Show empty state only when not loading
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6 text-center">
              <CalendarClock className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No share links have been created yet for this {resourceTypeLabel.toLowerCase()}.</p>
            </div>
          )}

          {shareLinks.length > 0 && (
            <div className="space-y-4">
              {shareLinks.map(link => (
                <div key={link.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors duration-150">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-md mr-3 ${
                        link.link_type === 'view' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {link.link_type === 'view' ? (
                          <LinkIcon className="h-5 w-5" />
                        ) : (
                          <Edit className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-white">
                          {link.link_type === 'view' ? 'View-only' : 'Edit'} Link
                        </span>
                        <div className={`flex items-center mt-1 ${getExpirationStatusColor(link.expires_at)}`}>
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {formatExpirationDate(link.expires_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleCopyLink(link.share_code, link.id, link.resource_type, link.link_type)}
                        className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
                        title="Copy link"
                      >
                        {copiedLinkId === link.id ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={loading}
                        className="p-2 rounded-md text-gray-300 hover:text-red-400 hover:bg-gray-600 transition-colors disabled:opacity-50"
                        title="Delete link"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Link URL Input */}
                   <div className="mb-3 bg-gray-800 p-2 rounded-lg flex items-center justify-between">
                    <input
                      type="text"
                      readOnly
                      value={getShareUrl(link.share_code, link.resource_type, link.link_type)}
                      className="flex-grow bg-transparent border-none outline-none text-indigo-300 text-sm px-2 overflow-x-auto"
                      onClick={(e) => (e.target as HTMLInputElement).select()} // Select text on click
                    />
                    <button
                      onClick={() => handleCopyLink(link.share_code, link.id, link.resource_type, link.link_type)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        copiedLinkId === link.id 
                          ? 'text-white bg-indigo-600' 
                          : 'text-gray-300 bg-gray-700 hover:bg-indigo-600'
                      }`}
                    >
                      {copiedLinkId === link.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  {/* Stats and Expiration Update */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div className="col-span-1 sm:col-span-2 grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-400">Created</p>
                          <p className="text-sm text-gray-300 truncate" title={new Date(link.created_at).toLocaleString()}>
                            {new Date(link.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Last Used</p>
                          <p className="text-sm text-gray-300 truncate" title={link.last_accessed ? new Date(link.last_accessed).toLocaleString() : 'Never'}>
                            {link.last_accessed ? new Date(link.last_accessed).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Uses</p>
                          <p className="text-sm text-gray-300">
                            {link.access_count || 0}
                          </p>
                        </div>
                     </div>

                     <div className="col-span-1">
                        <label className="block text-gray-300 mb-1 text-xs">Change Expiration</label>
                        <select 
                          className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                          onChange={(e) => {
                            const value = e.target.value;
                            handleUpdateExpiration(link.id, value === 'never' ? null : parseInt(value, 10));
                          }}
                          value={getExpirationSelectValue(link.expires_at)}
                          disabled={loading}
                        >
                          {/* Add an option reflecting the current state if it's expired or custom */}
                          {link.expires_at && new Date(link.expires_at) < new Date() && <option value="expired" disabled>Expired</option>}
                          
                          <option value="1">1 day</option>
                          <option value="7">7 days</option>
                          <option value="30">30 days</option>
                          <option value="90">90 days</option>
                          {/* Consider adding a 'Custom' display if getExpirationSelectValue returns non-standard */}
                          <option value="never">Never expires</option>
                        </select>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white hover:bg-gray-600 rounded-md font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
