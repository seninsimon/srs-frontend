import React, { useRef, useEffect } from 'react';
import { Maximize2, Camera, Monitor, Mic, Flag } from 'lucide-react';
import { useScreenshot } from '../../hooks/useScreenshot';

interface ClientCardProps {
  clientId: string;
  displayName: string;
  cameraStream?: MediaStream;
  screenStream?: MediaStream;
  hasAudio?: boolean;
  onExpand: () => void;
  onFlag: (screenshot?: string) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  displayName,
  cameraStream,
  screenStream,
  hasAudio,
  onExpand,
  onFlag,
}) => {
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const { takeScreenshotBase64 } = useScreenshot();
  
  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);
  
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const handleFlagClick = () => {
    // Prefer screen stream for screenshot, fallback to camera
    let screenshot: string | null = null;
    
    if (screenVideoRef.current && screenStream) {
      screenshot = takeScreenshotBase64(screenVideoRef.current);
    } else if (cameraVideoRef.current && cameraStream) {
      screenshot = takeScreenshotBase64(cameraVideoRef.current);
    }
    
    onFlag(screenshot || undefined);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{displayName}</h3>
          {hasAudio && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Mic size={12} />
              <span>Audio active</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFlagClick}
            className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
            title="Create flag"
          >
            <Flag size={16} />
          </button>
          <button
            onClick={onExpand}
            className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
            title="Expand view"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 p-2">
        <div className="video-container aspect-video">
          {cameraStream ? (
            <video
              ref={cameraVideoRef}
              autoPlay
              playsInline
              className="video-element"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <Camera size={32} className="text-gray-600" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
            Camera
          </div>
        </div>
        
        <div className="video-container aspect-video">
          {screenStream ? (
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              className="video-element"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <Monitor size={32} className="text-gray-600" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
            Screen
          </div>
        </div>
      </div>
    </div>
  );
};