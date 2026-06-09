import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Video } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginLoading } = useAuth();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };
  
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Video size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CrowdStream</h1>
          <p className="text-gray-600 mt-2">Remote Annotator Monitoring Platform</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@example.com"
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          
          <Button
            type="submit"
            isLoading={loginLoading}
            className="w-full"
          >
            Sign In
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Demo credentials:</p>
          <p className="font-mono text-xs">super_admin@example.com / admin123</p>
          <p className="font-mono text-xs">host@example.com / host123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;