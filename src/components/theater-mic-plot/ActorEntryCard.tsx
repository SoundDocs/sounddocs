import React, { useState, useRef, DragEvent } from 'react';
    import { Trash2, User, Image as ImageIcon, AlertCircle, Loader as LoaderIcon, Palette, Mic, Tv, Users as CharacterIcon, Scissors, Shirt } from 'lucide-react';

    export interface ActorEntry {
      id: string;
      photo_url: string | null; // Base64 string
      actor_name: string;
      character_names: string;
      element_channel_number: string;
      element_color: string;
      transmitter_location: string;
      element_location: string;
      backup_element: string;
      scene_numbers: string;
      costume_notes: string;
      wig_hair_notes: string;
    }

    interface ActorEntryCardProps {
      entry: ActorEntry;
      onUpdate: (id: string, field: keyof ActorEntry, value: any) => void;
      onDelete: (id: string) => void;
    }

    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    const ActorEntryCard: React.FC<ActorEntryCardProps> = ({ entry, onUpdate, onDelete }) => {
      const [processingPhoto, setProcessingPhoto] = useState(false);
      const [photoError, setPhotoError] = useState<string | null>(null);
      const [isDraggingOver, setIsDraggingOver] = useState(false);
      const fileInputRef = useRef<HTMLInputElement>(null);

      const handleInputChange = (field: keyof ActorEntry, value: any) => {
        onUpdate(entry.id, field, value);
      };

      const processFile = (file: File | null) => {
        if (!file) return;

        setPhotoError(null);

        if (file.size > MAX_FILE_SIZE_BYTES) {
          setPhotoError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        setProcessingPhoto(true);
        try {
          const reader = new FileReader();
          reader.onloadend = () => {
            onUpdate(entry.id, 'photo_url', reader.result as string);
            setProcessingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
          };
          reader.onerror = () => {
            setPhotoError('Failed to read file.');
            setProcessingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
          };
          reader.readAsDataURL(file);
        } catch (error) {
          setPhotoError('Failed to process photo.');
          setProcessingPhoto(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }

      const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0] || null);
      };
      
      const triggerFileInput = () => fileInputRef.current?.click();

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
                  <img src={entry.photo_url} alt={entry.actor_name || 'Actor'} className="w-full h-full object-cover" />
                ) : processingPhoto ? (
                  <LoaderIcon className="w-16 h-16 text-indigo-400 animate-spin" />
                ) : isDraggingOver ? (
                   <ImageIcon className="w-16 h-16 text-indigo-400" />
                ) : (
                  <User className="w-16 h-16 text-gray-500" />
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handlePhotoSelected} accept="image/*" className="hidden" disabled={processingPhoto} />
              <button onClick={triggerFileInput} disabled={processingPhoto} className="w-full text-sm bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-md flex items-center justify-center transition-colors disabled:opacity-50">
                {processingPhoto ? 'Processing...' : entry.photo_url ? 'Change Photo' : 'Upload Photo'}
                {!processingPhoto && <ImageIcon className="ml-2 h-4 w-4" />}
              </button>
              {photoError && <p className="text-red-400 text-xs mt-2 text-center flex items-center"><AlertCircle size={14} className="mr-1 flex-shrink-0"/> {photoError}</p>}
               {!processingPhoto && !entry.photo_url && <p className="text-gray-400 text-xs mt-2 text-center">Drag & drop or click to upload</p>}
            </div>

            {/* Details Section */}
            <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`actor_name_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1 flex items-center"><User size={14} className="mr-1 text-gray-400"/>Actor Name</label>
                <input type="text" id={`actor_name_${entry.id}`} value={entry.actor_name} onChange={(e) => handleInputChange('actor_name', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="e.g., John Smith"/>
              </div>
              <div>
                <label htmlFor={`character_names_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1 flex items-center"><CharacterIcon size={14} className="mr-1 text-gray-400"/>Character Name(s)</label>
                <input type="text" id={`character_names_${entry.id}`} value={entry.character_names} onChange={(e) => handleInputChange('character_names', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="e.g., Hamlet, Ghost"/>
              </div>
              <div>
                <label htmlFor={`element_channel_number_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1 flex items-center"><Mic size={14} className="mr-1 text-gray-400"/>Element/Channel No.</label>
                <input type="text" id={`element_channel_number_${entry.id}`} value={entry.element_channel_number} onChange={(e) => handleInputChange('element_channel_number', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="e.g., RF 01 / Ch 12"/>
              </div>
              <div>
                <label htmlFor={`element_color_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1 flex items-center"><Palette size={14} className="mr-1 text-gray-400"/>Element Color</label>
                <input type="text" id={`element_color_${entry.id}`} value={entry.element_color} onChange={(e) => handleInputChange('element_color', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="e.g., Red"/>
              </div>
              <div>
                <label htmlFor={`transmitter_location_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Transmitter Location</label>
                <input type="text" id={`transmitter_location_${entry.id}`} value={entry.transmitter_location} onChange={(e) => handleInputChange('transmitter_location', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="e.g., Waist pack R, In wig"/>
              </div>
              <div>
                <label htmlFor={`element_location_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Element Location</label>
                <input type="text" id={`element_location_${entry.id}`} value={entry.element_location} onChange={(e) => handleInputChange('element_location', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="e.g., Forehead, Cheek L"/>
              </div>
              <div>
                <label htmlFor={`backup_element_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1">Backup Element</label>
                <input type="text" id={`backup_element_${entry.id}`} value={entry.backup_element} onChange={(e) => handleInputChange('backup_element', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="e.g., RF 02 / Ch 13"/>
              </div>
              <div>
                <label htmlFor={`scene_numbers_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1 flex items-center"><Tv size={14} className="mr-1 text-gray-400"/>Scene Numbers</label>
                <input type="text" id={`scene_numbers_${entry.id}`} value={entry.scene_numbers} onChange={(e) => handleInputChange('scene_numbers', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="e.g., 1, 3, 5-7"/>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`costume_notes_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1 flex items-center"><Shirt size={14} className="mr-1 text-gray-400"/>Costume Notes</label>
                <textarea id={`costume_notes_${entry.id}`} value={entry.costume_notes} onChange={(e) => handleInputChange('costume_notes', e.target.value)} rows={2} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="e.g., Belt available, quick change after Sc 3"/>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`wig_hair_notes_${entry.id}`} className="block text-sm font-medium text-gray-300 mb-1 flex items-center"><Scissors size={14} className="mr-1 text-gray-400"/>Wig/Hair Notes</label>
                <textarea id={`wig_hair_notes_${entry.id}`} value={entry.wig_hair_notes} onChange={(e) => handleInputChange('wig_hair_notes', e.target.value)} rows={2} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="e.g., Mic in wig, careful with hairspray"/>
              </div>
              <div className="sm:col-span-2 flex items-center justify-end">
                <button onClick={() => onDelete(entry.id)} className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-red-500/10 flex items-center text-sm" title="Delete Actor Entry">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    export default ActorEntryCard;
