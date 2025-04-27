import React from 'react';
import { ArrowLeft, MonitorSmartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileScreenWarningProps {
  title: string;
  description?: string;
  continueAnyway?: boolean;
  returnPath?: string; // Custom return path
  editorType?: 'patch' | 'stage'; // Identify whether it's for patch sheet or stage plot
}

const MobileScreenWarning: React.FC<MobileScreenWarningProps> = ({ 
  title,
  description = "This feature is optimized for desktop devices. For the best experience, consider using a larger screen.",
  continueAnyway = false,
  returnPath = '/dashboard',
  editorType
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 z-50 text-center mobile-warning">
      <div className="p-4 rounded-full bg-indigo-500/20 mb-6">
        <MonitorSmartphone className="h-12 w-12 text-indigo-400" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
      <p className="text-gray-300 mb-8 max-w-sm">{description}</p>
      
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate(returnPath)}
          className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-md font-medium transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Return to Dashboard
        </button>
        
        {/* Only show Continue Anyway for patch sheet editor */}
        {continueAnyway && editorType === 'patch' && (
          <button
            onClick={() => {
              // Close the modal and continue to the page
              const warningEl = document.querySelector('.mobile-warning');
              if (warningEl) {
                warningEl.classList.add('hidden');
              }
            }}
            className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-5 py-3 rounded-md font-medium transition-all duration-200"
          >
            Continue Anyway
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileScreenWarning;