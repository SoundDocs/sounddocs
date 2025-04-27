import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';
import { PlusCircle, FileText, Layout, Info, Trash2, Edit, Download, List } from 'lucide-react';
import html2canvas from 'html2canvas';
import PatchSheetExport from './PatchSheetExport';
import StagePlotExport from './StagePlotExport';
import PrintPatchSheetExport from './PrintPatchSheetExport';
import PrintStagePlotExport from './PrintStagePlotExport';
import ExportModal from './ExportModal';

// Define types for our documents
interface PatchList {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  [key: string]: any; // Allow any additional properties
}

interface StagePlot {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  stage_size?: string;
  elements?: any[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [patchLists, setPatchLists] = useState<PatchList[]>([]);
  const [stagePlots, setStagePlots] = useState<StagePlot[]>([]);
  const [showNewPatchModal, setShowNewPatchModal] = useState(false);
  const [showNewPlotModal, setShowNewPlotModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [recentDocuments, setRecentDocuments] = useState<PatchList[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentExportPatchSheet, setCurrentExportPatchSheet] = useState<PatchList | null>(null);
  const [currentExportStagePlot, setCurrentExportStagePlot] = useState<StagePlot | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPatchSheetId, setExportPatchSheetId] = useState<string | null>(null);
  const [showStagePlotExportModal, setShowStagePlotExportModal] = useState(false);
  const [exportStagePlotId, setExportStagePlotId] = useState<string | null>(null);
  
  // Refs for the exportable components
  const patchSheetExportRef = useRef<HTMLDivElement>(null);
  const printPatchSheetExportRef = useRef<HTMLDivElement>(null);
  const stagePlotExportRef = useRef<HTMLDivElement>(null);
  const printStagePlotExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setUser(data.user);
          
          // Fetch patch lists for the user
          fetchPatchLists(data.user.id);
          fetchRecentDocuments(data.user.id);
          fetchStagePlots(data.user.id);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const fetchPatchLists = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('patch_sheets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setPatchLists(data);
      }
    } catch (error) {
      console.error('Error fetching patch lists:', error);
    }
  };

  const fetchStagePlots = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('stage_plots')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setStagePlots(data);
      }
    } catch (error) {
      console.error('Error fetching stage plots:', error);
    }
  };

  const fetchRecentDocuments = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('patch_sheets')
        .select('*')
        .eq('user_id', userId)
        .order('last_edited', { ascending: false })
        .limit(2); // Limit to only 2 recent documents

      if (error) throw error;
      
      if (data) {
        setRecentDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching recent documents:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCreatePatchList = () => {
    if (newDocName.trim()) {
      navigate('/patch-sheet/new');
      setShowNewPatchModal(false);
      setNewDocName('');
    }
  };

  const handleCreateStagePlot = async () => {
    if (newDocName.trim()) {
      setShowNewPlotModal(false);
      
      try {
        // Create a new stage plot in the database
        const { data, error } = await supabase
          .from('stage_plots')
          .insert([
            { 
              name: newDocName,
              user_id: user.id,
              stage_size: 'medium-wide',
              elements: [],
              created_at: new Date().toISOString(),
              last_edited: new Date().toISOString()
            }
          ])
          .select();

        if (error) throw error;
        
        if (data && data[0]) {
          // Navigate to the stage plot editor with the new ID
          navigate(`/stage-plot/${data[0].id}`);
        }
      } catch (error) {
        console.error('Error creating stage plot:', error);
        alert('Failed to create stage plot. Please try again.');
      }
      
      setNewDocName('');
    }
  };

  const handleDeletePatchList = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patch_sheets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update the local state
      setPatchLists(patchLists.filter(item => item.id !== id));
      setRecentDocuments(recentDocuments.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting patch list:', error);
      alert('Failed to delete patch list. Please try again.');
    }
  };

  const handleDeleteStagePlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stage_plots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update the local state
      setStagePlots(stagePlots.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting stage plot:', error);
      alert('Failed to delete stage plot. Please try again.');
    }
  };

  const handleEditPatchList = (id: string) => {
    navigate(`/patch-sheet/${id}`);
  };
  
  const handleEditStagePlot = (id: string) => {
    navigate(`/stage-plot/${id}`);
  };
  
  const handleExportPatchListClick = (patchSheet: PatchList) => {
    setExportPatchSheetId(patchSheet.id);
    setShowExportModal(true);
  };
  
  const handleExportStageplotClick = (stagePlot: StagePlot) => {
    setExportStagePlotId(stagePlot.id);
    setShowStagePlotExportModal(true);
  };
  
  const handleExportDownload = async (patchSheetId: string) => {
    try {
      setDownloadingId(patchSheetId);
      
      // Close the export modal
      setShowExportModal(false);
      
      // Fetch complete patch sheet data if needed
      let fullPatchSheet: PatchList | null = patchLists.find(p => p.id === patchSheetId) || null;
      
      if (!fullPatchSheet || !fullPatchSheet.inputs || !fullPatchSheet.outputs || !fullPatchSheet.info) {
        const { data, error } = await supabase
          .from('patch_sheets')
          .select('*')
          .eq('id', patchSheetId)
          .single();
          
        if (error) throw error;
        fullPatchSheet = data;
      }
      
      // Set the current patch sheet to be exported
      setCurrentExportPatchSheet(fullPatchSheet);
      
      // Wait for the component to render
      setTimeout(async () => {
        if (patchSheetExportRef.current) {
          const canvas = await html2canvas(patchSheetExportRef.current, {
            scale: 2, // Higher scale for better quality
            backgroundColor: '#111827', // Match the background color
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowHeight: document.documentElement.offsetHeight,
            windowWidth: document.documentElement.offsetWidth,
            height: patchSheetExportRef.current.scrollHeight,
            width: patchSheetExportRef.current.offsetWidth
          });
          
          // Convert canvas to a data URL and trigger download
          const imageURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imageURL;
          link.download = `${fullPatchSheet!.name.replace(/\s+/g, '-').toLowerCase()}-patch-sheet.png`;
          link.click();
          
          // Clean up
          setCurrentExportPatchSheet(null);
          setDownloadingId(null);
          setExportPatchSheetId(null);
        }
      }, 100);
    } catch (error) {
      console.error('Error downloading patch sheet:', error);
      alert('Failed to download patch sheet. Please try again.');
      setDownloadingId(null);
      setExportPatchSheetId(null);
    }
  };

  const handlePrintExport = async (patchSheetId: string) => {
    try {
      setDownloadingId(patchSheetId);
      
      // Close the export modal
      setShowExportModal(false);
      
      // Fetch complete patch sheet data if needed
      let fullPatchSheet: PatchList | null = patchLists.find(p => p.id === patchSheetId) || null;
      
      if (!fullPatchSheet || !fullPatchSheet.inputs || !fullPatchSheet.outputs || !fullPatchSheet.info) {
        const { data, error } = await supabase
          .from('patch_sheets')
          .select('*')
          .eq('id', patchSheetId)
          .single();
          
        if (error) throw error;
        fullPatchSheet = data;
      }
      
      // Set the current patch sheet to be exported
      setCurrentExportPatchSheet(fullPatchSheet);
      
      // Wait for the component to render
      setTimeout(async () => {
        if (printPatchSheetExportRef.current) {
          const canvas = await html2canvas(printPatchSheetExportRef.current, {
            scale: 2, // Higher scale for better quality
            backgroundColor: '#ffffff', // White background
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowHeight: document.documentElement.offsetHeight,
            windowWidth: document.documentElement.offsetWidth,
            height: printPatchSheetExportRef.current.scrollHeight,
            width: printPatchSheetExportRef.current.offsetWidth
          });
          
          // Convert canvas to a data URL and trigger download
          const imageURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imageURL;
          link.download = `${fullPatchSheet!.name.replace(/\s+/g, '-').toLowerCase()}-patch-sheet-print.png`;
          link.click();
          
          // Clean up
          setCurrentExportPatchSheet(null);
          setDownloadingId(null);
          setExportPatchSheetId(null);
        }
      }, 100);
    } catch (error) {
      console.error('Error exporting print-friendly patch sheet:', error);
      alert('Failed to export patch sheet. Please try again.');
      setDownloadingId(null);
      setExportPatchSheetId(null);
    }
  };
  
  const handleExportStagePlotImage = async (stagePlotId: string) => {
    try {
      setDownloadingId(stagePlotId);
      
      // Close the export modal
      setShowStagePlotExportModal(false);
      
      // Fetch complete stage plot data if needed
      let fullStagePlot = stagePlots.find(p => p.id === stagePlotId);
      if (!fullStagePlot || !fullStagePlot.elements) {
        const { data, error } = await supabase
          .from('stage_plots')
          .select('*')
          .eq('id', stagePlotId)
          .single();
          
        if (error) throw error;
        fullStagePlot = data;
      }
      
      // Set the current stage plot to be exported
      setCurrentExportStagePlot(fullStagePlot);
      
      // Wait for the component to render
      setTimeout(async () => {
        if (stagePlotExportRef.current) {
          const canvas = await html2canvas(stagePlotExportRef.current, {
            scale: 2, // Higher scale for better quality
            backgroundColor: '#111827', // Match the background color
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowHeight: document.documentElement.offsetHeight,
            windowWidth: document.documentElement.offsetWidth,
            height: stagePlotExportRef.current.scrollHeight,
            width: stagePlotExportRef.current.offsetWidth
          });
          
          // Convert canvas to a data URL and trigger download
          const imageURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imageURL;
          link.download = `${fullStagePlot!.name.replace(/\s+/g, '-').toLowerCase()}-stage-plot.png`;
          link.click();
          
          // Clean up
          setCurrentExportStagePlot(null);
          setDownloadingId(null);
          setExportStagePlotId(null);
        }
      }, 100);
    } catch (error) {
      console.error('Error downloading stage plot:', error);
      alert('Failed to download stage plot. Please try again.');
      setDownloadingId(null);
      setExportStagePlotId(null);
    }
  };

  const handlePrintStagePlot = async (stagePlotId: string) => {
    try {
      setDownloadingId(stagePlotId);
      
      // Close the export modal
      setShowStagePlotExportModal(false);
      
      // Fetch complete stage plot data if needed
      let fullStagePlot = stagePlots.find(p => p.id === stagePlotId);
      if (!fullStagePlot || !fullStagePlot.elements) {
        const { data, error } = await supabase
          .from('stage_plots')
          .select('*')
          .eq('id', stagePlotId)
          .single();
          
        if (error) throw error;
        fullStagePlot = data;
      }
      
      // Set the current stage plot to be exported
      setCurrentExportStagePlot(fullStagePlot);
      
      // Wait for the component to render
      setTimeout(async () => {
        if (printStagePlotExportRef.current) {
          const canvas = await html2canvas(printStagePlotExportRef.current, {
            scale: 2, // Higher scale for better quality
            backgroundColor: '#ffffff', // White background
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowHeight: document.documentElement.offsetHeight,
            windowWidth: document.documentElement.offsetWidth,
            height: printStagePlotExportRef.current.scrollHeight,
            width: printStagePlotExportRef.current.offsetWidth
          });
          
          // Convert canvas to a data URL and trigger download
          const imageURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = imageURL;
          link.download = `${fullStagePlot!.name.replace(/\s+/g, '-').toLowerCase()}-stage-plot-print.png`;
          link.click();
          
          // Clean up
          setCurrentExportStagePlot(null);
          setDownloadingId(null);
          setExportStagePlotId(null);
        }
      }, 100);
    } catch (error) {
      console.error('Error exporting print-friendly stage plot:', error);
      alert('Failed to export stage plot. Please try again.');
      setDownloadingId(null);
      setExportStagePlotId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} onSignOut={handleSignOut} />
      
      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to SoundDocs</h1>
          <p className="text-gray-300">
            Create and manage your professional audio documentation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">My Patch Lists</h2>
                <p className="text-gray-400">Manage your input lists and signal routing</p>
              </div>
              <FileText className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="space-y-4">
              {patchLists.length > 0 ? (
                <div className="space-y-3">
                  {/* Only show preview of first 2 patch lists */}
                  {patchLists.slice(0, 2).map(patchList => (
                    <div key={patchList.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-medium">{patchList.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {patchList.last_edited 
                            ? `Edited ${new Date(patchList.last_edited).toLocaleDateString()}`
                            : `Created ${new Date(patchList.created_at).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Download"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPatchListClick(patchList);
                          }}
                          disabled={downloadingId === patchList.id}
                        >
                          <Download className={`h-5 w-5 ${downloadingId === patchList.id ? 'animate-pulse' : ''}`} />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Edit"
                          onClick={() => handleEditPatchList(patchList.id)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-400"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePatchList(patchList.id);
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">You haven't created any patch lists yet</p>
                  <button 
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={() => navigate('/patch-sheet/new')}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Create Patch List
                  </button>
                </div>
              )}
              
              <div className="pt-3 text-center">
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-center">
                  <button 
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={() => navigate('/patch-sheet/new')}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    New Patch List
                  </button>
                  
                  <button 
                    className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={() => navigate('/all-patch-sheets')}
                  >
                    <List className="h-5 w-5 mr-2" />
                    View All {patchLists.length > 0 && `(${patchLists.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">My Stage Plots</h2>
                <p className="text-gray-400">Design and manage your stage layouts</p>
              </div>
              <Layout className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="space-y-4">
              {stagePlots.length > 0 ? (
                <div className="space-y-3">
                  {/* Only show preview of first 2 stage plots */}
                  {stagePlots.slice(0, 2).map(stagePlot => (
                    <div key={stagePlot.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-medium">{stagePlot.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {stagePlot.last_edited 
                            ? `Edited ${new Date(stagePlot.last_edited).toLocaleDateString()}`
                            : `Created ${new Date(stagePlot.created_at).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Download"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportStageplotClick(stagePlot);
                          }}
                          disabled={downloadingId === stagePlot.id}
                        >
                          <Download className={`h-5 w-5 ${downloadingId === stagePlot.id ? 'animate-pulse' : ''}`} />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Edit"
                          onClick={() => handleEditStagePlot(stagePlot.id)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-400"
                          title="Delete"
                          onClick={() => handleDeleteStagePlot(stagePlot.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">You haven't created any stage plots yet</p>
                  <button 
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={() => setShowNewPlotModal(true)}
                    data-show-new-plot-modal="true"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Create Stage Plot
                  </button>
                </div>
              )}
              
              <div className="pt-3 text-center">
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-center">
                  <button 
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={() => setShowNewPlotModal(true)}
                    data-show-new-plot-modal="true"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    New Stage Plot
                  </button>
                  
                  <button 
                    className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={() => navigate('/all-stage-plots')}
                  >
                    <List className="h-5 w-5 mr-2" />
                    View All {stagePlots.length > 0 && `(${stagePlots.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Tips</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Create a patch list to document your input sources and routing</li>
            <li>Design a stage plot to visualize your stage setup</li>
            <li>Export your documents as high-quality images for sharing</li>
            <li>Share your documents with venue staff and band members</li>
          </ul>
        </div>
      </main>

      {/* Modal for creating new patch list */}
      {showNewPatchModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Patch List</h3>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="patchName">
                Name
              </label>
              <input
                id="patchName"
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Main Stage Setup"
              />
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                className="px-4 py-2 text-gray-300 hover:text-white"
                onClick={() => {
                  setShowNewPatchModal(false);
                  setNewDocName('');
                }}
              >
                Cancel
              </button>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                onClick={handleCreatePatchList}
                disabled={!newDocName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for creating new stage plot */}
      {showNewPlotModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Stage Plot</h3>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="plotName">
                Name
              </label>
              <input
                id="plotName"
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Festival Stage Layout"
              />
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                className="px-4 py-2 text-gray-300 hover:text-white"
                onClick={() => {
                  setShowNewPlotModal(false);
                  setNewDocName('');
                }}
              >
                Cancel
              </button>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                onClick={handleCreateStagePlot}
                disabled={!newDocName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal for Patch Sheets */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportImage={() => exportPatchSheetId && handleExportDownload(exportPatchSheetId)}
        onExportPdf={() => exportPatchSheetId && handlePrintExport(exportPatchSheetId)}
        title="Patch Sheet"
      />

      {/* Export Modal for Stage Plots */}
      <ExportModal
        isOpen={showStagePlotExportModal}
        onClose={() => setShowStagePlotExportModal(false)}
        onExportImage={() => exportStagePlotId && handleExportStagePlotImage(exportStagePlotId)}
        onExportPdf={() => exportStagePlotId && handlePrintStagePlot(exportStagePlotId)}
        title="Stage Plot"
      />

      {/* Hidden Export Components */}
      {currentExportPatchSheet && (
        <>
          <PatchSheetExport
            ref={patchSheetExportRef}
            patchSheet={currentExportPatchSheet}
          />
          <PrintPatchSheetExport
            ref={printPatchSheetExportRef}
            patchSheet={currentExportPatchSheet}
          />
        </>
      )}
      
      {currentExportStagePlot && (
        <>
          <StagePlotExport
            ref={stagePlotExportRef}
            stagePlot={currentExportStagePlot}
          />
          <PrintStagePlotExport
            ref={printStagePlotExportRef}
            stagePlot={currentExportStagePlot}
          />
        </>
      )}

      <Footer />
    </div>
  );
};

export default Dashboard;