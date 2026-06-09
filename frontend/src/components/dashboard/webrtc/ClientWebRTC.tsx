import { useEffect, useRef, useCallback } from 'react';

interface ClientWebRTCProps {
  socket: any;
  cameraStream?: MediaStream;
  screenStream?: MediaStream;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

// FUTURE: Replace with Mediasoup SFU when scaling
export const useClientWebRTC = ({
  socket,
  cameraStream,
  screenStream,
  onConnected,
  onDisconnected,
}: ClientWebRTCProps) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const hostSocketIdRef = useRef<string | null>(null);
  const isConnectedRef = useRef(false);

  // Keep latest props in refs to avoid rebuilding callbacks
  const cameraStreamRef = useRef(cameraStream);
  const screenStreamRef = useRef(screenStream);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);

  useEffect(() => {
    cameraStreamRef.current = cameraStream;
    screenStreamRef.current = screenStream;
    onConnectedRef.current = onConnected;
    onDisconnectedRef.current = onDisconnected;
  }, [cameraStream, screenStream, onConnected, onDisconnected]);

  const triggerNegotiation = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    
    try {
      console.log('[WebRTC Client] triggerNegotiation: current signalingState is:', pc.signalingState);
      if (pc.signalingState !== 'stable') {
        console.log('[WebRTC Client] signalingState is not stable, deferring renegotiation');
        return;
      }
      
      console.log('[WebRTC Client] Creating local renegotiation offer');
      const offer = await pc.createOffer();
      console.log('[WebRTC Client] Setting local description (offer)');
      await pc.setLocalDescription(offer);
      
      if (socket && hostSocketIdRef.current) {
        console.log('[WebRTC Client] Emitting offer to host:', hostSocketIdRef.current);
        socket.emit('offer', {
          targetSocketId: hostSocketIdRef.current,
          offer,
        });
      } else {
        console.warn('[WebRTC Client] Cannot emit offer: socket or hostSocketId is missing');
      }
    } catch (err) {
      console.error('[WebRTC Client] Error in triggerNegotiation:', err);
    }
  }, [socket]);

  const updateTransceivers = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    
    const transceivers = pc.getTransceivers();
    if (transceivers.length < 3) {
      console.warn('[WebRTC Client] Transceivers not fully initialized yet:', transceivers.length);
      return;
    }
    
    const currentCameraStream = cameraStreamRef.current;
    const currentScreenStream = screenStreamRef.current;
    
    console.log('[WebRTC Client] Updating transceivers. cameraStream:', !!currentCameraStream, 'screenStream:', !!currentScreenStream);
    let changed = false;
    
    // Index 0: Camera Video
    const cameraVideoTrack = currentCameraStream ? currentCameraStream.getVideoTracks()[0] : null;
    const cameraVideoTransceiver = transceivers[0];
    if (cameraVideoTransceiver) {
      if (cameraVideoTransceiver.sender.track !== cameraVideoTrack) {
        console.log('[WebRTC Client] Camera video track changed. Replacing track');
        await cameraVideoTransceiver.sender.replaceTrack(cameraVideoTrack);
        changed = true;
      }
      const dir: RTCRtpTransceiverDirection = cameraVideoTrack ? 'sendonly' : 'inactive';
      if (cameraVideoTransceiver.direction !== dir) {
        cameraVideoTransceiver.direction = dir;
        changed = true;
      }
    }
    
    // Index 1: Camera Audio
    const cameraAudioTrack = currentCameraStream ? currentCameraStream.getAudioTracks()[0] : null;
    const cameraAudioTransceiver = transceivers[1];
    if (cameraAudioTransceiver) {
      if (cameraAudioTransceiver.sender.track !== cameraAudioTrack) {
        console.log('[WebRTC Client] Camera audio track changed. Replacing track');
        await cameraAudioTransceiver.sender.replaceTrack(cameraAudioTrack);
        changed = true;
      }
      const dir: RTCRtpTransceiverDirection = cameraAudioTrack ? 'sendonly' : 'inactive';
      if (cameraAudioTransceiver.direction !== dir) {
        cameraAudioTransceiver.direction = dir;
        changed = true;
      }
    }
    
    // Index 2: Screen Video
    const screenVideoTrack = currentScreenStream ? currentScreenStream.getVideoTracks()[0] : null;
    const screenVideoTransceiver = transceivers[2];
    if (screenVideoTransceiver) {
      if (screenVideoTransceiver.sender.track !== screenVideoTrack) {
        console.log('[WebRTC Client] Screen video track changed. Replacing track');
        await screenVideoTransceiver.sender.replaceTrack(screenVideoTrack);
        changed = true;
      }
      const dir: RTCRtpTransceiverDirection = screenVideoTrack ? 'sendonly' : 'inactive';
      if (screenVideoTransceiver.direction !== dir) {
        screenVideoTransceiver.direction = dir;
        changed = true;
      }
    }
    
    if (changed && pc.signalingState === 'stable') {
      console.log('[WebRTC Client] Transceivers changed on stable connection, triggering negotiation');
      await triggerNegotiation();
    }
  }, [triggerNegotiation]);

  const setupPeerConnection = useCallback(() => {
    console.log('[WebRTC Client] Setting up RTCPeerConnection');
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
    
    const pc = new RTCPeerConnection(configuration);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && hostSocketIdRef.current) {
        console.log('[WebRTC Client] Sending client ICE candidate to host:', hostSocketIdRef.current, event.candidate.candidate);
        socket.emit('ice-candidate', {
          targetSocketId: hostSocketIdRef.current,
          candidate: event.candidate,
        });
      } else if (event.candidate) {
        console.warn('[WebRTC Client] Generated ICE candidate but hostSocketId is missing');
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC Client] Connection state change:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        isConnectedRef.current = true;
        onConnectedRef.current?.();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        isConnectedRef.current = false;
        onDisconnectedRef.current?.();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC Client] ICE connection state change:', pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log('[WebRTC Client] Signaling state change:', pc.signalingState);
    };
    
    pc.onnegotiationneeded = () => {
      console.log('[WebRTC Client] onnegotiationneeded event fired');
      triggerNegotiation();
    };
    
    peerConnectionRef.current = pc;
    return pc;
  }, [socket, triggerNegotiation]);

  useEffect(() => {
    if (!socket) return;
    
    setupPeerConnection();
    
    const handleOfferFromHost = async (data: any) => {
      const { offer, from } = data;
      console.log('[WebRTC Client] Received offer from host:', from);
      hostSocketIdRef.current = from;
      
      let pc = peerConnectionRef.current;
      if (!pc || pc.connectionState === 'closed') {
        pc = setupPeerConnection();
      }
      
      console.log('[WebRTC Client] Setting remote description (offer)');
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      console.log('[WebRTC Client] Updating transceivers with active tracks');
      await updateTransceivers();
      
      console.log('[WebRTC Client] Creating local answer');
      const answer = await pc.createAnswer();
      console.log('[WebRTC Client] Setting local description (answer)');
      await pc.setLocalDescription(answer);
      
      console.log('[WebRTC Client] Sending answer to host:', from);
      socket.emit('answer', {
        targetSocketId: from,
        answer,
      });
    };

    const handleAnswerFromHost = async (data: any) => {
      const { answer } = data;
      console.log('[WebRTC Client] Received answer from host');
      const pc = peerConnectionRef.current;
      if (pc) {
        console.log('[WebRTC Client] Setting remote description (answer)');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };
    
    const handleIceCandidate = async (data: any) => {
      const { candidate, from } = data;
      console.log('[WebRTC Client] Received remote ICE candidate from host:', from);
      if (from) {
        hostSocketIdRef.current = from;
      }
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };
    
    socket.on('offer', handleOfferFromHost);
    socket.on('answer', handleAnswerFromHost);
    socket.on('ice-candidate', handleIceCandidate);
    
    return () => {
      console.log('[WebRTC Client] Cleaning up socket event listeners and peer connection');
      socket.off('offer', handleOfferFromHost);
      socket.off('answer', handleAnswerFromHost);
      socket.off('ice-candidate', handleIceCandidate);
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [socket, setupPeerConnection, updateTransceivers]);
  
  // Update transceivers when streams change
  useEffect(() => {
    const pc = peerConnectionRef.current;
    if (pc) {
      updateTransceivers();
    }
  }, [cameraStream, screenStream, updateTransceivers]);
  
  return {
    isConnected: isConnectedRef.current,
  };
};