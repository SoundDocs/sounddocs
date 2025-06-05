import React, { useState, FormEvent, useEffect, useCallback } from "react";
import Header from "../components/Header";
import { Users, ArrowLeft, Link as LinkIconLucide, AlertCircle, CheckCircle, Loader2, FileText, Edit3, Eye, Trash2, ExternalLink, CalendarDays, Info } from "lucide-react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { verifyShareLink, addClaimedShare, SharedLink, getClaimedDocuments, ClaimedDocumentInfo, ResourceType, getShareUrl, deleteShareLink } from "../lib/shareUtils";
import { supabase } from "../lib/supabase";


const SharedWithMePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shareInput, setShareInput] = useState("");
  const [isClaimingLoading, setIsClaimingLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [claimMessageType, setClaimMessageType] = useState<"success" | "error" | null>(null);

  const [claimedDocuments, setClaimedDocuments] = useState<ClaimedDocumentInfo[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [fetchDocumentsError, setFetchDocumentsError] = useState<string | null>(null);

  const fetchUserClaimedDocuments = useCallback(async () => {
    if (!user) {
      setClaimedDocuments([]); 
      setIsLoadingDocuments(false);
      return;
    }
    setIsLoadingDocuments(true);
    setFetchDocumentsError(null);
    try {
      console.log(`[SharedWithMePage] Fetching documents for user: ${user.id}`); 
      const docs = await getClaimedDocuments();
      console.log("[SharedWithMePage] Fetched docs data:", JSON.stringify(docs, null, 2)); 
      setClaimedDocuments(docs);
      console.log("[SharedWithMePage] Claimed documents state updated."); 
    } catch (error: any) {
      console.error("[SharedWithMePage] Error fetching claimed documents:", error);
      setFetchDocumentsError(error.message || "Failed to load shared documents.");
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [user]); 

  useEffect(() => {
    fetchUserClaimedDocuments();
  }, [fetchUserClaimedDocuments]);

  const extractShareCode = (input: string): string | null => {
    if (!input || typeof input !== 'string') return null;
    const trimmedInput = input.trim();
    if (trimmedInput.includes('/')) {
      const parts = trimmedInput.split('/');
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i]) {
          if (/^[a-zA-Z0-9_-]{10,32}$/.test(parts[i])) { 
             return parts[i];
          }
        }
      }
      return null; 
    } else if (trimmedInput.length > 0 && /^[a-zA-Z0-9_-]{10,32}$/.test(trimmedInput)) {
      return trimmedInput;
    }
    return null;
  };

  const handleClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setClaimMessage("You must be logged in to claim a document.");
      setClaimMessageType("error");
      return;
    }

    setIsClaimingLoading(true);
    setClaimMessage(null);
    setClaimMessageType(null);

    const code = extractShareCode(shareInput);

    if (!code) {
      setClaimMessage("Invalid share code or URL format. Please enter a valid share code or the full share URL.");
      setClaimMessageType("error");
      setIsClaimingLoading(false);
      return;
    }

    try {
      const verifiedLink: SharedLink = await verifyShareLink(code);
      if (!verifiedLink || !verifiedLink.id) {
        setClaimMessage("Invalid or expired share code. Could not verify the link.");
        setClaimMessageType("error");
        setIsClaimingLoading(false);
        return;
      }
      
      console.log(`[SharedWithMePage] Attempting to claim document. User ID: ${user.id}, Shared Link ID: ${verifiedLink.id}`);
      await addClaimedShare(user.id, verifiedLink.id);
      
      setClaimMessage(`Successfully claimed document (type: ${verifiedLink.resource_type})!`);
      setClaimMessageType("success");
      setShareInput(""); 
      await fetchUserClaimedDocuments(); 
    } catch (error: any) {
      console.error("[SharedWithMePage] Claiming error:", error);
      setClaimMessage(error.message || "An unexpected error occurred while trying to claim the document.");
      setClaimMessageType("error");
    } finally {
      setIsClaimingLoading(false);
    }
  };

  const handleRemoveClaimedDocument = async (claimedShareId: string) => {
    if (!user) return;
    
    const originalDocuments = [...claimedDocuments];
    setClaimedDocuments(prevDocs => prevDocs.filter(doc => doc.claimed_share_id !== claimedShareId));

    try {
      const { error } = await supabase
        .from('user_claimed_shares')
        .delete()
        .match({ id: claimedShareId, user_id: user.id });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("[SharedWithMePage] Error removing claimed document:", error);
      setFetchDocumentsError(`Failed to remove document: ${error.message}. Please refresh.`);
      setClaimedDocuments(originalDocuments); 
    }
  };

  const formatResourceType = (type: ResourceType): string => {
    switch (type) {
      case "patch_sheet": return "Patch Sheet";
      case "stage_plot": return "Stage Plot";
      case "production_schedule": return "Production Schedule";
      case "run_of_show": return "Run of Show";
      default: 
        const fallback = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return fallback || "Document";
    }
  };

  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case "patch_sheet": return <FileText size={20} className="text-blue-400" />;
      case "stage_plot": return <FileText size={20} className="text-green-400" />;
      case "production_schedule": return <CalendarDays size={20} className="text-yellow-400" />;
      case "run_of_show": return <FileText size={20} className="text-purple-400" />;
      default: return <FileText size={20} className="text-gray-400" />;
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header dashboard={true} />
      <main className="pt-24 md:pt-28 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div className="flex items-center mb-4 sm:mb-0">
              <Users size={36} className="mr-4 text-indigo-400" />
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Shared With Me</h1>
            </div>
            <RouterLink
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors duration-200"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Dashboard
            </RouterLink>
          </div>

          {/* Claim Share Form */}
          <div className="bg-gray-800 shadow-2xl rounded-xl p-6 sm:p-8 mb-10">
            <h2 className="text-2xl font-semibold text-gray-100 mb-6 flex items-center">
              <LinkIconLucide size={24} className="mr-3 text-indigo-400" />
              Claim a Shared Document
            </h2>
            <form onSubmit={handleClaimSubmit} className="space-y-6">
              <div>
                <label htmlFor="shareCodeOrUrl" className="block text-sm font-medium text-gray-300 mb-1">
                  Enter Share Code or Full URL
                </label>
                <input
                  type="text"
                  name="shareCodeOrUrl"
                  id="shareCodeOrUrl"
                  value={shareInput}
                  onChange={(e) => setShareInput(e.target.value)}
                  className="block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-3 px-4 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., abcdef123456 or https://app.sounddocs.com/shared/..."
                  disabled={isClaimingLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isClaimingLoading}
                className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
              >
                {isClaimingLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Claiming...
                  </>
                ) : (
                  "Claim Document"
                )}
              </button>
            </form>
            {claimMessage && (
              <div className={`mt-6 p-4 rounded-md ${claimMessageType === 'success' ? 'bg-green-700/50 border border-green-500' : 'bg-red-700/50 border border-red-500'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {claimMessageType === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${claimMessageType === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                      {claimMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Displaying claimed documents */}
          <div className="bg-gray-800 shadow-2xl rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Your Claimed Documents</h2>
            {isLoadingDocuments && (
              <div className="flex justify-center items-center py-10">
                <Loader2 size={32} className="animate-spin text-indigo-400" />
                <p className="ml-3 text-gray-300">Loading your documents...</p>
              </div>
            )}
            {!isLoadingDocuments && fetchDocumentsError && (
              <div className="bg-red-700/30 border border-red-500 text-red-300 p-4 rounded-md text-sm flex items-center">
                <AlertCircle size={20} className="mr-3 flex-shrink-0" />
                <p>{fetchDocumentsError}</p>
              </div>
            )}
            {!isLoadingDocuments && !fetchDocumentsError && claimedDocuments.length === 0 && (
              <div className="text-center py-10">
                 <Info size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400 text-lg">No documents shared with you yet.</p>
                <p className="text-gray-500 text-sm mt-2">Use the form above to claim documents shared via a link or code.</p>
              </div>
            )}
            {!isLoadingDocuments && !fetchDocumentsError && claimedDocuments.length > 0 && (
              <ul className="space-y-4">
                {claimedDocuments.map((doc) => (
                  <li key={doc.claimed_share_id} className="bg-gray-700/50 p-4 rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-150">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="flex items-center mb-3 sm:mb-0">
                        <span className="mr-3 p-2 bg-gray-600 rounded-md">{getResourceTypeIcon(doc.resource_type)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-indigo-300 hover:text-indigo-200">
                            <a 
                              href={getShareUrl(doc.share_code, doc.resource_type, doc.link_type)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              {doc.resource_name || "Untitled Document"}
                              <ExternalLink size={14} className="ml-2 opacity-70" />
                            </a>
                          </h3>
                          <p className="text-xs text-gray-400">
                            Type: {formatResourceType(doc.resource_type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-2 sm:mt-0 self-start sm:self-center">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          doc.link_type === 'edit' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' 
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                        }`}>
                          {doc.link_type === 'edit' ? <Edit3 size={12} className="inline mr-1" /> : <Eye size={12} className="inline mr-1" />}
                          {doc.link_type === 'edit' ? 'Editable' : 'View Only'}
                        </span>
                        <button
                          onClick={() => handleRemoveClaimedDocument(doc.claimed_share_id)}
                          title="Remove from my list"
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-md transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-600/50 text-xs text-gray-500 flex justify-between items-center">
                      <span>Claimed: {new Date(doc.claimed_at).toLocaleDateString()}</span>
                      {doc.original_owner_id && <span className="italic">Shared by: ...{doc.original_owner_id.slice(-6)}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SharedWithMePage;
