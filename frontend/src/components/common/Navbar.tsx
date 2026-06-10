import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from './Button';
import { Video, LogOut, LayoutDashboard, List, Users } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Sessions', path: '/sessions', icon: List },
    ...(isSuperAdmin ? [{ name: 'Users', path: '/users', icon: Users }] : []),
  ];
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center">
              <Video className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">CrowdStream</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-gray-900">{currentUser?.username}</span>
              <span className="text-xs text-gray-500 capitalize">{currentUser?.role.replace('_', ' ')}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut size={16} className="mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
