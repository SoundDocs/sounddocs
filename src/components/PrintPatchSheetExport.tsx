import React, { forwardRef } from 'react';
import { Calendar, MapPin, Headphones, Settings, Music, Mic, Link } from 'lucide-react';

interface PrintPatchSheetExportProps {
  patchSheet: any;
}

const PrintPatchSheetExport = forwardRef<HTMLDivElement, PrintPatchSheetExportProps>(({ patchSheet }, ref) => {
  const info = patchSheet.info || {};
  const inputs = patchSheet.inputs || [];
  const outputs = patchSheet.outputs || [];
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Helper to find linked stereo channel
  const findStereoLink = (channelNumber: string, array: any[]) => {
    return array.find(item => item.channelNumber === channelNumber && item.isStereo);
  };
  
  return (
    <div 
      ref={ref} 
      className="export-wrapper print-version"
      style={{ 
        width: '1600px', 
        position: 'absolute', 
        left: '-9999px', 
        fontFamily: 'Inter, sans-serif',
        backgroundColor: 'white',
        color: '#111',
        padding: '40px'
      }}
    >
      {/* Header */}
      <div 
        style={{
          borderBottom: '2px solid #ddd',
          padding: '20px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ marginRight: '15px', fontWeight: 'bold', fontSize: '28px' }}>SoundDocs</div>
        </div>
        
        {/* Document title and date */}
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{patchSheet.name}</h2>
          <p style={{ fontSize: '14px', color: '#666' }}>Last edited: {formatDate(patchSheet.last_edited || patchSheet.created_at)}</p>
        </div>
      </div>
      
      {/* Event Information Panel */}
      <div style={{ marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
        <div style={{ flex: 1, minWidth: '300px', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            <Calendar style={{ height: '18px', width: '18px', display: 'inline', marginRight: '8px' }} />
            Event Details
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {info.event_name && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Event Name</p>
                <p style={{ fontWeight: '500' }}>{info.event_name}</p>
              </div>
            )}
            {info.event_type && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Event Type</p>
                <p style={{ fontWeight: '500' }}>{info.event_type}</p>
              </div>
            )}
            {info.date && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Date</p>
                <p style={{ fontWeight: '500' }}>{info.date}</p>
              </div>
            )}
            {(info.event_start || info.event_end) && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Time</p>
                <p style={{ fontWeight: '500' }}>
                  {info.event_start && info.event_end 
                    ? `${info.event_start} - ${info.event_end}`
                    : info.event_start || info.event_end}
                </p>
              </div>
            )}
            {info.load_in && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Load In</p>
                <p style={{ fontWeight: '500' }}>{info.load_in}</p>
              </div>
            )}
            {info.sound_check && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Sound Check</p>
                <p style={{ fontWeight: '500' }}>{info.sound_check}</p>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: '300px', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            <MapPin style={{ height: '18px', width: '18px', display: 'inline', marginRight: '8px' }} />
            Venue Information
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {info.venue && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Venue</p>
                <p style={{ fontWeight: '500' }}>{info.venue}</p>
              </div>
            )}
            {info.room && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Room</p>
                <p style={{ fontWeight: '500' }}>{info.room}</p>
              </div>
            )}
            {info.address && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Address</p>
                <p style={{ fontWeight: '500' }}>{info.address}</p>
              </div>
            )}
            {info.estimated_attendance && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Estimated Attendance</p>
                <p style={{ fontWeight: '500' }}>{info.estimated_attendance}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Equipment Information */}
      {(info.pa_system || info.console_foh || info.console_monitors || info.monitor_type) && (
        <div style={{ marginBottom: '30px', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            <Settings style={{ height: '18px', width: '18px', display: 'inline', marginRight: '8px' }} />
            Equipment Information
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            {info.pa_system && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>PA System</p>
                <p style={{ fontWeight: '500' }}>{info.pa_system}</p>
              </div>
            )}
            {info.console_foh && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>FOH Console</p>
                <p style={{ fontWeight: '500' }}>{info.console_foh}</p>
              </div>
            )}
            {info.console_monitors && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Monitor Console</p>
                <p style={{ fontWeight: '500' }}>{info.console_monitors}</p>
              </div>
            )}
            {info.monitor_type && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#666', marginBottom: '3px' }}>Monitor Type</p>
                <p style={{ fontWeight: '500' }}>{info.monitor_type}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Input List */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
          <Mic style={{ height: '18px', width: '18px', display: 'inline', marginRight: '8px' }} />
          Input List
        </h3>
        
        {inputs && inputs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Ch</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Device</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Connection</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Snake Type</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Snake Input</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Console Type</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Console Input</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Network Type</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Network Patch</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>48V</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Notes</th>
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
                    ? `${input.connectionDetails?.snakeType || ''}`
                    : '';
                    
                  const snakeInput = input.connection && ['Analog Snake', 'Digital Snake'].includes(input.connection)
                    ? input.connectionDetails?.inputNumber ? `#${input.connectionDetails.inputNumber}` : ''
                    : '';
                  
                  const consoleType = input.connection && ['Analog Snake', 'Console Direct'].includes(input.connection)
                    ? `${input.connectionDetails?.consoleType || ''}`
                    : input.connection && ['Digital Snake', 'Digital Network'].includes(input.connection)
                      ? '-'
                      : '';
                    
                  const consoleInput = input.connection && ['Analog Snake', 'Console Direct'].includes(input.connection)
                    ? input.connectionDetails?.consoleInputNumber ? `#${input.connectionDetails.consoleInputNumber}` : ''
                    : input.connection && ['Digital Snake', 'Digital Network'].includes(input.connection)
                      ? '-'
                      : '';
                    
                  const networkType = input.connection && ['Digital Snake', 'Digital Network'].includes(input.connection)
                    ? `${input.connectionDetails?.networkType || ''}`
                    : '';
                    
                  const networkPatch = input.connection && ['Digital Snake', 'Digital Network'].includes(input.connection)
                    ? input.connectionDetails?.networkPatch ? `#${input.connectionDetails.networkPatch}` : ''
                    : '';
                  
                  const rowStyle = {
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                    borderBottom: '1px solid #eee',
                    ...(input.isStereo ? { borderLeft: '2px solid #666' } : {})
                  };
                    
                  return (
                    <tr key={input.id} style={rowStyle}>
                      <td style={{ padding: '10px', verticalAlign: 'middle', fontWeight: '500' }}>{input.channelNumber}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle', fontWeight: '500' }}>
                        {input.name || ''}
                        {input.isStereo && linkedChannel && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                            <span>Stereo w/ Ch {linkedChannel.channelNumber}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{input.type || ''}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{input.device || ''}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{input.connection || ''}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{snakeType}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{snakeInput}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{consoleType}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{consoleInput}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{networkType}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{networkPatch}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px', 
                          fontWeight: '500',
                          backgroundColor: input.phantom ? '#eee' : '#f5f5f5',
                          color: '#333'
                        }}>
                          {input.phantom ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{input.notes || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#666' }}>No inputs defined.</p>
        )}
      </div>
      
      {/* Output List */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
          <Headphones style={{ height: '18px', width: '18px', display: 'inline', marginRight: '8px' }} />
          Output List
        </h3>
        
        {outputs && outputs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Ch</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Source Type</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Snake Type</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Snake Output</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Console Type</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Console Output</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Network Type</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Network Patch</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Destination</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600' }}>Notes</th>
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
                    ? `${output.sourceDetails?.snakeType || ''}`
                    : '';
                    
                  const snakeOutput = output.sourceType && ['Analog Snake', 'Digital Snake'].includes(output.sourceType)
                    ? output.sourceDetails?.outputNumber ? `#${output.sourceDetails.outputNumber}` : ''
                    : '';

                  // Correctly determine Console Type
                  const consoleType = (output.sourceType === 'Console Output' || output.sourceType === 'Analog Snake') && output.sourceDetails?.consoleType
                    ? output.sourceDetails.consoleType
                    : (output.sourceType === 'Digital Snake' || output.sourceType === 'Digital Network')
                      ? '-'
                      : '';

                  // Correctly determine Console Output Number
                  const consoleOutput = (output.sourceType === 'Console Output' || output.sourceType === 'Analog Snake') && output.sourceDetails?.consoleOutputNumber
                    ? `#${output.sourceDetails.consoleOutputNumber}`
                    : (output.sourceType === 'Digital Snake' || output.sourceType === 'Digital Network')
                      ? '-'
                      : '';
                    
                  const networkType = output.sourceType && ['Digital Snake', 'Digital Network'].includes(output.sourceType)
                    ? `${output.sourceDetails?.networkType || ''}`
                    : '';
                    
                  const networkPatch = output.sourceType && ['Digital Snake', 'Digital Network'].includes(output.sourceType)
                    ? output.sourceDetails?.networkPatch ? `#${output.sourceDetails.networkPatch}` : ''
                    : '';
                  
                  const rowStyle = {
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                    borderBottom: '1px solid #eee',
                    ...(output.isStereo ? { borderLeft: '2px solid #666' } : {})
                  };
                    
                  return (
                    <tr key={output.id} style={rowStyle}>
                      <td style={{ padding: '10px', verticalAlign: 'middle', fontWeight: '500' }}>{output.channelNumber}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle', fontWeight: '500' }}>
                        {output.name || ''}
                        {output.isStereo && linkedChannel && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                            <span>Stereo w/ Ch {linkedChannel.channelNumber}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{output.sourceType || ''}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{snakeType}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{snakeOutput}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{consoleType}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{consoleOutput}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{networkType}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{networkPatch}</td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '500' }}>{output.destinationType || ''}</div>
                        {output.destinationGear && (
                          <div style={{ fontSize: '12px', color: '#666' }}>{output.destinationGear}</div>
                        )}
                      </td>
                      <td style={{ padding: '10px', verticalAlign: 'middle' }}>{output.notes || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#666' }}>No outputs defined.</p>
        )}
      </div>
      
      {/* Notes */}
      {info.notes && (
        <div style={{ marginBottom: '30px', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            <Music style={{ height: '18px', width: '18px', display: 'inline', marginRight: '8px' }} />
            Additional Notes
          </h3>
          <p>{info.notes}</p>
        </div>
      )}
      
      {/* Footer */}
      <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>SoundDocs</span> | Professional Audio Documentation
          </div>
          <div>
            Generated on {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
});

PrintPatchSheetExport.displayName = 'PrintPatchSheetExport';

export default PrintPatchSheetExport;
