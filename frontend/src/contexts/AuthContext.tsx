import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe } from '../lib/api';

export interface User {
  user_id?: string;
  email: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const sessionUser = await getMe();
        if (sessionUser) {
           setUser({ email: sessionUser.email || '', user_id: sessionUser.id });
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: any) => {
    const { user: authUser } = await apiLogin(credentials);
    if (authUser) {
        setUser({ email: authUser.email || '', user_id: authUser.id });
    }
  };

  const register = async (data: any) => {
    await apiRegister(data);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
