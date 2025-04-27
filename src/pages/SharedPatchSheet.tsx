import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Download, Bookmark, Share2, ExternalLink, Edit, AlertTriangle, Info, Calendar, Clock } from 'lucide-react';
import { getSharedResource, updateSharedResource } from '../lib/shareUtils';
import { supabase } from '../lib/supabase';
import PatchSheetExport from '../components/PatchSheetExport';
import PrintPatchSheetExport from '../components/PrintPatchSheetExport';
import ExportModal from '../components/ExportModal';
import html2canvas from 'html2canvas';

// Empty Header component for shared views
const SharedHeader = ({ docName }: { docName: string }) => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 shadow-md backdrop-blur-sm">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Bookmark className="h-8 w-8 text-indigo-400" />
        <span className="text-white text-xl font-bold">SoundDocs</span>
      </div>
      <div className="flex items-center">
        <span className="text-gray-300 mr-2 hidden sm:inline">Viewing:</span>
        <span className="text-white font-medium truncate max-w-[200px]">{docName}</span>
      </div>
    </div>
  </header>
);

const SharedPatchSheet = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patchSheet, setPatchSheet] = useState<any | null>(null);
  const [shareLink, setShareLink] = useState<any | null>(null);
  const [expiryDays, setExpiryDays] = useState<number | null>(null);
  const [downloadingSheet, setDownloadingSheet] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Refs for the exportable components
  const exportRef = useRef<HTMLDivElement>(null);
  const printExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSharedPatchSheet = async () => {
      if (!shareCode) {
        setError('Invalid share code');
        setLoading(false);
        return;
      }
      
      try {
        const { resource, shareLink } = await getSharedResource(shareCode);
        setPatchSheet(resource);
        setShareLink(shareLink);
        
        // Calculate days until expiry if applicable
        if (shareLink.expires_at) {
          const expiryDate = new Date(shareLink.expires_at);
          const now = new Date();
          const diffTime = expiryDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setExpiryDays(diffDays > 0 ? diffDays : 0);
        }

      } catch (error: any) {
        console.error('Error loading shared patch sheet:', error);
        setError(error.message || 'Failed to load shared patch sheet');
      } finally {
        setLoading(false);
      }
    };

    loadSharedPatchSheet();
  }, [shareCode]);

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExportImage = async () => {
    if (!patchSheet) return;
    
    try {
      setDownloadingSheet(true);
      setShowExportModal(false);
      
      // Wait for the component to render
      setTimeout(async () => {
        if (exportRef.current) {
          const canvas = await html2canvas(exportRef.current, {
            scale: 2, // Higher scale for better quality
            backgroundColor: '#111827', // Match the background color
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowHeight: document.documentElement.offsetHeight,
            windowWidth: document.documentElement.offsetWidth,
            height: exportRef.current.scrollHeight,
            width: exportRef.current.offsetWidth
          });
          
          // Convert canvas to a data URL and trigger download
          const imageURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imageURL;
          link.download = `${patchSheet.name.replace(/\s+/g, '-').toLowerCase()}-patch-sheet.png`;
          link.click();
        }
      }, 100);
    } catch (error) {
      console.error('Error downloading patch sheet:', error);
      alert('Failed to download patch sheet. Please try again.');
    } finally {
      setDownloadingSheet(false);
    }
  };

  const handleExportPdf = async () => {
    if (!patchSheet) return;
    
    try {
      setDownloadingSheet(true);
      setShowExportModal(false);
      
      // Wait for the component to render
      setTimeout(async () => {
        if (printExportRef.current) {
          const canvas = await html2canvas(printExportRef.current, {
            scale: 2, // Higher scale for better quality
            backgroundColor: '#ffffff', // White background for print
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowHeight: document.documentElement.offsetHeight,
            windowWidth: document.documentElement.offsetWidth,
            height: printExportRef.current.scrollHeight,
            width: printExportRef.current.offsetWidth
          });

          // Convert canvas to a data URL and trigger download
          const imageURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imageURL;
          link.download = `${patchSheet.name.replace(/\s+/g, '-').toLowerCase()}-patch-sheet-print.png`;
          link.click();
        }
      }, 100);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setDownloadingSheet(false);
    }
  };

  const handleEditRedirect = () => {
    // If this is an edit link, redirect to the editor
    if (shareLink?.link_type === 'edit') {
      window.location.href = `/shared/edit/${shareCode}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !patchSheet) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Error Loading Document</h1>
        <p className="text-gray-300 mb-6">{error || 'This shared document could not be loaded'}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Helmet>
        <title>{patchSheet.name} | Shared Patch Sheet - SoundDocs</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <SharedHeader docName={patchSheet.name} />
      
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        {/* Sharing Info Banner */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 mb-6 flex items-start">
          <Info className="h-5 w-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-indigo-300 text-sm">
              <span className="font-medium">Shared document:</span> You are viewing a shared patch sheet.
              {shareLink?.link_type === 'edit' && " You have edit permissions for this document."}
            </p>
            {expiryDays !== null && (
              <p className="text-indigo-300 text-sm mt-1">
                <Clock className="h-3.5 w-3.5 inline mr-1" />
                {expiryDays > 0 
                  ? `This shared link expires in ${expiryDays} day${expiryDays !== 1 ? 's' : ''}`
                  : "This shared link has expired"}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{patchSheet.name}</h1>
            <div className="flex items-center text-gray-400 text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                Last edited: {new Date(patchSheet.last_edited || patchSheet.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {shareLink?.link_type === 'edit' && (
              <button
                onClick={handleEditRedirect}
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm"
              >
                <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Edit Document</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}
            <button
              onClick={handleExportClick}
              disabled={downloadingSheet}
              className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm disabled:opacity-70"
            >
              <Download className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">Save</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">SoundDocs Home</span>
              <span className="sm:hidden">Home</span>
            </button>
          </div>
        </div>
        
        {/* Viewer with PatchSheetExport component */}
        <div className="bg-gray-850 rounded-xl shadow-xl overflow-hidden mb-8 max-w-full">
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Patch Sheet Viewer</h2>
          </div>
          <div className="p-4 overflow-auto max-h-[80vh]">
            <PatchSheetExport
              ref={exportRef}
              patchSheet={patchSheet}
            />
          </div>
        </div>
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportImage={handleExportImage}
        onExportPdf={handleExportPdf}
        title="Patch Sheet"
      />
      
      {/* Hidden Print Export Component */}
      {patchSheet && (
        <PrintPatchSheetExport
          ref={printExportRef}
          patchSheet={patchSheet}
        />
      )}
      
      {/* Sign up banner */}
      <div className="bg-indigo-600 py-6 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg font-medium text-white">Create Your Own Audio Documentation</h3>
            <p className="text-indigo-200">Sign up for free and start creating professional patch sheets and stage plots.</p>
          </div>
          <a 
            href="/"
            className="inline-flex items-center bg-white text-indigo-700 px-5 py-2 rounded-md font-medium transition-all duration-200 hover:bg-indigo-100"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Get Started for Free
          </a>
        </div>
      </div>
      
      {/* Footer with attribution */}
      <footer className="bg-gray-950 py-6 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Bookmark className="h-6 w-6 text-indigo-400 mr-2" />
            <span className="text-white font-bold">SoundDocs</span>
          </div>
          <div className="text-gray-400 text-sm text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} SoundDocs. All rights reserved.</p>
            <p className="mt-1">Professional audio documentation made simple.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SharedPatchSheet;