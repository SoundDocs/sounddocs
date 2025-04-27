import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Download, Bookmark, Share2, ExternalLink, Edit, AlertTriangle, Info, Calendar, Clock } from 'lucide-react';
import { getSharedResource, updateSharedResource } from '../lib/shareUtils';
import { supabase } from '../lib/supabase';
import StageElementStatic from '../components/stage-plot/StageElementStatic';
import StagePlotExport from '../components/StagePlotExport';
import PrintStagePlotExport from '../components/PrintStagePlotExport';
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

const SharedStagePlot = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stagePlot, setStagePlot] = useState<any | null>(null);
  const [shareLink, setShareLink] = useState<any | null>(null);
  const [expiryDays, setExpiryDays] = useState<number | null>(null);
  const [downloadingPlot, setDownloadingPlot] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Refs for the exportable components
  const exportRef = useRef<HTMLDivElement>(null);
  const printExportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSharedStagePlot = async () => {
      if (!shareCode) {
        setError('Invalid share code');
        setLoading(false);
        return;
      }
      
      try {
        const { resource, shareLink } = await getSharedResource(shareCode);
        setStagePlot(resource);
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
        console.error('Error loading shared stage plot:', error);
        setError(error.message || 'Failed to load shared stage plot');
      } finally {
        setLoading(false);
      }
    };

    loadSharedStagePlot();
  }, [shareCode]);

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExportImage = async () => {
    if (!stagePlot) return;
    
    try {
      setDownloadingPlot(true);
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
          link.download = `${stagePlot.name.replace(/\s+/g, '-').toLowerCase()}-stage-plot.png`;
          link.click();
        }
      }, 100);
    } catch (error) {
      console.error('Error downloading stage plot:', error);
      alert('Failed to download stage plot. Please try again.');
    } finally {
      setDownloadingPlot(false);
    }
  };

  const handleExportPdf = async () => {
    if (!stagePlot) return;
    
    try {
      setDownloadingPlot(true);
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
          link.download = `${stagePlot.name.replace(/\s+/g, '-').toLowerCase()}-stage-plot-print.png`;
          link.click();
        }
      }, 100);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setDownloadingPlot(false);
    }
  };

  const handleEditRedirect = () => {
    // If this is an edit link, redirect to the editor
    if (shareLink?.link_type === 'edit') {
      window.location.href = `/shared/stage-plot/edit/${shareCode}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !stagePlot) {
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

  // Safely get stage size
  const stageSize = stagePlot.stage_size && stagePlot.stage_size.includes('-')
    ? stagePlot.stage_size
    : `${stagePlot.stage_size || 'medium'}-wide`;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Helmet>
        <title>{stagePlot.name} | Shared Stage Plot - SoundDocs</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <SharedHeader docName={stagePlot.name} />
      
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        {/* Sharing Info Banner */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 mb-6 flex items-start">
          <Info className="h-5 w-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-indigo-300 text-sm">
              <span className="font-medium">Shared document:</span> You are viewing a shared stage plot.
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
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{stagePlot.name}</h1>
            <div className="flex items-center text-gray-400 text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                Last edited: {new Date(stagePlot.last_edited || stagePlot.created_at).toLocaleDateString()}
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
              disabled={downloadingPlot}
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
        
        {/* Stage plot container */}
        <div className="bg-gray-850 rounded-xl shadow-xl overflow-hidden mb-8 max-w-full">
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Stage Plot Viewer</h2>
          </div>
          <div className="p-4 overflow-auto max-h-[80vh]" ref={canvasRef}>
            <div className="flex justify-center flex-col items-center">
              {/* Back of stage label - OUTSIDE THE STAGE */}
              <div className="mb-2">
                <div className="bg-gray-800/80 text-white text-sm px-4 py-1.5 rounded-full shadow-md">
                  Back of Stage
                </div>
              </div>
              
              <div 
                className="relative bg-grid-pattern overflow-hidden"
                style={{
                  // Use same dimensions as the actual editor
                  width: getStageDimensions(stageSize).width,
                  height: getStageDimensions(stageSize).height,
                  backgroundSize: '20px 20px',
                  backgroundColor: '#1a202c',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  borderRadius: '4px',
                  border: '1px solid rgba(75, 85, 99, 0.5)'
                }}
              >
                {/* Background image if present */}
                {stagePlot.backgroundImage && (
                  <div 
                    className="absolute inset-0 bg-center bg-no-repeat bg-contain pointer-events-none"
                    style={{ 
                      backgroundImage: `url(${stagePlot.backgroundImage})`,
                      opacity: (stagePlot.backgroundOpacity !== undefined ? stagePlot.backgroundOpacity : 50) / 100,
                      zIndex: 1
                    }}
                  />
                )}
                
                {/* Stage elements */}
                {stagePlot.elements && stagePlot.elements.map((element: any) => (
                  <StageElementStatic
                    key={element.id}
                    id={element.id}
                    type={element.type}
                    label={element.label}
                    x={element.x}
                    y={element.y}
                    rotation={element.rotation}
                    color={element.color}
                    width={element.width}
                    height={element.height}
                  />
                ))}
              </div>
              
              {/* Front of stage label - OUTSIDE THE STAGE */}
              <div className="mt-2">
                <div className="bg-gray-800/80 text-white text-sm px-4 py-1.5 rounded-full shadow-md">
                  Front of Stage / Audience
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Stage Plot Summary</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Stage details */}
            <div>
              <h4 className="text-md font-medium text-indigo-400 mb-2">Stage Information</h4>
              <div className="bg-gray-750 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Stage Size</p>
                    <p className="text-white">
                      {stageSize.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Elements</p>
                    <p className="text-white">{stagePlot.elements ? stagePlot.elements.length : 0}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Element summary */}
            <div>
              <h4 className="text-md font-medium text-indigo-400 mb-2">Element Breakdown</h4>
              <div className="bg-gray-750 rounded-lg p-4">
                {stagePlot.elements && stagePlot.elements.length > 0 ? (
                  <div className="space-y-2">
                    {summarizeElements(stagePlot.elements).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-300">{item.label}</span>
                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md text-xs">{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No elements in this stage plot</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Export components */}
        <div className="hidden">
          <StagePlotExport 
            ref={exportRef} 
            stagePlot={stagePlot} 
          />
          <PrintStagePlotExport
            ref={printExportRef}
            stagePlot={stagePlot}
          />
        </div>
      </main>
      
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportImage={handleExportImage}
        onExportPdf={handleExportPdf}
        title="Stage Plot"
      />
      
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

// Helper function to summarize elements by type
const summarizeElements = (elements: any[]) => {
  const counts: Record<string, number> = {};
  const elementLabels: Record<string, string> = {
    'microphone': 'Microphones',
    'power-strip': 'Power Strips',
    'electric-guitar': 'Electric Guitars',
    'acoustic-guitar': 'Acoustic Guitars',
    'bass-guitar': 'Bass Guitars',
    'keyboard': 'Keyboards',
    'drums': 'Drum Kits',
    'percussion': 'Percussion',
    'violin': 'Violins',
    'cello': 'Cellos',
    'trumpet': 'Brass',
    'saxophone': 'Wind Instruments',
    'amplifier': 'Amplifiers',
    'monitor-wedge': 'Monitor Wedges',
    'speaker': 'Speakers',
    'di-box': 'DI Boxes',
    'iem': 'IEMs',
    'person': 'People',
    'text': 'Text Labels',
    'generic-instrument': 'Other Instruments'
  };
  
  // Count elements by type
  elements.forEach(element => {
    if (element.type) {
      if (counts[element.type]) {
        counts[element.type]++;
      } else {
        counts[element.type] = 1;
      }
    }
  });
  
  // Convert to array for rendering
  return Object.entries(counts)
    .filter(([type]) => type) // Filter out any undefined types
    .map(([type, count]) => ({
      type,
      label: elementLabels[type as keyof typeof elementLabels] || type,
      count
    }))
    .sort((a, b) => b.count - a.count);
};

// Helper function to get stage dimensions
const getStageDimensions = (stageSize: string) => {
  // Using fixed pixel values for consistency
  switch (stageSize) {
    case 'x-small-narrow':
      return { width: 300, height: 300 };
    case 'x-small-wide':
      return { width: 500, height: 300 };
    case 'small-narrow':
      return { width: 400, height: 400 };
    case 'small-wide':
      return { width: 600, height: 400 };
    case 'medium-narrow':
      return { width: 500, height: 500 };
    case 'medium-wide':
      return { width: 800, height: 500 };
    case 'large-narrow':
      return { width: 600, height: 600 };
    case 'large-wide':
      return { width: 1000, height: 600 };
    case 'x-large-narrow':
      return { width: 700, height: 700 };
    case 'x-large-wide':
      return { width: 1200, height: 700 };
    default:
      return { width: 800, height: 500 };
  }
};

export default SharedStagePlot;