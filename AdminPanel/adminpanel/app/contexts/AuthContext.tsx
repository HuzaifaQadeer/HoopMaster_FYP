'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);

    // Redirect if needed
    if (!token && pathname !== '/login') {
      router.push('/login');
    } else if (token && pathname === '/login') {
      router.push('/');
    }
  }, [pathname]);

  const login = async (email: string, password: string) => {
    // Simulate API call
    if (email && password) {
      // For demo, any non-empty email/password combination works
      localStorage.setItem('auth_token', 'demo_token');
      setIsAuthenticated(true);
      router.push('/');
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 