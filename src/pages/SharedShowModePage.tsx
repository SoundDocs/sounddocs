import React, { useState, useEffect, useCallback } from 'react';
    import { useParams, Link } from 'react-router-dom';
    import { supabase } from '../lib/supabase';
    import { getSharedResource, SharedRunOfShowData } from '../lib/shareUtils';
    import Header from '../components/Header';
    import Footer from '../components/Footer';
    import { Loader, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
    import { RunOfShowItem, CustomColumnDefinition } from './RunOfShowEditor'; // Assuming these types are exported

    // Utility functions (can be moved to a shared util file later)
    const parseDurationToSeconds = (durationStr?: string): number | null => {
      if (!durationStr) return null;
      const parts = durationStr.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        if (!isNaN(minutes) && !isNaN(seconds)) {
          return minutes * 60 + seconds;
        }
      } else if (parts.length === 1) {
        const seconds = parseInt(parts[0], 10);
        if (!isNaN(seconds)) {
          return seconds;
        }
      }
      return null;
    };

    const formatTime = (totalSeconds: number | null): string => {
      if (totalSeconds === null || totalSeconds < 0) return "00:00";
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    const findNextPlayableItemIndex = (items: RunOfShowItem[], startIndex: number | null): number | null => {
        if (!items) return null;
        const startFrom = startIndex === null ? -1 : startIndex;
        for (let i = startFrom + 1; i < items.length; i++) {
          if (items[i].type === 'item') {
            return i;
          }
        }
        return null;
      };


    const SharedShowModePage: React.FC = () => {
      const { shareCode } = useParams<{ shareCode: string }>();
      const [loading, setLoading] = useState(true);
      const [sharedData, setSharedData] = useState<SharedRunOfShowData | null>(null);
      const [error, setError] = useState<string | null>(null);
      const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

      useEffect(() => {
        const timer = setInterval(() => {
          setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
      }, []);

      useEffect(() => {
        const fetchSharedData = async () => {
          if (!shareCode) {
            setError("Share code is missing.");
            setLoading(false);
            return;
          }
          try {
            setLoading(true);
            const { resource, shareLink } = await getSharedResource(shareCode);
            if (shareLink.resource_type !== 'run_of_show') {
              throw new Error("This share link is not for a Run of Show.");
            }
            // The RPC get_public_run_of_show_by_share_code returns data structured as SharedRunOfShowData
            setSharedData(resource as SharedRunOfShowData);
          } catch (err: any) {
            console.error("Error fetching shared Run of Show:", err);
            setError(err.message || "Failed to load shared Run of Show.");
          } finally {
            setLoading(false);
          }
        };
        fetchSharedData();
      }, [shareCode]);

      useEffect(() => {
        if (!sharedData || !sharedData.id) return; // sharedData.id is the run_of_shows.id

        const channel = supabase
          .channel(`public:run_of_shows:id=eq.${sharedData.id}`)
          .on(
            'postgres_changes',
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'run_of_shows', 
              filter: `id=eq.${sharedData.id}` 
            },
            (payload) => {
              console.log('Real-time update received:', payload);
              const updatedRunOfShow = payload.new as SharedRunOfShowData; // Assuming payload.new matches this structure
              setSharedData(prevData => {
                if (!prevData) return null;
                // Merge new live_show_data and potentially items if they are part of the payload and sanitized
                // The RPC sanitizes items, so if items are updated by owner, this view might need a re-fetch or trust payload.new.items
                // For now, primarily focusing on live_show_data updates.
                return {
                  ...prevData,
                  live_show_data: updatedRunOfShow.live_show_data,
                  items: updatedRunOfShow.items || prevData.items, // Use new items if available, else keep old
                  last_edited: updatedRunOfShow.last_edited || prevData.last_edited,
                };
              });
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('Subscribed to real-time updates for Run of Show ID:', sharedData.id);
            }
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.error('Real-time subscription error:', status, err);
              setError('Connection lost. Please refresh to see live updates.');
            }
          });

        return () => {
          supabase.removeChannel(channel);
        };
      }, [sharedData]);


      if (loading) {
        return (
          <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <Loader className="h-12 w-12 animate-spin text-indigo-400" />
            <p className="ml-4 text-lg">Loading Shared Show...</p>
          </div>
        );
      }

      if (error) {
        return (
          <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
            <Header dashboard={false} />
            <div className="text-center flex-grow flex flex-col justify-center">
              <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Show</h1>
              <p className="text-gray-300 mb-6">{error}</p>
              <Link
                to="/"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Go to Homepage
              </Link>
            </div>
            <Footer />
          </div>
        );
      }

      if (!sharedData) {
        return (
          <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
            <Header dashboard={false} />
            <p className="flex-grow flex items-center justify-center">Shared Run of Show data could not be loaded.</p>
            <Footer />
          </div>
        );
      }
      
      // Define columns for display, excluding privateNotes
      const defaultColumns: { key: keyof RunOfShowItem | string; label: string; type?: string }[] = [
        { key: "itemNumber", label: "Item #" },
        { key: "startTime", label: "Start", type: "time" },
        { key: "preset", label: "Preset / Scene" },
        { key: "duration", label: "Duration", type: "text" }, 
        // { key: "privateNotes", label: "Private Notes" }, // EXCLUDED
        { key: "productionNotes", label: "Production Notes" },
        { key: "audio", label: "Audio" },
        { key: "video", label: "Video" },
        { key: "lights", label: "Lights" },
      ];

      const allDisplayColumns = [
        ...defaultColumns,
        ...(sharedData.custom_column_definitions || []).map((col: CustomColumnDefinition) => ({ 
            key: col.name, 
            label: col.name, 
            id: col.id, 
            isCustom: true, 
            type: col.type || "text" 
        }))
      ].filter(col => col.key !== 'privateNotes'); // Ensure privateNotes is definitely out

      const liveState = sharedData.live_show_data || {};
      const currentItemIndex = liveState.currentItemIndex !== undefined ? liveState.currentItemIndex : null;
      const isTimerActive = liveState.isTimerActive || false;
      const timeRemaining = liveState.timeRemaining !== undefined ? liveState.timeRemaining : null;
      
      const items = sharedData.items || [];
      const nextPlayableItemActualIndex = findNextPlayableItemIndex(items, currentItemIndex);


      return (
        <div className="min-h-screen flex flex-col bg-gray-950 text-white p-0">
          <Header dashboard={false} />
          
          <main className="flex-grow flex flex-col p-4 md:p-8 container mx-auto mt-16 md:mt-12">
            <div className="mb-4 flex justify-end">
                <a 
                    href="https://sounddocs.live" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors group"
                >
                    Powered by SoundDocs.live <ExternalLink size={12} className="ml-1.5"/>
                </a>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 md:mb-6 p-2 sm:p-3 bg-gray-900 rounded-lg shadow-md">
              <div className="flex items-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-indigo-400" />
                <span className="text-lg sm:text-xl font-mono">{currentTime}</span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-center my-2 sm:my-0 truncate px-2 sm:px-4 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl" title={sharedData.name}>
                {sharedData.name}
              </h1>
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-400">
                {/* Placeholder for any future minimal controls or status indicators */}
                <span>View-Only Mode</span>
              </div>
            </div>

            <div className="flex-grow overflow-auto bg-gray-800 rounded-lg shadow-lg">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/80 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    {allDisplayColumns.map((col, index) => (
                      <th
                        key={col.key || col.id}
                        scope="col"
                        className={`py-2.5 sm:py-3 px-2 sm:px-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap 
                                    ${index === 0 ? 'pl-3 sm:pl-4 md:pl-6' : ''} 
                                    ${index === allDisplayColumns.length -1 ? 'pr-3 sm:pr-4 md:pr-6' : ''}`}
                        style={{ minWidth: col.key === 'itemNumber' ? '150px' : col.key === 'productionNotes' ? '200px' : '100px' }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {items.length > 0 ? items.map((item: RunOfShowItem, index: number) => {
                    const isCurrent = index === currentItemIndex && item.type === 'item';
                    const isNext = index === nextPlayableItemActualIndex && item.type === 'item';

                    let rowClass = "hover:bg-gray-700/50 transition-colors duration-150";
                    let rowStyle: React.CSSProperties = {};

                    if (item.type === 'header') {
                      rowClass = "bg-gray-700/70 hover:bg-gray-600/70 font-semibold";
                    } else {
                      if (item.highlightColor && !isCurrent && !isNext) {
                        rowStyle.backgroundColor = item.highlightColor;
                      }
                      if (isCurrent) {
                        rowClass = "bg-green-600/40 hover:bg-green-600/50 border-l-4 border-green-400";
                        delete rowStyle.backgroundColor; 
                      } else if (isNext) {
                        rowClass = "bg-red-600/40 hover:bg-red-600/50 border-l-4 border-red-400";
                        delete rowStyle.backgroundColor; 
                      }
                    }

                    return (
                      <tr key={item.id} className={rowClass} style={rowStyle}>
                        {allDisplayColumns.map((colConfig, colIdx) => (
                          <td 
                            key={colConfig.key || colConfig.id} 
                            className={`px-2 sm:px-3 py-2 sm:py-2.5 whitespace-pre-wrap text-sm 
                                        ${colIdx === 0 ? 'pl-3 sm:pl-4 md:pl-6' : ''} 
                                        ${colIdx === allDisplayColumns.length -1 ? 'pr-3 sm:pr-4 md:pr-6' : ''}
                                        ${item.type === 'header' && colIdx === 0 ? 'text-lg text-white py-3 sm:py-3.5' : 'text-gray-200'}
                                        ${item.type === 'header' && colIdx > 0 ? 'text-gray-500 italic' : ''}
                                        `}
                          >
                            {item.type === 'header' ? 
                              (colIdx === 0 ? item.headerTitle : (colIdx === 1 ? item.startTime : '')) 
                              : (item[colConfig.key as keyof RunOfShowItem] || "")
                            }
                          </td>
                        ))}
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={allDisplayColumns.length} className="text-center py-10 text-gray-400">
                        No items in this Run of Show.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 sm:mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-x-4">
              {(() => {
                if (currentItemIndex !== null && items[currentItemIndex]?.type === 'item') {
                  const currentItem = items[currentItemIndex];
                  const itemFullDuration = parseDurationToSeconds(currentItem.duration);

                  if (isTimerActive && timeRemaining !== null) {
                    return <span className="font-mono text-sm text-yellow-400">Current Cue Ends in: {formatTime(timeRemaining)}</span>;
                  } else if (itemFullDuration !== null) {
                    const displayTime = timeRemaining !== null ? timeRemaining : itemFullDuration;
                    return <span className="font-mono text-sm text-gray-400">Current Cue Duration: {formatTime(displayTime)}</span>;
                  }
                } else if (currentItemIndex === null && nextPlayableItemActualIndex !== null && items[nextPlayableItemActualIndex]) {
                    const firstItem = items[nextPlayableItemActualIndex];
                    const firstItemDuration = parseDurationToSeconds(firstItem.duration);
                    if (firstItemDuration !== null) {
                         return <span className="font-mono text-sm text-gray-400">Next Cue Duration: {formatTime(firstItemDuration)}</span>;
                    }
                }
                return <span className="font-mono text-sm text-gray-400">Show status will update live.</span>;
              })()}
            </div>
             <div className="mt-2 text-center text-xs text-gray-600">
                Last live update: {liveState.lastUpdated ? new Date(liveState.lastUpdated).toLocaleTimeString() : 'N/A'}
            </div>
          </main>
          <Footer />
        </div>
      );
    };

    export default SharedShowModePage;
