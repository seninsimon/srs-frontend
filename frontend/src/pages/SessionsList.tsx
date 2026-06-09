import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Link as LinkIcon, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionService } from '../services/sessionService';
import type { CreateSessionData } from '../services/sessionService';
import { userService } from '../services/userService';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuthStore } from '../store/authStore';

const SessionsList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [_joinLink, setJoinLink] = useState<string | null>(null);
  const [newSession, setNewSession] = useState<CreateSessionData>({ title: '', description: '' });
  
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionService.getSessions,
  });
  
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
    enabled: currentUser?.role === 'super_admin',
  });
  
  const createSessionMutation = useMutation({
    mutationFn: sessionService.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setIsCreateModalOpen(false);
      setNewSession({ title: '', description: '' });
      toast.success('Session created successfully');
    },
  });
  
  const deleteSessionMutation = useMutation({
    mutationFn: sessionService.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session deleted');
    },
  });
  
  const generateLinkMutation = useMutation({
    mutationFn: sessionService.generateJoinLink,
    onSuccess: (data) => {
      setJoinLink(data.joinUrl);
      navigator.clipboard.writeText(data.joinUrl);
      toast.success('Join link copied to clipboard');
    },
  });
  
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    createSessionMutation.mutate(newSession);
  };
  
  const handleCopyLink = (sessionId: string) => {
    generateLinkMutation.mutate(sessionId);
  };
  
  const handleMonitor = (sessionId: string) => {
    navigate(`/sessions/${sessionId}/monitor`);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            New Session
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Host</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions?.map((session) => (
                <tr key={session._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{session.title}</div>
                    {session.description && (
                      <div className="text-sm text-gray-500">{session.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session.createdBy.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session.assignedHost?.username || 'Not assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleCopyLink(session._id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Copy join link"
                      >
                        <LinkIcon size={18} />
                      </button>
                      <button
                        onClick={() => handleMonitor(session._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Monitor session"
                      >
                        <Eye size={18} />
                      </button>
                      {currentUser?.role === 'super_admin' && (
                        <button
                          onClick={() => deleteSessionMutation.mutate(session._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete session"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {(!sessions || sessions.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-500">No sessions yet. Create your first session!</p>
            </div>
          )}
        </div>
      </div>
      
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Session"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <Input
            label="Session Title"
            value={newSession.title}
            onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
            required
          />
          
          <Input
            label="Description (Optional)"
            value={newSession.description}
            onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
          />
          
          {currentUser?.role === 'super_admin' && users && (
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newSession.assignedHost || ''}
              onChange={(e) => setNewSession({ ...newSession, assignedHost: e.target.value })}
            >
              <option value="">Assign Host (Optional)</option>
              {users.filter(u => u.role === 'host').map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSessionMutation.isPending}>
              Create Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SessionsList;