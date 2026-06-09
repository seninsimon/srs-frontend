import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ClientVideo } from './ClientVideo';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  cameraStream?: MediaStream;
  screenStream?: MediaStream;
  hasAudio?: boolean;
}

export const FocusMode: React.FC<FocusModeProps> = ({
  isOpen,
  onClose,
  clientName,
  cameraStream,
  screenStream,
  hasAudio,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <h2 className="text-xl font-semibold text-white">{clientName} - Focus Mode</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="grid grid-cols-2 gap-4 max-w-6xl w-full">
          <ClientVideo
            stream={cameraStream || null}
            type="camera"
            label="Camera"
            isAudioEnabled={hasAudio}
          />
          <ClientVideo
            stream={screenStream || null}
            type="screen"
            label="Screen Share"
          />
        </div>
      </div>
    </div>
  );
};