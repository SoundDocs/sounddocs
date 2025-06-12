import React, { useState, useRef, DragEvent } from 'react';
    import { Trash2, User, Image as ImageIcon, AlertCircle, Loader as LoaderIcon } from 'lucide-react';

    export interface PresenterEntry {
      id: string;
      presenter_name: string;
      session_segment: string;
      mic_type: 'lapel' | 'handheld' | 'headset' | 'podium' | '';
      element_channel_number: string;
      tx_pack_location: string;
      backup_element: string;
      sound_check_time: string; // HH:MM format
      notes: string;
      presentation_type: 'keynote' | 'panel' | 'q&a' | 'other' | '';
      remote_participation: boolean;
      photo_url: string | null; // Will store Base64 string
    }

    interface PresenterEntryCardProps {
      entry: PresenterEntry;
      onUpdate: (id: string, field: keyof PresenterEntry, value: any) => void;
      onDelete: (id: string) => void;
      micPlotId: string; 
      userId: string; 
    }

    const MIC_TYPES = [
      { value: '', label: 'Select Mic Type' },
      { value: 'lapel', label: 'Lapel/Lavalier' },
      { value: 'handheld', label: 'Handheld' },
      { value: 'headset', label: 'Headset' },
      { value: 'podium', label: 'Podium Mic' },
    ];

    const PRESENTATION_TYPES = [
      { value: '', label: 'Select Presentation Type' },
      { value: 'keynote', label: 'Keynote' },
      { value: 'panel', label: 'Panel Discussion' },
      { value: 'q&a', label: 'Q&A Session' },
      { value: 'other', label: 'Other' },
    ];

    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    const PresenterEntryCard: React.FC<PresenterEntryCardProps> = ({ entry, onUpdate, onDelete }) => {
      const [processingPhoto, setProcessingPhoto] = useState(false);
      const [photoError, setPhotoError] = useState<string | null>(null);
      const [isDraggingOver, setIsDraggingOver] = useState(false);
      const fileInputRef = useRef<HTMLInputElement>(null);

      const handleInputChange = (field: keyof PresenterEntry, value: any) => {
        onUpdate(entry.id, field, value);
      };

      const processFile = (file: File | null) => {
        if (!file) return;
        
        setPhotoError(null); 

        if (file.size > MAX_FILE_SIZE_BYTES) {
          setPhotoError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
          if(fileInputRef.current) fileInputRef.current.value = ""; 
          return;
        }

        setProcessingPhoto(true);
        try {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            onUpdate(entry.id, 'photo_url', base64String);
            setProcessingPhoto(false);
            if(fileInputRef.current) fileInputRef.current.value = ""; 
          };
          reader.onerror = (error) => {
            console.error('Error reading file:', error);
            setPhotoError('Failed to read file.');
            setProcessingPhoto(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Error processing photo:', error);
          setPhotoError('Failed to process photo.');
          setProcessingPhoto(false);
          if(fileInputRef.current) fileInputRef.current.value = "";
        }
      };

      const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0] || null);
      };
      
      const triggerFileInput = () => {
        fileInputRef.current?.click();
      };

      const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!processingPhoto) {
          setIsDraggingOver(true);
        }
      };

      const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggingOver(false);
      };

      const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDraggingOver(false);
        if (processingPhoto) return;

        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
          if (files[0].type.startsWith('image/')) {
            processFile(files[0]);
          } else {
            setPhotoError('Invalid file type. Please upload an image.');
          }
        }
      };

      return (
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo Upload Section */}
            <div className="md:w-1/3 flex flex-col items-center">
              <div
                className={`w-48 h-48 bg-gray-700 rounded-lg flex items-center justify-center mb-3 overflow-hidden cursor-pointer hover:bg-gray-600 transition-all duration-200 ease-in-out
                  ${isDraggingOver ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-gray-800 scale-105 bg-gray-600' : ''}
                  ${photoError ? 'ring-2 ring-red-500' : ''}
                `}
                onClick={triggerFileInput}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                title="Click or drag & drop to upload photo"
              >
                {entry.photo_url ? (
                  <img src={entry.photo_url} alt={entry.presenter_name || 'Presenter'} className="w-full h-full object-cover" />
                ) : processingPhoto ? (
                  <LoaderIcon className="w-16 h-16 text-indigo-400 animate-spin" />
                ) : isDraggingOver ? (
                   <ImageIcon className="w-16 h-16 text-indigo-400" />
                ) : (
                  <User className="w-16 h-16 text-gray-500" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelected}
                accept="image/*"
                className="hidden"
                disabled={processingPhoto}
              />
              <button
                onClick={triggerFileInput}
                disabled={processingPhoto}
                className="w-full text-sm bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-md flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {processingPhoto ? 'Processing...' : entry.photo_url ? 'Change Photo' : 'Upload Photo'}
                {!processingPhoto && <ImageIcon className="ml-2 h-4 w-4" />}
              </button>
              {photoError && (
                <p className="text-red-400 text-xs mt-2 text-center flex items-center">
                  <AlertCircle size={14} className="mr-1 flex-shrink-0"/> {photoError}
                </p>
              )}
              {!processingPhoto && !entry.photo_url && <p className="text-gray-400 text-xs mt-2 text-center">Drag & drop or click to upload</p>}
            </div>

            {/* Details Section */}
            <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`presenter_name_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Presenter/Speaker Name</label>
                <input
                  type="text"
                  id={`presenter_name_${entry.id}`}
                  value={entry.presenter_name}
                  onChange={(e) => handleInputChange('presenter_name', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="e.g., Jane Doe"
                />
              </div>
              <div>
                <label htmlFor={`session_segment_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Session/Segment</label>
                <input
                  type="text"
                  id={`session_segment_${entry.id}`}
                  value={entry.session_segment}
                  onChange={(e) => handleInputChange('session_segment', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="e.g., Opening Keynote"
                />
              </div>
              <div>
                <label htmlFor={`mic_type_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Mic Type</label>
                <select
                  id={`mic_type_${entry.id}`}
                  value={entry.mic_type}
                  onChange={(e) => handleInputChange('mic_type', e.target.value as PresenterEntry['mic_type'])}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  {MIC_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={`element_channel_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Element/Channel Number</label>
                <input
                  type="text"
                  id={`element_channel_${entry.id}`}
                  value={entry.element_channel_number}
                  onChange={(e) => handleInputChange('element_channel_number', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="e.g., RF 01 / Ch 12"
                />
              </div>
              <div>
                <label htmlFor={`tx_pack_location_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Transmitter Pack Location</label>
                <input
                  type="text"
                  id={`tx_pack_location_${entry.id}`}
                  value={entry.tx_pack_location}
                  onChange={(e) => handleInputChange('tx_pack_location', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="e.g., Back Belt Left"
                />
              </div>
              <div>
                <label htmlFor={`backup_element_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Backup Element</label>
                <input
                  type="text"
                  id={`backup_element_${entry.id}`}
                  value={entry.backup_element}
                  onChange={(e) => handleInputChange('backup_element', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="e.g., RF 02 / Ch 13"
                />
              </div>
              <div>
                <label htmlFor={`sound_check_time_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Sound Check Time</label>
                <input
                  type="time"
                  id={`sound_check_time_${entry.id}`}
                  value={entry.sound_check_time}
                  onChange={(e) => handleInputChange('sound_check_time', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label htmlFor={`presentation_type_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Presentation Type</label>
                <select
                  id={`presentation_type_${entry.id}`}
                  value={entry.presentation_type}
                  onChange={(e) => handleInputChange('presentation_type', e.target.value as PresenterEntry['presentation_type'])}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  {PRESENTATION_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`notes_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Notes/Special Requirements</label>
                <textarea
                  id={`notes_${entry.id}`}
                  value={entry.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="e.g., Needs water on stage, specific mic stand"
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id={`remote_participation_${entry.id}`}
                    type="checkbox"
                    checked={entry.remote_participation}
                    onChange={(e) => handleInputChange('remote_participation', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-500 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor={`remote_participation_${entry.id}`} className="ml-2 block text-sm text-gray-300">
                    Remote Participation
                  </label>
                </div>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-red-500/10 flex items-center text-sm"
                  title="Delete Presenter"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    export default PresenterEntryCard;
