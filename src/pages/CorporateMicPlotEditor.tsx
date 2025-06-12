import React, { useState, useEffect, useCallback } from 'react';
    import { useParams, useNavigate, useLocation } from 'react-router-dom';
    import { supabase } from '../lib/supabase';
    import { v4 as uuidv4 } from 'uuid';
    import Header from '../components/Header';
    import Footer from '../components/Footer';
    import PresenterEntryCard, { PresenterEntry } from '../components/corporate-mic-plot/PresenterEntryCard';
    import { Loader, ArrowLeft, Save, PlusCircle, AlertCircle, Users, Share2 } from 'lucide-react';
    import { getSharedResource, updateSharedResource, SharedLink, ResourceType } from '../lib/shareUtils';


    interface CorporateMicPlot {
      id: string;
      user_id?: string; // Optional for shared plots not yet claimed
      name: string;
      created_at: string;
      last_edited: string;
      presenters: PresenterEntry[];
    }

    const CorporateMicPlotEditor: React.FC = () => {
      const { id: routeId, shareCode } = useParams<{ id?: string; shareCode?: string }>();
      const navigate = useNavigate();
      const location = useLocation();
      const [loading, setLoading] = useState(true);
      const [saving, setSaving] = useState(false);
      const [micPlot, setMicPlot] = useState<CorporateMicPlot | null>(null);
      const [user, setUser] = useState<any>(null); // Current authenticated user
      const [saveError, setSaveError] = useState<string | null>(null);
      const [saveSuccess, setSaveSuccess] = useState(false);
      const [isSharedEdit, setIsSharedEdit] = useState(false);
      const [sharedLinkInfo, setSharedLinkInfo] = useState<SharedLink | null>(null);


      const fetchMicPlotData = useCallback(async (currentUserId: string | null) => {
        setLoading(true);
        try {
          if (shareCode) {
            setIsSharedEdit(true);
            const { resource, shareLink } = await getSharedResource(shareCode);
            if (shareLink.resource_type !== 'corporate_mic_plot' || shareLink.link_type !== 'edit') {
              throw new Error("Invalid or unauthorized share link for editing.");
            }
            setMicPlot(resource as CorporateMicPlot);
            setSharedLinkInfo(shareLink);
          } else if (routeId === 'new' && currentUserId) {
            setMicPlot({
              id: uuidv4(),
              user_id: currentUserId,
              name: 'Untitled Corporate Mic Plot',
              created_at: new Date().toISOString(),
              last_edited: new Date().toISOString(),
              presenters: [],
            });
          } else if (routeId && currentUserId) {
            const { data, error } = await supabase
              .from('corporate_mic_plots')
              .select('*')
              .eq('id', routeId)
              .eq('user_id', currentUserId)
              .single();
            if (error) throw error;
            if (data) setMicPlot(data as CorporateMicPlot);
            else navigate('/audio', { replace: true, state: { error: 'Mic plot not found.' } });
          } else if (!currentUserId && !shareCode) {
             navigate('/login'); // Should not happen if ProtectedRoute is used correctly for non-shared routes
          }
        } catch (error: any) {
          console.error('Error fetching corporate mic plot:', error);
          setSaveError(`Failed to load mic plot: ${error.message}`);
          // Consider navigating away or showing a more persistent error UI
          navigate(shareCode ? '/' : '/audio', { replace: true, state: { error: `Failed to load mic plot: ${error.message}` } });
        } finally {
          setLoading(false);
        }
      }, [routeId, shareCode, navigate]);


      useEffect(() => {
        const initialize = async () => {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          setUser(currentUser); // Set user regardless, for UI elements or potential future use
          
          if (!currentUser && !shareCode) { // If not a shared link and no user, redirect to login
            navigate('/login');
            return;
          }
          fetchMicPlotData(currentUser?.id || null);
        };
        initialize();
      }, [fetchMicPlotData, navigate, shareCode]);


      const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (micPlot) {
          setMicPlot({ ...micPlot, name: e.target.value });
        }
      };

      const handleAddPresenter = () => {
        if (micPlot) {
          const newPresenter: PresenterEntry = {
            id: uuidv4(),
            presenter_name: '',
            session_segment: '',
            mic_type: '',
            element_channel_number: '',
            tx_pack_location: '',
            backup_element: '',
            sound_check_time: '',
            notes: '',
            presentation_type: '',
            remote_participation: false,
            photo_url: null,
          };
          setMicPlot({ ...micPlot, presenters: [...micPlot.presenters, newPresenter] });
        }
      };

      const handleUpdatePresenter = (id: string, field: keyof PresenterEntry, value: any) => {
        if (micPlot) {
          setMicPlot({
            ...micPlot,
            presenters: micPlot.presenters.map(p => (p.id === id ? { ...p, [field]: value } : p)),
          });
        }
      };

      const handleDeletePresenter = (id: string) => {
        if (micPlot) {
          setMicPlot({
            ...micPlot,
            presenters: micPlot.presenters.filter(p => p.id !== id),
          });
        }
      };

      const handleSave = async () => {
        if (!micPlot) return;

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        const dataToSave = {
          ...micPlot,
          last_edited: new Date().toISOString(),
        };
        // Remove user_id if it's a shared edit and the original user_id is not available or relevant for this update
        if (isSharedEdit && !dataToSave.user_id) {
            delete dataToSave.user_id;
        }


        try {
          if (isSharedEdit && shareCode) {
            const updatedResource = await updateSharedResource(shareCode, 'corporate_mic_plot' as ResourceType, dataToSave);
            setMicPlot(updatedResource as CorporateMicPlot);
          } else if (user) { // Regular save by authenticated user
            if (routeId === 'new') {
              const { data, error } = await supabase
                .from('corporate_mic_plots')
                .insert({ ...dataToSave, user_id: user.id })
                .select()
                .single();
              if (error) throw error;
              if (data) {
                navigate(`/corporate-mic-plot/${data.id}`, { replace: true, state: location.state });
                setMicPlot(data as CorporateMicPlot);
              }
            } else {
              const { data, error } = await supabase
                .from('corporate_mic_plots')
                .update(dataToSave)
                .eq('id', micPlot.id)
                .eq('user_id', user.id)
                .select()
                .single();
              if (error) throw error;
              if (data) {
                setMicPlot(data as CorporateMicPlot);
              }
            }
          } else {
            throw new Error("Cannot save: No user session and not a shared edit link.");
          }
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error: any) {
          console.error('Error saving corporate mic plot:', error);
          setSaveError(`Failed to save: ${error.message}`);
          setTimeout(() => setSaveError(null), 5000);
        } finally {
          setSaving(false);
        }
      };
      
      const handleBackNavigation = () => {
        if (isSharedEdit) {
          // For shared edit, maybe go to a generic shared confirmation or home
          window.location.href = `/shared/corporate-mic-plot/${shareCode}`; // Go to view mode
          return;
        }
        const fromPath = location.state?.from as string | undefined;
        if (fromPath) {
          navigate(fromPath);
        } else {
          navigate("/audio"); 
        }
      };


      if (loading || !micPlot) {
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <Loader className="h-12 w-12 text-indigo-500 animate-spin" />
          </div>
        );
      }
      
      // Determine if the current user is the owner, relevant for non-shared edits
      const isOwner = user && micPlot && micPlot.user_id === user.id;


      return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
          <Header dashboard={user && !isSharedEdit} /> {/* Show dashboard header only if user is logged in and not a shared edit */}
          
          {isSharedEdit && sharedLinkInfo && (
            <div className="bg-indigo-700 text-white py-3 px-4 text-center text-sm">
              <Share2 className="inline h-4 w-4 mr-2" />
              You are editing a shared document. Changes will be saved for all viewers with this link.
              {sharedLinkInfo.expires_at && (
                <span className="ml-2 text-indigo-200">
                  (Link expires: {new Date(sharedLinkInfo.expires_at).toLocaleDateString()})
                </span>
              )}
            </div>
          )}

          <main className="flex-grow container mx-auto px-4 py-6 md:py-12 mt-16 md:mt-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4">
              <div className="flex items-center flex-grow min-w-0">
                <button
                  onClick={handleBackNavigation}
                  className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-grow min-w-0">
                  <input
                    type="text"
                    value={micPlot.name}
                    onChange={handleNameChange}
                    className="text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                    placeholder="Enter Mic Plot Name"
                  />
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    Last edited: {new Date(micPlot.last_edited).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 fixed bottom-4 right-4 z-20 md:static md:z-auto sm:ml-auto flex-shrink-0">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg md:shadow-none"
                >
                  {saving ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {saving ? 'Saving...' : 'Save Plot'}
                </button>
              </div>
            </div>

            {saveError && (
              <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-sm">{saveError}</p>
              </div>
            )}
            {saveSuccess && (
              <div className="bg-green-400/10 border border-green-400 rounded-lg p-4 mb-4 flex items-start">
                <Save className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-green-400 text-sm">Mic plot saved successfully!</p>
              </div>
            )}

            <div className="bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <Users className="h-6 w-6 mr-3 text-indigo-400" />
                  <h2 className="text-xl font-semibold text-white">Presenters & Microphones</h2>
                </div>
                <button
                  onClick={handleAddPresenter}
                  className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Add Presenter
                </button>
              </div>

              {micPlot.presenters.length === 0 && (
                <div className="text-center py-10 bg-gray-700/50 rounded-lg">
                  <Users size={48} className="mx-auto text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-300">No Presenters Added Yet</h3>
                  <p className="text-sm text-gray-400 mb-4">Click "Add Presenter" to get started.</p>
                </div>
              )}

              {micPlot.presenters.map((entry) => (
                <PresenterEntryCard
                  key={entry.id}
                  entry={entry}
                  onUpdate={handleUpdatePresenter}
                  onDelete={handleDeletePresenter}
                  micPlotId={micPlot.id} 
                  userId={user?.id || micPlot.user_id || ''} // Pass owner's ID if available, or empty if truly anonymous shared edit
                />
              ))}
            </div>
            
            <div className="flex justify-center py-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg text-base"
              >
                {saving ? <Loader className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                {saving ? 'Saving Mic Plot...' : 'Save Mic Plot'}
              </button>
            </div>
          </main>
          <Footer />
        </div>
      );
    };

    export default CorporateMicPlotEditor;
