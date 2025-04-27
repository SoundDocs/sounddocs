import React, { useState, useEffect } from 'react';
import { Share, Link, Copy, AlertCircle, Clock, Trash2, CalendarClock, Check, Edit } from 'lucide-react';
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
  const [newLinkExpiration, setNewLinkExpiration] = useState<number | null>(7);
  const [error, setError] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [customExpirationDays, setCustomExpirationDays] = useState<number>(30);
  
  const resourceTypeLabel = resourceType === 'patch_sheet' ? 'Patch Sheet' : 'Stage Plot';

  // Load existing share links when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchShareLinks();
    }
  }, [isOpen, resourceId, resourceType]);

  const fetchShareLinks = async () => {
    try {
      setLoading(true);
      const links = await getShareLinks(resourceId, resourceType);
      setShareLinks(links);
    } catch (err) {
      console.error('Error fetching share links:', err);
      setError('Failed to load existing share links');
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
        setError(`A ${newLinkType} link already exists for this ${resourceTypeLabel.toLowerCase()}. Please delete it first.`);
        setLoading(false);
        return;
      }
      
      const newLink = await createShareLink(
        resourceId, 
        resourceType, 
        newLinkType, 
        newLinkExpiration
      );
      
      if (newLink) {
        // Add the new link to the list
        setShareLinks([newLink, ...shareLinks]);
        // Copy the new link to clipboard
        const shareUrl = getShareUrl(newLink.share_code);
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLinkId(newLink.id);
        
        // Reset copy indication after 3 seconds
        setTimeout(() => {
          setCopiedLinkId(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Error creating share link:', err);
      setError('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (confirm('Are you sure you want to delete this share link? Anyone using it will lose access.')) {
      try {
        setLoading(true);
        await deleteShareLink(linkId);
        setShareLinks(shareLinks.filter(link => link.id !== linkId));
      } catch (err) {
        console.error('Error deleting share link:', err);
        setError('Failed to delete share link');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopyLink = async (shareCode: string, linkId: string) => {
    try {
      const shareUrl = getShareUrl(shareCode);
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
      const updatedLink = await updateShareLinkExpiration(linkId, expirationDays);
      
      if (updatedLink) {
        // Update the link in the list
        setShareLinks(shareLinks.map(link => 
          link.id === linkId ? updatedLink : link
        ));
      }
    } catch (err) {
      console.error('Error updating expiration:', err);
      setError('Failed to update link expiration');
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  // Get status color based on expiration
  const getExpirationStatusColor = (date: string | null) => {
    if (!date) return 'text-green-400'; // Never expires
    
    const expirationDate = new Date(date);
    const now = new Date();
    
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-400'; // Expired
    if (diffDays < 3) return 'text-yellow-400'; // Almost expired
    return 'text-green-400'; // Healthy
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
            <p className="text-red-400">{error}</p>
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
                  className={`px-4 py-2 rounded-md flex-1 ${
                    newLinkType === 'view' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-550'
                  }`}
                  onClick={() => setNewLinkType('view')}
                >
                  View Only
                </button>
                <button
                  className={`px-4 py-2 rounded-md flex-1 ${
                    newLinkType === 'edit' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-550'
                  }`}
                  onClick={() => setNewLinkType('edit')}
                >
                  View & Edit
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2 text-sm">Expiration</label>
              <select
                value={newLinkExpiration === null ? 'never' : newLinkExpiration.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'never') {
                    setNewLinkExpiration(null);
                  } else if (value === 'custom') {
                    // Don't set newLinkExpiration yet, as user needs to input custom days
                  } else {
                    setNewLinkExpiration(parseInt(value, 10));
                  }
                }}
                className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            {newLinkExpiration !== null && newLinkExpiration.toString() === 'custom' && (
              <div className="md:col-span-2">
                <label className="block text-gray-300 mb-2 text-sm">Custom Expiration (days)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customExpirationDays}
                    onChange={(e) => setCustomExpirationDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
                    onClick={() => setNewLinkExpiration(customExpirationDays)}
                  >
                    Set
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleCreateNewLink}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Link...' : 'Create Share Link'}
            </button>
          </div>
        </div>
        
        {/* Existing share links section */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Existing Share Links</h3>
          
          {shareLinks.length > 0 ? (
            <div className="space-y-4">
              {shareLinks.map(link => (
                <div key={link.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-md mr-3 ${
                        link.link_type === 'view' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {link.link_type === 'view' ? (
                          <Link className="h-5 w-5" />
                        ) : (
                          <Edit className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-white">
                          {link.link_type === 'view' ? 'View-only' : 'Edit'} Link
                        </span>
                        <div className="flex items-center mt-1">
                          <Clock className={`h-4 w-4 mr-1 ${getExpirationStatusColor(link.expires_at)}`} />
                          <span className={`text-sm ${getExpirationStatusColor(link.expires_at)}`}>
                            {formatExpirationDate(link.expires_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleCopyLink(link.share_code, link.id)}
                        className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-600"
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
                        className="p-2 rounded-md text-gray-300 hover:text-red-400 hover:bg-gray-600"
                        title="Delete link"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 w-full">
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-400">Created</p>
                        <p className="text-sm text-gray-300">
                          {new Date(link.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-400">Last Accessed</p>
                        <p className="text-sm text-gray-300">
                          {link.last_accessed ? new Date(link.last_accessed).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-400">Access Count</p>
                        <p className="text-sm text-gray-300">
                          {link.access_count || 0} times
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 bg-gray-800 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex-grow mr-2 overflow-hidden">
                      <input
                        type="text"
                        readOnly
                        value={getShareUrl(link.share_code)}
                        className="w-full bg-transparent border-none outline-none text-indigo-300 text-sm overflow-x-auto"
                      />
                    </div>
                    
                    <button
                      onClick={() => handleCopyLink(link.share_code, link.id)}
                      className={`px-3 py-1 rounded-md text-xs font-medium bg-gray-700 hover:bg-indigo-600 ${
                        copiedLinkId === link.id ? 'text-white bg-indigo-600' : 'text-gray-300'
                      }`}
                    >
                      {copiedLinkId === link.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-gray-300 mb-2 text-sm">Change Expiration</label>
                    <div className="flex space-x-2">
                      <select 
                        className="bg-gray-600 text-white border border-gray-500 rounded-md p-2 text-sm flex-grow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === 'never') {
                            handleUpdateExpiration(link.id, null);
                          } else {
                            handleUpdateExpiration(link.id, parseInt(value, 10));
                          }
                        }}
                        value={link.expires_at ? 
                          (new Date(link.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) < 1 
                            ? '1' 
                            : Math.ceil((new Date(link.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)).toString()
                          : 'never'
                        }
                      >
                        <option value="1">1 day</option>
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                        <option value="never">Never expires</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6 text-center">
              <CalendarClock className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400">No share links have been created yet</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white hover:bg-gray-600 rounded-md font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;