import { useEffect, useRef, useCallback } from 'react';
import { useWebRTCPeer } from '../../../hooks/useWebRTC';

interface ClientConnection {
  socketId: string;
  displayName: string;
  cameraStream?: MediaStream;
  screenStream?: MediaStream;
}

interface HostWebRTCProps {
  socket: any;
  clients: ClientConnection[];
  onStreamAdded: (clientId: string, stream: MediaStream, type: 'camera' | 'screen') => void;
  onStreamRemoved: (clientId: string, type: 'camera' | 'screen') => void;
}

export const useHostWebRTC = ({
  socket,
  clients,
  onStreamAdded,
  onStreamRemoved,
}: HostWebRTCProps) => {
  const cameraStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const screenStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  const handleTrack = useCallback((event: RTCTrackEvent, peerId: string, pc: RTCPeerConnection) => {
    console.log(`[useHostWebRTC] handleTrack for peer ${peerId}, track kind ${event.track.kind}, id: ${event.track.id}`);
    
    const transceivers = pc.getTransceivers();
    const index = transceivers.findIndex(t => t.receiver === event.receiver);
    console.log(`[useHostWebRTC] Track matched transceiver index: ${index}`);
    
    if (index === 0) {
      // Camera Video
      let stream = cameraStreamsRef.current.get(peerId);
      if (!stream) {
        stream = new MediaStream();
        cameraStreamsRef.current.set(peerId, stream);
      }
      stream.getVideoTracks().forEach(t => stream!.removeTrack(t));
      stream.addTrack(event.track);
      onStreamAdded(peerId, stream, 'camera');
    } else if (index === 1) {
      // Camera Audio
      let stream = cameraStreamsRef.current.get(peerId);
      if (!stream) {
        stream = new MediaStream();
        cameraStreamsRef.current.set(peerId, stream);
      }
      stream.getAudioTracks().forEach(t => stream!.removeTrack(t));
      stream.addTrack(event.track);
      onStreamAdded(peerId, stream, 'camera');
    } else if (index === 2) {
      // Screen Video
      let stream = screenStreamsRef.current.get(peerId);
      if (!stream) {
        stream = new MediaStream();
        screenStreamsRef.current.set(peerId, stream);
      }
      stream.getVideoTracks().forEach(t => stream!.removeTrack(t));
      stream.addTrack(event.track);
      onStreamAdded(peerId, stream, 'screen');
    }
  }, [onStreamAdded]);

  const handleIceCandidate = useCallback((candidate: RTCIceCandidate, peerId: string) => {
    if (socket) {
      console.log(`[useHostWebRTC] Sending host ICE candidate to client ${peerId}`);
      socket.emit('ice-candidate', {
        targetSocketId: peerId,
        candidate,
      });
    }
  }, [socket]);

  const handleIceConnectionStateChange = useCallback((state: RTCIceConnectionState, peerId: string) => {
    console.log(`[useHostWebRTC] ICE connection state changed to ${state} for peer ${peerId}`);
  }, []);

  const { 
    createPeerConnection, 
    getPeerConnection, 
    createOffer, 
    handleOffer: handleOfferFromPeer, 
    handleAnswer: handleAnswerFromPeer, 
    addIceCandidate, 
    closePeerConnection 
  } = useWebRTCPeer({
    onTrack: handleTrack,
    onIceCandidate: handleIceCandidate,
    onIceConnectionStateChange: handleIceConnectionStateChange,
  });

  const checkTransceiverDirections = useCallback((peerId: string) => {
    const pc = getPeerConnection(peerId);
    if (!pc) return;
    
    const transceivers = pc.getTransceivers();
    console.log(`[useHostWebRTC] Checking transceiver directions for peer ${peerId}:`, 
      transceivers.map((t, i) => `index ${i}: direction=${t.direction}, currentDirection=${t.currentDirection}`)
    );
    
    // Index 0: Camera Video (Index 1 is Audio, which belongs to camera stream too)
    const cameraVideoTransceiver = transceivers[0];
    if (cameraVideoTransceiver && cameraVideoTransceiver.currentDirection === 'inactive') {
      console.log(`[useHostWebRTC] Camera video transceiver became inactive for peer ${peerId}`);
      onStreamRemoved(peerId, 'camera');
    }
    
    // Index 2: Screen Video
    const screenVideoTransceiver = transceivers[2];
    if (screenVideoTransceiver && screenVideoTransceiver.currentDirection === 'inactive') {
      console.log(`[useHostWebRTC] Screen video transceiver became inactive for peer ${peerId}`);
      onStreamRemoved(peerId, 'screen');
    }
  }, [getPeerConnection, onStreamRemoved]);

  const initiateConnection = useCallback(async (clientId: string) => {
    let pc = getPeerConnection(clientId);
    if (pc && pc.connectionState !== 'closed') {
      console.log(`[useHostWebRTC] Peer connection for ${clientId} already exists. State: ${pc.connectionState}`);
      return;
    }
    
    console.log(`[useHostWebRTC] Initiating new peer connection for client: ${clientId}`);
    pc = createPeerConnection(clientId);
    
    // Add recvonly transceivers
    pc.addTransceiver('video', { direction: 'recvonly' }); // Index 0: camera video
    pc.addTransceiver('audio', { direction: 'recvonly' }); // Index 1: mic audio
    pc.addTransceiver('video', { direction: 'recvonly' }); // Index 2: screen share video
    
    const offer = await createOffer(clientId);
    if (offer && socket) {
      console.log(`[useHostWebRTC] Emitting initial offer to client: ${clientId}`);
      socket.emit('offer', {
        targetSocketId: clientId,
        offer,
      });
    }
  }, [createPeerConnection, createOffer, getPeerConnection, socket]);

  useEffect(() => {
    if (!socket) return;
    
    const onOffer = async (data: any) => {
      const { from, offer } = data;
      console.log(`[useHostWebRTC] Received renegotiation offer from client ${from}`);
      const answer = await handleOfferFromPeer(from, offer);
      if (answer && socket) {
        console.log(`[useHostWebRTC] Emitting renegotiation answer to client ${from}`);
        socket.emit('answer', {
          targetSocketId: from,
          answer,
        });
      }
      checkTransceiverDirections(from);
    };
    
    const onAnswer = async (data: any) => {
      const { from, answer } = data;
      console.log(`[useHostWebRTC] Received answer from client ${from}`);
      await handleAnswerFromPeer(from, answer);
      checkTransceiverDirections(from);
    };
    
    const onIceCandidateMsg = async (data: any) => {
      const { from, candidate } = data;
      console.log(`[useHostWebRTC] Received remote ICE candidate from client ${from}`);
      await addIceCandidate(from, candidate);
    };
    
    socket.on('offer', onOffer);
    socket.on('answer', onAnswer);
    socket.on('ice-candidate', onIceCandidateMsg);
    
    return () => {
      socket.off('offer', onOffer);
      socket.off('answer', onAnswer);
      socket.off('ice-candidate', onIceCandidateMsg);
    };
  }, [socket, handleOfferFromPeer, handleAnswerFromPeer, addIceCandidate, checkTransceiverDirections]);

  // Initiate connections to all clients
  useEffect(() => {
    clients.forEach((client) => {
      initiateConnection(client.socketId);
    });
  }, [clients, initiateConnection]);

  const disconnectClient = useCallback((clientId: string) => {
    console.log(`[useHostWebRTC] Disconnecting client connection: ${clientId}`);
    closePeerConnection(clientId);
    cameraStreamsRef.current.delete(clientId);
    screenStreamsRef.current.delete(clientId);
  }, [closePeerConnection]);

  return { disconnectClient };
};