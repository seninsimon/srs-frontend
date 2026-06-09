import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { LayoutDashboard, Users, Video, LogOut } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentUser, logout, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">CrowdStream</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {currentUser?.username} ({currentUser?.role})
              </span>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/sessions"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <LayoutDashboard size={32} className="text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">Sessions</span>
            </div>
            <p className="text-gray-600">Manage and monitor remote annotation sessions</p>
          </Link>
          
          {isSuperAdmin && (
            <Link
              to="/users"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <Users size={32} className="text-green-600" />
                <span className="text-3xl font-bold text-gray-900">Users</span>
              </div>
              <p className="text-gray-600">Manage Super Admin and Host users</p>
            </Link>
          )}
          
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg shadow-md p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Quick Start Guide</h3>
            <ul className="text-sm space-y-1 opacity-90">
              <li>1. Create a new session</li>
              <li>2. Assign a host to the session</li>
              <li>3. Generate a join link</li>
              <li>4. Share link with annotators</li>
              <li>5. Monitor from session dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;