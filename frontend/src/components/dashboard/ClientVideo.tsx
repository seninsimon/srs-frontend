import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Camera, Monitor, Mic } from 'lucide-react';

interface ClientVideoProps {
  stream: MediaStream | null;
  type: 'camera' | 'screen';
  label: string;
  isAudioEnabled?: boolean;
}

export const ClientVideo = forwardRef<HTMLVideoElement, ClientVideoProps>(({
  stream,
  type,
  label,
  isAudioEnabled = false,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useImperativeHandle(ref, () => videoRef.current!);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  useEffect(() => {
    if (audioRef.current && stream && isAudioEnabled) {
      audioRef.current.srcObject = stream;
    }
  }, [stream, isAudioEnabled]);
  
  const Icon = type === 'camera' ? Camera : Monitor;
  
  return (
    <div className="video-container aspect-video">
      {stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="video-element"
          />
          {isAudioEnabled && type === 'camera' && (
            <audio ref={audioRef} autoPlay />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full bg-gray-900">
          <Icon size={48} className="text-gray-600" />
          <p className="text-gray-500 text-sm mt-2">No {label} feed</p>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
        <Icon size={12} />
        <span>{label}</span>
        {isAudioEnabled && type === 'camera' && (
          <Mic size={10} className="text-green-400 ml-1" />
        )}
      </div>
    </div>
  );
});

ClientVideo.displayName = 'ClientVideo';