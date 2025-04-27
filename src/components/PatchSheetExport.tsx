import React, { forwardRef } from 'react';
import { Bookmark, Calendar, MapPin, Headphones, User, Users, Settings, Music, Clock, Mic, Link } from 'lucide-react';

interface PatchSheetExportProps {
  patchSheet: any;
}

const PatchSheetExport = forwardRef<HTMLDivElement, PatchSheetExportProps>(({ patchSheet }, ref) => {
  const info = patchSheet.info || {};
  const inputs = patchSheet.inputs || [];
  const outputs = patchSheet.outputs || [];
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Helper for empty fields - only show actual values, not placeholder text
  const displayValue = (value: string | undefined) => value || '';

  // Helper to find linked stereo channel
  const findStereoLink = (channelNumber: string, array: any[]) => {
    return array.find(item => item.channelNumber === channelNumber && item.isStereo);
  };
  
  return (
    <div 
      ref={ref} 
      className="export-wrapper text-white p-8 rounded-lg shadow-xl"
      style={{ 
        width: '1600px', 
        position: 'absolute', 
        left: '-9999px', 
        fontFamily: 'Inter, sans-serif',
        background: 'linear-gradient(to bottom, #111827, #0f172a)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header with enhanced branding */}
      <div 
        className="flex justify-between items-center mb-8 pb-6 relative overflow-hidden"
        style={{
          borderBottom: '2px solid rgba(99, 102, 241, 0.4)',
          background: 'linear-gradient(to right, rgba(15, 23, 42, 0.3), rgba(20, 30, 70, 0.2))',
          borderRadius: '10px',
          padding: '20px'
        }}
      >
        {/* Background decorative elements */}
        <div 
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%)',
            zIndex: 0
          }}
        ></div>
        
        {/* Brand logo and name */}
        <div className="flex items-center z-10">
          <div 
            className="p-3 rounded-lg mr-4"
            style={{
              background: 'linear-gradient(145deg, #4f46e5, #4338ca)',
              boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Bookmark className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">SoundDocs</h1>
            <p className="text-indigo-400 font-medium">Professional Audio Documentation</p>
          </div>
        </div>
        
        {/* Document title and date */}
        <div className="text-right z-10">
          <h2 className="text-2xl font-bold text-white">{patchSheet.name}</h2>
          <p className="text-gray-400">Created: {formatDate(patchSheet.created_at)}</p>
        </div>
      </div>
      
      {/* Event Information Panel */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-800/80 p-6 rounded-lg shadow-md" style={{ borderLeft: '4px solid #4f46e5' }}>
          <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
            <Calendar className="h-5 w-5 mr-2" />
            Event Details
          </h3>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {info.event_name && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Event Name</p>
                <p className="text-white font-medium">{info.event_name}</p>
              </div>
            )}
            {info.event_type && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Event Type</p>
                <p className="text-white font-medium">{info.event_type}</p>
              </div>
            )}
            {info.date && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Date</p>
                <p className="text-white font-medium">{info.date}</p>
              </div>
            )}
            {(info.event_start || info.event_end) && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Time</p>
                <p className="text-white font-medium">
                  {info.event_start && info.event_end 
                    ? `${info.event_start} - ${info.event_end}`
                    : info.event_start || info.event_end}
                </p>
              </div>
            )}
            {info.load_in && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Load In</p>
                <p className="text-white font-medium">{info.load_in}</p>
              </div>
            )}
            {info.sound_check && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Sound Check</p>
                <p className="text-white font-medium">{info.sound_check}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800/80 p-6 rounded-lg shadow-md" style={{ borderLeft: '4px solid #4f46e5' }}>
          <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
            <MapPin className="h-5 w-5 mr-2" />
            Venue Information
          </h3>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {info.venue && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Venue</p>
                <p className="text-white font-medium">{info.venue}</p>
              </div>
            )}
            {info.room && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Room</p>
                <p className="text-white font-medium">{info.room}</p>
              </div>
            )}
            {info.address && (
              <div className="col-span-2">
                <p className="text-gray-400 text-sm font-medium">Address</p>
                <p className="text-white font-medium">{info.address}</p>
              </div>
            )}
            {info.estimated_attendance && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Estimated Attendance</p>
                <p className="text-white font-medium">{info.estimated_attendance}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Artist and Technical Staff */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-800/80 p-6 rounded-lg shadow-md" style={{ borderLeft: '4px solid #4f46e5' }}>
          <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
            <User className="h-5 w-5 mr-2" />
            Client/Artist Information
          </h3>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {info.client && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Client</p>
                <p className="text-white font-medium">{info.client}</p>
              </div>
            )}
            {info.artist && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Artist/Performer</p>
                <p className="text-white font-medium">{info.artist}</p>
              </div>
            )}
            {info.genre && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Genre/Style</p>
                <p className="text-white font-medium">{info.genre}</p>
              </div>
            )}
            {info.contact_name && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Primary Contact</p>
                <p className="text-white font-medium">{info.contact_name}</p>
              </div>
            )}
            {info.contact_email && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Email</p>
                <p className="text-white font-medium">{info.contact_email}</p>
              </div>
            )}
            {info.contact_phone && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Phone</p>
                <p className="text-white font-medium">{info.contact_phone}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800/80 p-6 rounded-lg shadow-md" style={{ borderLeft: '4px solid #4f46e5' }}>
          <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
            <Users className="h-5 w-5 mr-2" />
            Technical Staff
          </h3>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {info.foh_engineer && (
              <div>
                <p className="text-gray-400 text-sm font-medium">FOH Engineer</p>
                <p className="text-white font-medium">{info.foh_engineer}</p>
              </div>
            )}
            {info.monitor_engineer && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Monitor Engineer</p>
                <p className="text-white font-medium">{info.monitor_engineer}</p>
              </div>
            )}
            {info.production_manager && (
              <div>
                <p className="text-gray-400 text-sm font-medium">Production Manager</p>
                <p className="text-white font-medium">{info.production_manager}</p>
              </div>
            )}
            {info.av_company && (
              <div>
                <p className="text-gray-400 text-sm font-medium">AV Company</p>
                <p className="text-white font-medium">{info.av_company}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Equipment Information */}
      <div className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8" style={{ borderLeft: '4px solid #4f46e5' }}>
        <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
          <Settings className="h-5 w-5 mr-2" />
          Equipment Information
        </h3>
        
        <div className="grid grid-cols-4 gap-x-6 gap-y-4">
          {info.pa_system && (
            <div>
              <p className="text-gray-400 text-sm font-medium">PA System</p>
              <p className="text-white font-medium">{info.pa_system}</p>
            </div>
          )}
          {info.console_foh && (
            <div>
              <p className="text-gray-400 text-sm font-medium">FOH Console</p>
              <p className="text-white font-medium">{info.console_foh}</p>
            </div>
          )}
          {info.console_monitors && (
            <div>
              <p className="text-gray-400 text-sm font-medium">Monitor Console</p>
              <p className="text-white font-medium">{info.console_monitors}</p>
            </div>
          )}
          {info.monitor_type && (
            <div>
              <p className="text-gray-400 text-sm font-medium">Monitor Type</p>
              <p className="text-white font-medium">{info.monitor_type}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Input List */}
      <div 
        className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8" 
        style={{ 
          borderLeft: '4px solid #4f46e5',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
          <Mic className="h-5 w-5 mr-2" />
          Input List
        </h3>
        
        {inputs && inputs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr 
                  style={{ 
                    background: 'linear-gradient(to right, #2d3748, #1e293b)',
                    borderBottom: '2px solid rgba(99, 102, 241, 0.4)'
                  }}
                >
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Ch</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Name</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Type</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Device</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Connection</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Snake Type</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Snake Input</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Console Type</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Console Input</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Network Type</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Network Patch</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">48V</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Notes</th>
                </tr>
              </thead>
              <tbody>
                {inputs.map((input: any, index: number) => {
                  // Find linked stereo channel if exists
                  const linkedChannel = input.isStereo && input.stereoChannelNumber 
                    ? findStereoLink(input.stereoChannelNumber, inputs)
                    : null;
                    
                  // Extract connection details for better organization
                  const snakeType = input.connection && ['Analog Snake', 'Digital Snake'].includes(input.connection)
                    ? `${input.connectionDetails?.snakeType || 'N/A'}`
                    : 'N/A';
                    
                  const snakeInput = input.connection && ['Analog Snake', 'Digital Snake'].includes(input.connection)
                    ? `#${input.connectionDetails?.inputNumber || 'N/A'}`
                    : 'N/A';
                  
                  // Show "-" for console type when digital snake/network is used
                  const consoleType = input.connection && ['Digital Snake', 'Digital Network'].includes(input.connection)
                    ? '-'
                    : input.connection && ['Analog Snake', 'Console Direct'].includes(input.connection)
                      ? `${input.connectionDetails?.consoleType || 'N/A'}`
                      : 'N/A';
                    
                  // Show "-" for console input when digital snake/network is used
                  const consoleInput = input.connection && ['Digital Snake', 'Digital Network'].includes(input.connection)
                    ? '-'
                    : input.connection && ['Analog Snake', 'Console Direct'].includes(input.connection)
                      ? `#${input.connectionDetails?.consoleInputNumber || 'N/A'}`
                      : 'N/A';
                    
                  const networkType = input.connection && ['Digital Snake', 'Digital Network'].includes(input.connection)
                    ? `${input.connectionDetails?.networkType || 'N/A'}`
                    : 'N/A';
                    
                  const networkPatch = input.connection && ['Digital Snake', 'Digital Network'].includes(input.connection)
                    ? `${input.connectionDetails?.networkPatch ? `#${input.connectionDetails.networkPatch}` : 'N/A'}`
                    : 'N/A';
                    
                  return (
                    <tr 
                      key={input.id} 
                      style={{ 
                        background: index % 2 === 0 ? 'rgba(31, 41, 55, 0.7)' : 'rgba(45, 55, 72, 0.4)',
                        borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
                        ...(input.isStereo ? { borderLeft: '3px solid rgba(99, 102, 241, 0.6)' } : {})
                      }}
                    >
                      <td className="py-3 px-4 text-white align-middle font-medium">{input.channelNumber}</td>
                      <td className="py-3 px-4 text-white font-medium align-middle">
                        {input.name || ''}
                        {input.isStereo && linkedChannel && (
                          <div className="text-indigo-300 text-xs flex items-center mt-1">
                            <Link className="h-3 w-3 mr-1" />
                            <span>Stereo w/ Ch {linkedChannel.channelNumber}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white align-middle">{input.type || ''}</td>
                      <td className="py-3 px-4 text-white align-middle">{input.device || ''}</td>
                      <td className="py-3 px-4 text-white align-middle">{input.connection || ''}</td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{snakeType === 'N/A' ? '' : snakeType}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{snakeInput === 'N/A' ? '' : snakeInput}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{consoleType === 'N/A' ? '' : consoleType}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{consoleInput === 'N/A' ? '' : consoleInput}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{networkType === 'N/A' ? '' : networkType}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{networkPatch === 'N/A' ? '' : networkPatch}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${input.phantom ? 'bg-indigo-500/20 text-indigo-300' : 'bg-gray-700 text-gray-400'}`}
                        >
                          {input.phantom ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">{input.notes || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">No inputs defined.</p>
        )}
      </div>
      
      {/* Output List */}
      <div 
        className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8" 
        style={{ 
          borderLeft: '4px solid #4f46e5',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
          <Headphones className="h-5 w-5 mr-2" />
          Output List
        </h3>
        
        {outputs && outputs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  style={{ 
                    background: 'linear-gradient(to right, #2d3748, #1e293b)',
                    borderBottom: '2px solid rgba(99, 102, 241, 0.4)'
                  }}
                >
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Ch</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Name</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Source Type</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Snake Type</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Snake Output</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Console Type</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Console Output</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Network Type</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Network Patch</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Destination</th>
                  <th className="py-3 px-4 text-indigo-400 font-medium align-middle">Notes</th>
                </tr>
              </thead>
              <tbody>
                {outputs.map((output: any, index: number) => {
                  // Find linked stereo channel if exists
                  const linkedChannel = output.isStereo && output.stereoChannelNumber 
                    ? findStereoLink(output.stereoChannelNumber, outputs)
                    : null;
                    
                  // Extract source details for better organization
                  const snakeType = output.sourceType && ['Analog Snake', 'Digital Snake'].includes(output.sourceType)
                    ? `${output.sourceDetails?.snakeType || 'N/A'}`
                    : 'N/A';
                    
                  const snakeOutput = output.sourceType && ['Analog Snake', 'Digital Snake'].includes(output.sourceType)
                    ? `#${output.sourceDetails?.outputNumber || 'N/A'}`
                    : 'N/A';

                  // Show "-" for console type when digital snake/network is used
                  const consoleType = output.sourceType && ['Digital Snake', 'Digital Network'].includes(output.sourceType)
                    ? '-'
                    : output.sourceType && ['Analog Snake', 'Console Output'].includes(output.sourceType)
                      ? output.sourceType === 'Console Output' 
                        ? 'Console'
                        : `${output.sourceDetails?.consoleType || 'N/A'}`
                      : 'N/A';

                  // Show "-" for console output when digital snake/network is used
                  const consoleOutput = output.sourceType && ['Digital Snake', 'Digital Network'].includes(output.sourceType)
                    ? '-'
                    : output.sourceType && ['Analog Snake', 'Console Output'].includes(output.sourceType)
                      ? `#${output.sourceDetails?.outputNumber || output.sourceDetails?.consoleOutputNumber || 'N/A'}`
                      : 'N/A';
                    
                  const networkType = output.sourceType && ['Digital Snake', 'Digital Network'].includes(output.sourceType)
                    ? `${output.sourceDetails?.networkType || 'N/A'}`
                    : 'N/A';
                    
                  const networkPatch = output.sourceType && ['Digital Snake', 'Digital Network'].includes(output.sourceType)
                    ? `${output.sourceDetails?.networkPatch ? `#${output.sourceDetails.networkPatch}` : 'N/A'}`
                    : 'N/A';
                    
                  return (
                    <tr 
                      key={output.id} 
                      style={{ 
                        background: index % 2 === 0 ? 'rgba(31, 41, 55, 0.7)' : 'rgba(45, 55, 72, 0.4)',
                        borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
                        ...(output.isStereo ? { borderLeft: '3px solid rgba(99, 102, 241, 0.6)' } : {})
                      }}
                    >
                      <td className="py-3 px-4 text-white align-middle font-medium">{output.channelNumber}</td>
                      <td className="py-3 px-4 text-white font-medium align-middle">
                        {output.name || ''}
                        {output.isStereo && linkedChannel && (
                          <div className="text-indigo-300 text-xs flex items-center mt-1">
                            <Link className="h-3 w-3 mr-1" />
                            <span>Stereo w/ Ch {linkedChannel.channelNumber}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white align-middle">{output.sourceType || ''}</td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{snakeType === 'N/A' ? '' : snakeType}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{snakeOutput === 'N/A' ? '' : snakeOutput}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{consoleType === 'N/A' ? '' : consoleType}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{consoleOutput === 'N/A' ? '' : consoleOutput}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{networkType === 'N/A' ? '' : networkType}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <span className="text-indigo-300">{networkPatch === 'N/A' ? '' : networkPatch}</span>
                      </td>
                      <td className="py-3 px-4 text-white align-middle">
                        <div className="font-medium">{output.destinationType || ''}</div>
                        {output.destinationGear && (
                          <div className="text-gray-400 text-sm">{output.destinationGear}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white align-middle">{output.notes || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">No outputs defined.</p>
        )}
      </div>
      
      {/* Notes */}
      {info.notes && (
        <div 
          className="bg-gray-800/80 p-6 rounded-lg shadow-md mb-8" 
          style={{ 
            borderLeft: '4px solid #4f46e5',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          <h3 className="text-xl font-semibold text-indigo-400 flex items-center mb-4">
            <Music className="h-5 w-5 mr-2" />
            Additional Notes
          </h3>
          <p className="text-white">{info.notes}</p>
        </div>
      )}
      
      {/* Footer with enhanced branding */}
      <div className="relative mt-12 pt-6 overflow-hidden">
        {/* Decorative background */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(31, 41, 55, 0.5), rgba(31, 41, 55, 0.7))',
            borderTop: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '8px',
            zIndex: -1
          }}
        ></div>
        
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center">
            <div 
              className="p-2 rounded-md mr-2"
              style={{
                background: 'linear-gradient(145deg, #4f46e5, #4338ca)',
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
              }}
            >
              <Bookmark className="h-5 w-5 text-white" />
            </div>
            <span className="text-indigo-400 font-medium">SoundDocs</span>
          </div>
          <div className="text-gray-400 text-sm flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Watermark */}
        <div 
          style={{
            position: 'absolute',
            bottom: '-30px',
            right: '-30px',
            opacity: '0.05',
            transform: 'rotate(-15deg)',
            zIndex: -1
          }}
        >
          <Bookmark className="h-40 w-40" />
        </div>
      </div>
    </div>
  );
});

PatchSheetExport.displayName = 'PatchSheetExport';

export default PatchSheetExport;