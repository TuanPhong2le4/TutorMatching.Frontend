import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUserPartial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
  const [token, setToken] = useState<string | null>(() => authService.getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const handleUnauthorized = () => {
      authService.logout();
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (request: LoginRequest) => {
    const data = await authService.login(request);
    setUser(data.user);
    setToken(data.accessToken);
    closeAuthModal();
  };

  const register = async (request: RegisterRequest) => {
    const data = await authService.register(request);
    setUser(data.user);
    setToken(data.accessToken);
    closeAuthModal();
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/login');
    }
  };

  const updateUser = (updatedUserPartial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedUserPartial };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
