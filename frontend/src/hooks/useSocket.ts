import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

interface UseSocketOptions {
  sessionId: string;
  role: 'host' | 'client';
  displayName?: string;
  enabled?: boolean;
  onClientJoined?: (data: any) => void;
  onClientLeft?: (data: any) => void;
  onClientsList?: (data: any) => void;
  onOffer?: (data: any) => void;
  onAnswer?: (data: any) => void;
  onIceCandidate?: (data: any) => void;
}

export const useSocket = (options: UseSocketOptions) => {
  const { sessionId, role, displayName, enabled = true,
    onClientJoined, onClientLeft, onClientsList, onOffer, onAnswer, onIceCandidate } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken } = useAuthStore();

  useEffect(() => {

    if (!enabled) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

    const socket = io(socketUrl, {
      auth: {
        token: role === 'client' ? new URLSearchParams(window.location.search).get('token') : accessToken,
        sessionId,
        role,
        displayName,
        userId: useAuthStore.getState().user?.id,
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`Socket connected as ${role}`);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    if (role === 'host') {
      if (onClientJoined) socket.on('client-joined', onClientJoined);
      if (onClientLeft) socket.on('client-left', onClientLeft);
      if (onClientsList) socket.on('clients-list', onClientsList);
    }

    if (onOffer) socket.on('offer', onOffer);
    if (onAnswer) socket.on('answer', onAnswer);
    if (onIceCandidate) socket.on('ice-candidate', onIceCandidate);

    return () => {
      socket.disconnect();
    };
  }, [sessionId, role, enabled]);

  const emitOffer = (targetSocketId: string, offer: RTCSessionDescriptionInit) => {
    socketRef.current?.emit('offer', { targetSocketId, offer });
  };

  const emitAnswer = (targetSocketId: string, answer: RTCSessionDescriptionInit) => {
    socketRef.current?.emit('answer', { targetSocketId, answer });
  };

  const emitIceCandidate = (targetSocketId: string, candidate: RTCIceCandidateInit) => {
    socketRef.current?.emit('ice-candidate', { targetSocketId, candidate });
  };

  return {
    socket: socketRef.current,
    isConnected,
    emitOffer,
    emitAnswer,
    emitIceCandidate,
  };
};