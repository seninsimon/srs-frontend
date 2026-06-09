import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import type { User } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser, setAccessToken, logout } = useAuthStore();
  
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Login failed');
    },
  });
  
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      queryClient.clear();
      navigate('/login');
      toast.success('Logged out');
    },
  });
  
  const { data: currentUser, isLoading, isError } = useQuery<User>({
    queryKey: ['me'],
    queryFn: authService.getMe,
    enabled: !!useAuthStore.getState().accessToken,
    retry: false,
  });

  // Handle success/error side effects via useEffect instead of onSuccess/onError
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
  }, [currentUser, setUser]);

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError, logout]);
  
  return {
    login: loginMutation.mutate,
    loginLoading: loginMutation.isPending,
    logout: logoutMutation.mutate,
    currentUser,
    isLoading,
  };
};