import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import {
  getAuthToken,
  setAuthToken,
  getDefaultApiBaseUrl,
  setApiBaseUrl,
  checkBackendHealth,
} from '../api/client';
import { loginApi, registerApi, LoginPayload, RegisterPayload, LoginResponseData } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  backendUrl: string;
  updateBackendUrl: (url: string) => void;
  backendStatus: {
    connected: boolean;
    checking: boolean;
    message: string;
    lastChecked?: string | null;
  };
  refreshBackendStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'pams_auth_user';

function buildUserFromLogin(data: LoginResponseData): User {
  return {
    id: 0,
    email: data.email,
    name: data.name,
    fullName: data.name,
    username: data.email.split('@')[0],
    role: data.role as UserRole,
    status: 'ACTIVE',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backendUrl, setBackendUrlState] = useState<string>(getDefaultApiBaseUrl());
  const [backendStatus, setBackendStatus] = useState<{
    connected: boolean;
    checking: boolean;
    message: string;
    lastChecked?: string | null;
  }>({
    connected: false,
    checking: true,
    message: 'Testing connection to Spring Boot backend...',
    lastChecked: null,
  });

  const refreshBackendStatus = useCallback(async () => {
    setBackendStatus((prev) => ({ ...prev, checking: true }));
    const health = await checkBackendHealth();
    setBackendStatus({
      connected: health.connected,
      checking: false,
      message: health.message,
      lastChecked: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    refreshBackendStatus();
  }, [backendUrl, refreshBackendStatus]);

  // Listen for unauthorized 401 events dispatched by Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
    };

    window.addEventListener('pams:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('pams:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await loginApi(payload);
      setToken(res.token);
      // Backend login response includes email, name, role
      const newUser = buildUserFromLogin(res);
      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      // Backend register returns UserResponse with PENDING status
      // Do NOT set the user as authenticated - they must wait for admin approval
      await registerApi(payload);
      // User is NOT logged in after registration; they need to wait for approval
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const hasRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const updateBackendUrl = (url: string) => {
    setApiBaseUrl(url);
    setBackendUrlState(url);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        backendUrl,
        updateBackendUrl,
        backendStatus,
        refreshBackendStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
