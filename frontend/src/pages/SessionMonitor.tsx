import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Users } from 'lucide-react';
import { sessionService } from '../services/sessionService';
import { flagService } from '../services/flagService';
import { useSocket } from '../hooks/useSocket';
import { useHostWebRTC } from '../components/dashboard/webrtc/HostWebRTC';
import { ClientCard } from '../components/dashboard/ClientCard';
import { FocusMode } from '../components/dashboard/FocusMode';
import { SearchBar } from '../components/dashboard/SearchBar';
import { FlagModal } from '../components/dashboard/FlagModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/common/Button';
import { Navbar } from '../components/common/Navbar';

interface Client {
  socketId: string;
  displayName: string;
  clientId: string;
  cameraStream?: MediaStream;
  screenStream?: MediaStream;
}

const SessionMonitor: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
    const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusClient, setFocusClient] = useState<Client | null>(null);
  const [flagClient, setFlagClient] = useState<Client | null>(null);
  const [flagScreenshot, setFlagScreenshot] = useState<string | undefined>(undefined);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionService.getSession(sessionId!),
    enabled: !!sessionId,
  });
  
  const createFlagMutation = useMutation({
    mutationFn: flagService.createFlag,
    onSuccess: () => {
      toast.success('Flag created successfully');
      queryClient.invalidateQueries({ queryKey: ['flags', sessionId] });
    },
  });
  
  const handleStreamAdded = useCallback((clientId: string, stream: MediaStream, type: 'camera' | 'screen') => {
    setClients(prev => prev.map(client => {
      if (client.socketId === clientId) {
        if (type === 'camera') {
          return { ...client, cameraStream: stream };
        } else {
          return { ...client, screenStream: stream };
        }
      }
      return client;
    }));
  }, []);

  const handleStreamRemoved = useCallback((clientId: string, type: 'camera' | 'screen') => {
    setClients(prev => prev.map(client => {
      if (client.socketId === clientId) {
        if (type === 'camera') {
          return { ...client, cameraStream: undefined };
        } else {
          return { ...client, screenStream: undefined };
        }
      }
      return client;
    }));
  }, []);
  
  const { socket, isConnected } = useSocket({
    sessionId: sessionId!,
    role: 'host',
    onClientJoined: (data: any) => {
      toast.success(`${data.displayName} joined the session`);
      setClients(prev => [...prev, {
        socketId: data.socketId,
        displayName: data.displayName,
        clientId: data.clientId,
      }]);
    },
    onClientLeft: (data: any) => {
      toast(`${data.socketId} left the session`);
      setClients(prev => prev.filter(c => c.socketId !== data.socketId));
    },
    onClientsList: (data: any) => {
      setClients(data.clients.map((c: any) => ({
        socketId: c.socketId,
        displayName: c.displayName,
        clientId: c.clientId,
      })));
    },
  });
  
  useHostWebRTC({
    socket,
    clients,
    onStreamAdded: handleStreamAdded,
    onStreamRemoved: handleStreamRemoved,
  });
  
  const handleCreateFlag = async (description: string, screenshot?: string) => {
    if (!flagClient) return;
    
    await createFlagMutation.mutateAsync({
      sessionId: sessionId!,
      clientId: flagClient.clientId,
      description,
      screenshotUrl: screenshot,
      timestamp: new Date().toISOString(),
    });
  };
  
  const filteredClients = clients.filter(client =>
    client.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Session not found</p>
          <Button onClick={() => navigate('/sessions')} className="mt-4">
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/sessions')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{session.title}</h1>
                <p className="text-sm text-gray-500">
                  {session.description} • Status: {session.status}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-gray-600">{clients.length} Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.socketId}
              clientId={client.clientId}
              displayName={client.displayName}
              cameraStream={client.cameraStream}
              screenStream={client.screenStream}
              hasAudio={false}
              onExpand={() => setFocusClient(client)}
              onFlag={(screenshot) => {
                setFlagClient(client);
                setFlagScreenshot(screenshot);
                setIsFlagModalOpen(true);
              }}
            />
          ))}
        </div>
        
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No clients match your search' : 'Waiting for clients to join...'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Share the join link with annotators to begin monitoring
            </p>
          </div>
        )}
      </div>
      
      {focusClient && (
        <FocusMode
          isOpen={!!focusClient}
          onClose={() => setFocusClient(null)}
          clientName={focusClient.displayName}
          cameraStream={focusClient.cameraStream}
          screenStream={focusClient.screenStream}
        />
      )}
      
      <FlagModal
        isOpen={isFlagModalOpen}
        onClose={() => {
          setIsFlagModalOpen(false);
          setFlagClient(null);
          setFlagScreenshot(undefined);
        }}
        onSubmit={handleCreateFlag}
        clientName={flagClient?.displayName}
        screenshot={flagScreenshot}
      />
    </div>
  );
};

export default SessionMonitor;