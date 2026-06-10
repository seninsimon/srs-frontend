import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { flagService } from '../services/flagService';
import { Navbar } from '../components/common/Navbar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Flag, Clock, User, Monitor } from 'lucide-react';

const FlaggedUsers: React.FC = () => {
  const { data: flags, isLoading } = useQuery({
    queryKey: ['flags'],
    queryFn: flagService.getAllFlags,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Flag className="text-red-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-900">Flagged Users</h1>
        </div>
        
        {flags && flags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flags.map((flag) => (
              <div key={flag.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                {flag.screenshotUrl && (
                  <div className="aspect-video bg-gray-900 overflow-hidden">
                    <img 
                      src={flag.screenshotUrl} 
                      alt="Flag evidence" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                
                <div className="p-4 flex-grow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-blue-600" />
                      <span className="font-semibold text-gray-900">
                        {flag.clientId?.displayName || 'Unknown Client'}
                      </span>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full">
                      Manual Flag
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {flag.description}
                  </p>
                  
                  <div className="mt-auto space-y-2 border-t pt-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Monitor size={14} />
                      <span>Session ID: {flag.sessionId.substring(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={14} />
                      <span>{new Date(flag.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Reported by: {flag.createdBy.username}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Flag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No flags have been reported yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlaggedUsers;
