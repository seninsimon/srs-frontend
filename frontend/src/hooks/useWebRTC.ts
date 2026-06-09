import { useEffect, useRef, useCallback } from 'react';

export interface UseWebRTCPeerOptions {
  onTrack: (event: RTCTrackEvent, peerId: string, pc: RTCPeerConnection) => void;
  onIceCandidate: (candidate: RTCIceCandidate, peerId: string) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState, peerId: string) => void;
}

export const useWebRTCPeer = ({
  onTrack,
  onIceCandidate,
  onIceConnectionStateChange,
}: UseWebRTCPeerOptions) => {
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };
  
  const createPeerConnection = useCallback((peerId: string) => {
    console.log(`[WebRTC PeerConnection] Creating RTCPeerConnection for peer: ${peerId}`);
    const pc = new RTCPeerConnection(configuration);
    
    pc.ontrack = (event) => {
      console.log(`[WebRTC PeerConnection] ontrack event fired for peer: ${peerId}. Kind: ${event.track.kind}, ID: ${event.track.id}`);
      onTrack(event, peerId, pc);
    };
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[WebRTC PeerConnection] Generated ICE candidate for peer: ${peerId}:`, event.candidate.candidate);
        onIceCandidate(event.candidate, peerId);
      } else {
        console.log(`[WebRTC PeerConnection] ICE candidate gathering finished for peer: ${peerId}`);
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC PeerConnection] ICE connection state change for peer ${peerId}: ${pc.iceConnectionState}`);
      onIceConnectionStateChange?.(pc.iceConnectionState, peerId);
    };
    
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC PeerConnection] Connection state change for peer ${peerId}: ${pc.connectionState}`);
    };
    
    pc.onsignalingstatechange = () => {
      console.log(`[WebRTC PeerConnection] Signaling state change for peer ${peerId}: ${pc.signalingState}`);
    };
    
    pc.onnegotiationneeded = () => {
      console.log(`[WebRTC PeerConnection] negotiationneeded event fired for peer: ${peerId}`);
    };
    
    peerConnectionsRef.current.set(peerId, pc);
    return pc;
  }, [onTrack, onIceCandidate, onIceConnectionStateChange]);
  
  const getPeerConnection = useCallback((peerId: string) => {
    return peerConnectionsRef.current.get(peerId);
  }, []);
  
  const createOffer = useCallback(async (peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (!pc) {
      console.warn(`[WebRTC PeerConnection] Cannot create offer: Peer ${peerId} not found`);
      return null;
    }
    
    console.log(`[WebRTC PeerConnection] Creating offer for peer: ${peerId}`);
    const offer = await pc.createOffer();
    console.log(`[WebRTC PeerConnection] Setting local description (offer) for peer: ${peerId}`);
    await pc.setLocalDescription(offer);
    return offer;
  }, []);
  
  const handleAnswer = useCallback(async (peerId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (!pc) {
      console.warn(`[WebRTC PeerConnection] Cannot handle answer: Peer ${peerId} not found`);
      return;
    }
    
    console.log(`[WebRTC PeerConnection] Setting remote description (answer) for peer: ${peerId}`);
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);
  
  const handleOffer = useCallback(async (peerId: string, offer: RTCSessionDescriptionInit) => {
    let pc = peerConnectionsRef.current.get(peerId);
    if (!pc) {
      pc = createPeerConnection(peerId);
    }
    
    console.log(`[WebRTC PeerConnection] Setting remote description (offer) for peer: ${peerId}`);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log(`[WebRTC PeerConnection] Creating answer for peer: ${peerId}`);
    const answer = await pc.createAnswer();
    console.log(`[WebRTC PeerConnection] Setting local description (answer) for peer: ${peerId}`);
    await pc.setLocalDescription(answer);
    return answer;
  }, [createPeerConnection]);
  
  const addIceCandidate = useCallback(async (peerId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (!pc) {
      console.warn(`[WebRTC PeerConnection] Cannot add ICE candidate: Peer ${peerId} not found`);
      return;
    }
    
    console.log(`[WebRTC PeerConnection] Adding remote ICE candidate for peer: ${peerId}`);
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }, []);
  
  const closePeerConnection = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      console.log(`[WebRTC PeerConnection] Closing connection for peer: ${peerId}`);
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
  }, []);
  
  useEffect(() => {
    return () => {
      console.log('[WebRTC PeerConnection] Cleaning up all peer connections');
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, []);
  
  return {
    createPeerConnection,
    getPeerConnection,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    closePeerConnection,
  };
};