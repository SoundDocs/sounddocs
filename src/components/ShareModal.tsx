import React, { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Link as LinkIcon, Loader2, Share2, Trash2, Clock, AlertTriangle } from 'lucide-react';
import {
  createShareLink,
  getShareLinks,
  deleteShareLink,
  updateShareLinkExpiration,
  getShareUrl,
  SharedLink,
  ResourceType,
} from '../lib/shareUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string | null;
  resourceName: string | null;
  resourceType: ResourceType;
}

const expirationOptions = [
  { label: 'Never expires', value: null },
  { label: '1 day', value: 1 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceName,
  resourceType,
}) => {
  const [newLinkExpiration, setNewLinkExpiration] = useState<number | null>(7); // Default to 7 days
  const [existingLinks, setExistingLinks] = useState<SharedLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLinks, setIsFetchingLinks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [updatingLinkId, setUpdatingLinkId] = useState<string | null>(null);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

  const fetchExistingLinks = useCallback(async () => {
    if (!resourceId) return;
    setIsFetchingLinks(true);
    setError(null);
    try {
      const links = await getShareLinks(resourceId, resourceType);
      setExistingLinks(links.filter(link => link.link_type === 'view')); // Only show view links
    } catch (err: any) {
      console.error("Error fetching existing links:", err);
      setError(err.message || "Failed to fetch existing links.");
    } finally {
      setIsFetchingLinks(false);
    }
  }, [resourceId, resourceType]);

  useEffect(() => {
    if (isOpen && resourceId) {
      fetchExistingLinks();
    } else if (!isOpen) {
      setExistingLinks([]);
      setError(null);
      setIsLoading(false);
      setIsFetchingLinks(false);
      setCopiedLinkId(null);
      setNewLinkExpiration(7);
    }
  }, [isOpen, resourceId, fetchExistingLinks]);

  const handleCreateShareLink = async () => {
    if (!resourceId) {
      setError("Resource ID is missing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await createShareLink(resourceId, resourceType, 'view', newLinkExpiration);
      await fetchExistingLinks();
      setNewLinkExpiration(7);
    } catch (err: any) {
      console.error("Error creating share link:", err);
      setError(err.message || "Failed to create share link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (linkId: string, shareCode: string) => {
    const urlToCopy = getShareUrl(shareCode, resourceType, 'view');
    navigator.clipboard.writeText(urlToCopy).then(() => {
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }).catch(err => {
      console.error("Failed to copy link:", err);
      setError("Failed to copy link to clipboard.");
    });
  };

  const handleDeleteExistingLink = async (linkId: string) => {
    setDeletingLinkId(linkId);
    setError(null);
    try {
      await deleteShareLink(linkId);
      await fetchExistingLinks();
    } catch (err: any) {
      console.error("Error deleting share link:", err);
      setError(err.message || "Failed to delete share link.");
    } finally {
      setDeletingLinkId(null);
    }
  };

  const handleUpdateExistingLinkExpiration = async (linkId: string, expiration: number | null) => {
    setUpdatingLinkId(linkId);
    setError(null);
    try {
      await updateShareLinkExpiration(linkId, expiration);
      await fetchExistingLinks();
    } catch (err: any) {
      console.error("Error updating share link expiration:", err);
      setError(err.message || "Failed to update share link expiration.");
    } finally {
      setUpdatingLinkId(null);
    }
  };

  const getExpirationStatus = (expiresAt: string | null): { text: string; color: string } => {
    if (!expiresAt) return { text: 'Never expires', color: 'text-green-400' };
    const expirationDate = new Date(expiresAt);
    if (expirationDate < new Date()) return { text: 'Expired', color: 'text-red-400' };
    const daysLeft = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return { text: `Expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`, color: daysLeft <= 3 ? 'text-yellow-400' : 'text-slate-300' };
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-xl shadow-2xl text-white max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between mb-6"> {/* Increased mb */}
          <div className="flex items-center space-x-3">
            <Share2 size={28} className="text-indigo-400" />
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Share "{resourceName || 'Resource'}"</h2> {/* Adjusted size/weight */}
              <p className="text-sm text-slate-400">
                Create links to share "{resourceName || 'this resource'}" with others.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 p-3 rounded-md text-sm mb-4 flex items-center"> {/* Adjusted error style */}
            <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
            <p className="break-words">Error: {error}</p>
          </div>
        )}

        {/* Create New Share Link Section */}
        <div className="bg-slate-700 p-4 rounded-lg mb-6">
          <h3 className="text-md font-semibold mb-3 text-slate-100">Create New Share Link</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
            <div>
              <label htmlFor="linkTypeDisplay" className="block text-xs font-medium text-slate-300 mb-1">Link Type</label>
              <div 
                id="linkTypeDisplay"
                className="w-full px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium text-center"
              >
                View Only
              </div>
            </div>
            <div>
              <label htmlFor="expiration" className="block text-xs font-medium text-slate-300 mb-1">Expiration</label>
              <select
                id="expiration"
                value={newLinkExpiration === null ? 'null' : newLinkExpiration.toString()}
                onChange={(e) => setNewLinkExpiration(e.target.value === 'null' ? null : parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {expirationOptions.map(opt => (
                  <option key={opt.label} value={opt.value === null ? 'null' : opt.value.toString()}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleCreateShareLink}
            disabled={isLoading || !resourceId}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <LinkIcon size={18} className="mr-2" />
            )}
            Create Share Link
          </button>
        </div>

        {/* Existing Share Links Section */}
        <div className="flex-grow overflow-y-auto pr-1 -mr-2 space-y-3 custom-scrollbar"> {/* Added custom-scrollbar if defined globally */}
          <h3 className="text-md font-semibold text-slate-100 mb-2 sticky top-0 bg-slate-800 py-2 z-10">Existing Share Links</h3>
          {isFetchingLinks && (
            <div className="flex items-center justify-center py-6 text-slate-400">
              <Loader2 size={24} className="animate-spin mr-2" />
              <span>Loading links...</span>
            </div>
          )}
          {!isFetchingLinks && existingLinks.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">No view-only share links created yet.</p>
          )}
          {!isFetchingLinks && existingLinks.map((link) => {
            const expirationStatus = getExpirationStatus(link.expires_at);
            const fullShareUrl = getShareUrl(link.share_code, resourceType, 'view');
            return (
              <div key={link.id} className="bg-slate-700 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-600 p-1.5 rounded-md flex-shrink-0">
                      <LinkIcon size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-100 text-sm">View-only Link</h4>
                      <div className="flex items-center text-xs mt-0.5">
                        <Clock size={12} className={`mr-1.5 ${expirationStatus.color}`} />
                        <span className={expirationStatus.color}>{expirationStatus.text}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {deletingLinkId === link.id ? (
                       <Loader2 size={18} className="animate-spin text-red-400" />
                    ) : (
                      <button
                        onClick={() => handleDeleteExistingLink(link.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-md transition-colors"
                        aria-label="Delete link"
                        disabled={deletingLinkId === link.id}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-900/70 p-2 rounded-md mb-3">
                  <input
                    type="text"
                    value={fullShareUrl}
                    readOnly
                    className="flex-grow bg-transparent text-slate-300 focus:outline-none text-sm truncate"
                    aria-label="Generated share link"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => handleCopyToClipboard(link.id, link.share_code)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center
                      ${copiedLinkId === link.id
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                    }`}
                    aria-label={copiedLinkId === link.id ? 'Copied link' : 'Copy link'}
                  >
                    {copiedLinkId === link.id ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                    {copiedLinkId === link.id ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-xs pt-3 border-t border-slate-600/70">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Created</span>
                    <span className="text-slate-200 font-medium">{formatDate(link.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Last Used</span>
                    <span className="text-slate-200 font-medium">{formatDate(link.last_accessed)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Uses</span>
                    <span className="text-slate-200 font-medium">{link.access_count}</span>
                  </div>
                  <div className="relative">
                    <label htmlFor={`exp-${link.id}`} className="text-slate-400 block mb-0.5">Change Expiration</label>
                    {updatingLinkId === link.id && <Loader2 size={14} className="animate-spin text-indigo-400 absolute right-1 top-1/2 -translate-y-1/2 mt-2.5" />}
                    <select
                      id={`exp-${link.id}`}
                      // Attempt to find a matching expiration option, default to current if not exact
                      value={
                        link.expires_at
                          ? expirationOptions.find(opt => {
                              if (opt.value === null && !link.expires_at) return true;
                              if (opt.value === null) return false;
                              const linkExpDate = new Date(link.expires_at!);
                              const optionExpDate = new Date(Date.now() + opt.value * 24 * 60 * 60 * 1000);
                              // Compare dates (ignoring time for simplicity here, or be more precise if needed)
                              return linkExpDate.toDateString() === optionExpDate.toDateString();
                            })?.value?.toString() ?? (link.expires_at ? 'custom' : 'null') // 'custom' if not in options
                          : 'null'
                      }
                      onChange={(e) => handleUpdateExistingLinkExpiration(link.id, e.target.value === 'null' ? null : parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded-md text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                      disabled={updatingLinkId === link.id}
                      style={{paddingRight: '1.75rem'}}
                    >
                       {/* Add a "Custom" option if the current expiration doesn't match predefined ones */}
                      {link.expires_at && !expirationOptions.some(opt => {
                        if (opt.value === null) return !link.expires_at;
                        const linkExpDate = new Date(link.expires_at!);
                        const optionExpDate = new Date(Date.now() + opt.value * 24 * 60 * 60 * 1000);
                        return linkExpDate.toDateString() === optionExpDate.toDateString();
                      }) && (
                        <option value="custom" disabled>
                          {`Expires ${formatDate(link.expires_at)}`}
                        </option>
                      )}
                      {expirationOptions.map(opt => (
                        <option key={`opt-${link.id}-${opt.label}`} value={opt.value === null ? 'null' : opt.value.toString()}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-6 border-t border-slate-700 text-right"> {/* mt-auto to push to bottom */}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md font-medium transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
