import React, { useState, useEffect, useCallback } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { supabase } from '../lib/supabase';
    import Header from '../components/Header';
    import Footer from '../components/Footer';
    import { Loader, Clock, Play, Pause, SkipForward, Maximize, Minimize, ArrowLeft } from 'lucide-react';
    import { RunOfShowItem, CustomColumnDefinition } from './RunOfShowEditor';

    interface FullRunOfShowData {
      id: string;
      name: string;
      items: RunOfShowItem[];
      custom_column_definitions: CustomColumnDefinition[];
      created_at?: string;
      last_edited?: string;
      user_id?: string;
    }

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

    const ShowModePage: React.FC = () => {
      const { id } = useParams<{ id: string }>();
      const navigate = useNavigate();
      const [loading, setLoading] = useState(true);
      const [runOfShow, setRunOfShow] = useState<FullRunOfShowData | null>(null);
      const [error, setError] = useState<string | null>(null);
      const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
      const [isFullscreen, setIsFullscreen] = useState(false);

      const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
      const [isPlaying, setIsPlaying] = useState(false);
      const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
      const [itemTimerId, setItemTimerId] = useState<NodeJS.Timeout | null>(null);

      useEffect(() => {
        const timer = setInterval(() => {
          setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
      }, []);

      useEffect(() => {
        const fetchRunOfShowData = async () => {
          if (!id) {
            setError("Run of Show ID is missing.");
            setLoading(false);
            return;
          }
          try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData.user) {
              navigate("/login");
              return;
            }
            const { data, error: fetchError } = await supabase
              .from("run_of_shows")
              .select("*")
              .eq("id", id)
              .eq("user_id", userData.user.id)
              .single();

            if (fetchError) throw fetchError;
            if (data) {
              const migratedItems = (data.items || []).map((item: any) => ({
                ...item,
                type: item.type || 'item',
              }));
              setRunOfShow({
                ...data,
                items: migratedItems,
                custom_column_definitions: data.custom_column_definitions || [],
              });
              const firstItemIdx = migratedItems.findIndex(item => item.type === 'item');
              setCurrentItemIndex(firstItemIdx !== -1 ? firstItemIdx : null);
            } else {
              setError("Run of Show not found or access denied.");
            }
          } catch (err: any) {
            console.error("Error fetching Run of Show:", err);
            setError(`Failed to load Run of Show: ${err.message}`);
          } finally {
            setLoading(false);
          }
        };
        fetchRunOfShowData();
      }, [id, navigate]);

      const findNextPlayableItemIndex = useCallback((startIndex: number | null): number | null => {
        if (startIndex === null || !runOfShow || !runOfShow.items) return null;
        for (let i = startIndex + 1; i < runOfShow.items.length; i++) {
          if (runOfShow.items[i].type === 'item') {
            return i;
          }
        }
        return null;
      }, [runOfShow]);

      const handleNextItem = useCallback(() => {
        setCurrentItemIndex(prevIndex => {
          const nextIndex = findNextPlayableItemIndex(prevIndex);
          if (nextIndex === null) {
            setIsPlaying(false);
            return prevIndex;
          }
          return nextIndex;
        });
      }, [findNextPlayableItemIndex, setIsPlaying]);

      useEffect(() => {
        if (itemTimerId) {
          clearInterval(itemTimerId);
          setItemTimerId(null);
        }
        setTimeRemaining(null);

        if (isPlaying && currentItemIndex !== null && runOfShow) {
          const currentItem = runOfShow.items[currentItemIndex];
          if (currentItem && currentItem.type === 'item') {
            const duration = parseDurationToSeconds(currentItem.duration);
            if (duration !== null && duration > 0) {
              setTimeRemaining(duration);
              const newTimerId = setInterval(() => {
                setTimeRemaining(prevTime => {
                  if (prevTime === null || prevTime <= 1) {
                    clearInterval(newTimerId);
                    handleNextItem();
                    return null;
                  }
                  return prevTime - 1;
                });
              }, 1000);
              setItemTimerId(newTimerId);
            }
          }
        }
        return () => {
          if (itemTimerId) clearInterval(itemTimerId);
        };
      }, [currentItemIndex, isPlaying, runOfShow, handleNextItem]);

      useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.code === 'Space') {
            event.preventDefault();
            handleNextItem();
          }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, [handleNextItem]);
      
      const togglePlayPause = () => {
        setIsPlaying(prev => !prev);
      };

      const handleSkipForward = () => {
        handleNextItem();
      };

      const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          });
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      };

      useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
      }, []);

      if (loading) {
        return (
          <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <Loader className="h-12 w-12 animate-spin text-indigo-400" />
            <p className="ml-4 text-lg">Loading Show Mode...</p>
          </div>
        );
      }

      if (error) {
        return (
          <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
            {!isFullscreen && <Header dashboard={false} />}
            <div className="text-center flex-grow flex flex-col justify-center">
              <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
              <p className="text-gray-300 mb-6">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Go Back
              </button>
            </div>
            {!isFullscreen && <Footer />}
          </div>
        );
      }

      if (!runOfShow) {
        return (
          <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
             {!isFullscreen && <Header dashboard={false} />}
            <p className="flex-grow flex items-center justify-center">Run of Show data could not be loaded.</p>
            {!isFullscreen && <Footer />}
          </div>
        );
      }
      
      const defaultColumns: { key: keyof RunOfShowItem | string; label: string; type?: string }[] = [
        { key: "itemNumber", label: "Item #" },
        { key: "startTime", label: "Start", type: "time" },
        { key: "preset", label: "Preset / Scene" },
        { key: "duration", label: "Duration", type: "text" }, 
        { key: "privateNotes", label: "Private Notes" },
        { key: "productionNotes", label: "Production Notes" },
        { key: "audio", label: "Audio" },
        { key: "video", label: "Video" },
        { key: "lights", label: "Lights" },
      ];

      const allDisplayColumns = [
        ...defaultColumns,
        ...(runOfShow.custom_column_definitions || []).map(col => ({ key: col.name, label: col.name, id: col.id, isCustom: true, type: col.type || "text" }))
      ];

      const nextPlayableItemActualIndex = findNextPlayableItemIndex(currentItemIndex);

      return (
        <div className={`min-h-screen flex flex-col bg-gray-950 text-white transition-all duration-300 ${isFullscreen ? 'p-1 sm:p-2' : 'p-0'}`}>
          {!isFullscreen && <Header dashboard={false} />}
          
          <main className={`flex-grow flex flex-col ${isFullscreen ? 'p-1 sm:p-2 md:p-4' : 'p-4 md:p-8 container mx-auto mt-16 md:mt-12'}`}>
            {!isFullscreen && (
              <div className="mb-4 flex justify-start">
                <button
                  onClick={() => navigate(`/run-of-show/${id}`)}
                  className="inline-flex items-center text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-md text-sm font-medium transition-colors group bg-gray-800 hover:bg-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 text-indigo-500 group-hover:text-indigo-400 transition-colors" />
                  Back to Editor
                </button>
              </div>
            )}
            
            <div className={`flex flex-col sm:flex-row justify-between items-center mb-4 md:mb-6 p-2 sm:p-3 bg-gray-900 rounded-lg shadow-md ${isFullscreen ? 'sticky top-0 z-50' : ''}`}>
              <div className="flex items-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-indigo-400" />
                <span className="text-lg sm:text-xl font-mono">{currentTime}</span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-center my-2 sm:my-0 truncate px-2 sm:px-4 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl" title={runOfShow.name}>
                {runOfShow.name}
              </h1>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button 
                  className="p-1.5 sm:p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors" 
                  title={isPlaying ? "Pause" : "Play"}
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button 
                  className="p-1.5 sm:p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors" 
                  title="Next Item"
                  onClick={handleSkipForward}
                >
                  <SkipForward size={20} />
                </button>
                <button 
                  onClick={toggleFullscreen} 
                  className="p-1.5 sm:p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
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
                        style={{ minWidth: col.key === 'itemNumber' ? '150px' : col.key === 'privateNotes' || col.key === 'productionNotes' ? '200px' : '100px' }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {runOfShow.items.length > 0 ? runOfShow.items.map((item, index) => {
                    const isCurrent = index === currentItemIndex && item.type === 'item';
                    const isNext = index === nextPlayableItemActualIndex && item.type === 'item';

                    let rowClass = "hover:bg-gray-700/50 transition-colors duration-150";
                    if (item.type === 'header') {
                      rowClass = "bg-gray-700/70 hover:bg-gray-600/70 font-semibold";
                    } else if (isCurrent) {
                      rowClass = "bg-green-600/40 hover:bg-green-600/50 border-l-4 border-green-400";
                    } else if (isNext) {
                      rowClass = "bg-red-600/40 hover:bg-red-600/50 border-l-4 border-red-400";
                    }

                    return (
                      <tr key={item.id} className={rowClass}>
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
              <span>Press <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-gray-200 bg-gray-700 border border-gray-600 rounded-md">Space</kbd> to advance.</span>
              {(() => {
                if (currentItemIndex !== null && runOfShow && runOfShow.items[currentItemIndex]?.type === 'item') {
                  const currentItem = runOfShow.items[currentItemIndex];
                  if (isPlaying && timeRemaining !== null) {
                    return <span className="font-mono text-sm text-yellow-400">Ends in: {formatTime(timeRemaining)}</span>;
                  } else if (currentItem.duration && parseDurationToSeconds(currentItem.duration) !== null) {
                    return <span className="font-mono text-sm text-gray-400">Duration: {currentItem.duration}</span>;
                  }
                }
                return null;
              })()}
            </div>
          </main>
          {!isFullscreen && <Footer />}
        </div>
      );
    };

    export default ShowModePage;
