import React, { useEffect, useRef } from 'react';
import { X, Flag } from 'lucide-react';
import { ClientVideo } from './ClientVideo';
import { useScreenshot } from '../../hooks/useScreenshot';
import { Button } from '../common/Button';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  onFlag: (cameraScreenshot?: string, screenScreenshot?: string) => void;
  clientName: string;
  cameraStream?: MediaStream;
  screenStream?: MediaStream;
  hasAudio?: boolean;
}

export const FocusMode: React.FC<FocusModeProps> = ({
  isOpen,
  onClose,
  onFlag,
  clientName,
  cameraStream,
  screenStream,
  hasAudio,
}) => {
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const { takeScreenshotBase64 } = useScreenshot();

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

  const handleFlagClick = () => {
    const cameraScreenshot = cameraVideoRef.current && cameraStream 
      ? takeScreenshotBase64(cameraVideoRef.current) 
      : null;
      
    const screenScreenshot = screenVideoRef.current && screenStream 
      ? takeScreenshotBase64(screenVideoRef.current) 
      : null;
    
    onFlag(cameraScreenshot || undefined, screenScreenshot || undefined);
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">{clientName} - Focus Mode</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleFlagClick}
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            <Flag size={16} className="mr-2" />
            Flag User
          </Button>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl w-full">
          <ClientVideo
            ref={cameraVideoRef}
            stream={cameraStream || null}
            type="camera"
            label="Camera"
            isAudioEnabled={hasAudio}
          />
          <ClientVideo
            ref={screenVideoRef}
            stream={screenStream || null}
            type="screen"
            label="Screen Share"
          />
        </div>
      </div>
    </div>
  );
};