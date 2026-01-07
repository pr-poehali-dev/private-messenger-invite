import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, clearTokens } from '@/lib/api';
import { User } from '@/types';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        clearTokens();
        navigate('/auth');
      }
    } else {
      navigate('/auth');
    }
    setIsLoading(false);
  }, [navigate]);

  const logout = () => {
    clearTokens();
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    navigate('/auth');
  };

  return { currentUser, isLoading, logout };
};
