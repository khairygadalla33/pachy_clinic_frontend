import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'TECHNICIAN' | 'RECEPTIONIST';

export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  branchId: string | null;
  branch?: { name: string };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginPin: (pinCode: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  hasAccess: (module: string) => boolean;
}

const roleModuleAccess: Record<UserRole, string[]> = {
  ADMIN: ['dashboard', 'clients', 'appointments', 'sessions', 'prescriptions', 'invoices', 'treasury', 'packages', 'inventory', 'devices', 'reports', 'users', 'settings'],
  DOCTOR: ['dashboard', 'clients', 'appointments', 'sessions', 'prescriptions', 'settings'],
  NURSE: ['dashboard', 'clients', 'appointments', 'sessions', 'inventory'],
  TECHNICIAN: ['dashboard', 'clients', 'appointments', 'sessions', 'devices', 'inventory'],
  RECEPTIONIST: ['dashboard', 'clients', 'appointments', 'invoices', 'packages', 'settings'],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    setUser(data.user);
  };

  const loginPin = async (pinCode: string) => {
    const { data } = await api.post('/auth/login-pin', { pinCode });
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const hasRole = (...roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const hasAccess = (module: string) => {
    if (user?.role === 'ADMIN') return true;
    return user ? roleModuleAccess[user.role]?.includes(module) ?? false : false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginPin, logout, hasRole, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
