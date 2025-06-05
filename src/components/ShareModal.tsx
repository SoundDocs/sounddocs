import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Link as LinkIcon, Loader2 } from 'lucide-react';
import { createShareLink, getShareUrl, SharedLink, ResourceType } from '../lib/shareUtils'; // Ensure ResourceType is exported

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string | null;
  resourceName: string | null;
  resourceType: ResourceType; // Use the imported ResourceType
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceName,
  resourceType,
}) => {
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Reset state when modal is closed or resourceId changes
    if (!isOpen) {
      setGeneratedLink(null);
      setError(null);
      setIsLoading(false);
      setCopied(false);
    }
  }, [isOpen, resourceId]);

  const handleCreateShareLink = async () => {
    if (!resourceId) {
      setError("Resource ID is missing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedLink(null);
    setCopied(false);

    try {
      // For Run of Show, we are creating a 'view' link. Expiration is null (never expires).
      const linkDetails: SharedLink = await createShareLink(
        resourceId,
        resourceType,
        'view', // Always 'view' for Run of Show sharing from this modal
        null      // No expiration for now, can be made configurable later
      );
      const fullShareUrl = getShareUrl(linkDetails.share_code, resourceType, 'view');
      setGeneratedLink(fullShareUrl);
    } catch (err: any) {
      console.error("Error creating share link:", err);
      setError(err.message || "Failed to create share link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error("Failed to copy link:", err);
        setError("Failed to copy link to clipboard.");
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-xl text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Share "{resourceName || 'Resource'}"</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Create a view-only shareable link for this {resourceType.replace('_', ' ')}.
            Anyone with the link will be able to view it.
            {resourceType === 'run_of_show' && <span> Private notes will not be visible.</span>}
          </p>

          {!generatedLink && !isLoading && (
            <button
              onClick={handleCreateShareLink}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              <LinkIcon size={18} className="mr-2" />
              Create View-Only Link
            </button>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-3">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
              <span className="ml-2 text-gray-300">Generating link...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm">
              <p>Error: {error}</p>
            </div>
          )}

          {generatedLink && (
            <div className="space-y-3">
              <p className="text-sm text-green-400">Share link created successfully!</p>
              <div className="flex items-center space-x-2 bg-gray-700 p-3 rounded-md">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-grow bg-transparent text-gray-200 focus:outline-none text-sm"
                  aria-label="Generated share link"
                />
                <button
                  onClick={handleCopyToClipboard}
                  className={`p-2 rounded-md transition-colors ${
                    copied
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  aria-label={copied ? 'Copied' : 'Copy link'}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
               <p className="text-xs text-gray-400">This link does not expire. Manage shared links in settings (feature coming soon).</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-md font-medium transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
