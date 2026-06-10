import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Video, Camera, Monitor, Mic, MicOff, CameraOff, MonitorOff } from 'lucide-react';
import { sessionService } from '../services/sessionService';
import { useSocket } from '../hooks/useSocket';
import { useClientWebRTC } from '../components/dashboard/webrtc/ClientWebRTC';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const JoinSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get('token');
  
  const [displayName, setDisplayName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, cameraEnabled]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, screenEnabled]);
  
  const { data: sessionInfo, isLoading: sessionLoading, isError } = useQuery({
    queryKey: ['verify-join', sessionId, token],
    queryFn: () => sessionService.verifyJoin(sessionId!, token!),
    enabled: !!sessionId && !!token,
    retry: false,
  });

  // Handle error via useEffect instead of onError (removed in React Query v5)
  useEffect(() => {
    if (isError) {
      toast.error('Invalid or expired join link');
      navigate('/');
    }
  }, [isError, navigate]);
  
  const { socket, isConnected } = useSocket({
    sessionId: sessionId!,
    role: 'client',
    displayName: displayName || 'Anonymous',
    enabled: isJoined
  });
  
  useClientWebRTC({
    socket,
    cameraStream: (cameraEnabled && cameraStream) ? cameraStream : undefined,
    screenStream: (screenEnabled && screenStream) ? screenStream : undefined,
    onConnected: () => {
      toast.success('Connected to host');
    },
    onDisconnected: () => {
      toast.error('Disconnected from host');
    },
  });
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micEnabled });
      setCameraStream(stream);
      setCameraEnabled(true);
    } catch (_error) {
      toast.error('Could not access camera');
    }
  };
  
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraEnabled(false);
  };
  
  const toggleCamera = () => {
    if (cameraEnabled) {
      stopCamera();
    } else {
      startCamera();
    }
  };
  
  const toggleMic = async () => {
    if (micEnabled) {
      if (cameraStream) {
        cameraStream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
      setMicEnabled(false);
    } else {
      if (cameraStream) {
        cameraStream.getAudioTracks().forEach(track => {
          track.enabled = true;
        });
      } else {
        // Request mic without camera
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (cameraStream) {
            const audioTrack = stream.getAudioTracks()[0];
            (cameraStream as MediaStream).addTrack(audioTrack);
          }
        } catch (_error) {
          toast.error('Could not access microphone');
          return;
        }
      }
      setMicEnabled(true);
    }
  };
  
  const toggleScreenShare = async () => {
    if (screenEnabled) {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setScreenEnabled(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        stream.getVideoTracks()[0].onended = () => {
          setScreenEnabled(false);
          setScreenStream(null);
        };
        setScreenStream(stream);
        setScreenEnabled(true);
      } catch (_error) {
        toast.error('Screen share cancelled or failed');
      }
    }
  };
  
  const handleJoin = () => {
    if (!displayName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setIsJoined(true);
  };
  
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [screenStream]);
  
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!sessionInfo) {
    return null;
  }
  
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Video size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Join Session</h1>
            <p className="text-gray-600 mt-2">{sessionInfo.title}</p>
            {sessionInfo.description && (
              <p className="text-sm text-gray-500 mt-1">{sessionInfo.description}</p>
            )}
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <Button onClick={handleJoin} className="w-full">
              Join Session
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">{sessionInfo.title}</h1>
            <p className="text-sm text-gray-400">Connected as {displayName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
              {cameraEnabled && cameraStream ? (
                <video
                  ref={cameraVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-950">
                  <Camera size={48} className="text-gray-600 mb-2" />
                  <p className="text-gray-500 text-sm">Camera Off</p>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                Camera Feed
              </div>
            </div>

            <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
              {screenEnabled && screenStream ? (
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-950">
                  <Monitor size={48} className="text-gray-600 mb-2" />
                  <p className="text-gray-500 text-sm">Screen Share Off</p>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                Screen Share Feed
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Controls</h3>
            
            <div className="space-y-3">
              <Button
                variant={cameraEnabled ? 'primary' : 'outline'}
                onClick={toggleCamera}
                className="w-full justify-center"
              >
                {cameraEnabled ? <CameraOff size={18} className="mr-2" /> : <Camera size={18} className="mr-2" />}
                {cameraEnabled ? 'Stop Camera' : 'Start Camera'}
              </Button>
              
              <Button
                variant={micEnabled ? 'primary' : 'outline'}
                onClick={toggleMic}
                className="w-full justify-center"
              >
                {micEnabled ? <MicOff size={18} className="mr-2" /> : <Mic size={18} className="mr-2" />}
                {micEnabled ? 'Mute Mic' : 'Unmute Mic'}
              </Button>
              
              <Button
                variant={screenEnabled ? 'primary' : 'outline'}
                onClick={toggleScreenShare}
                className="w-full justify-center"
              >
                {screenEnabled ? <MonitorOff size={18} className="mr-2" /> : <Monitor size={18} className="mr-2" />}
                {screenEnabled ? 'Stop Sharing' : 'Share Screen'}
              </Button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                Your camera, microphone, and screen are being monitored by the host.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinSession;