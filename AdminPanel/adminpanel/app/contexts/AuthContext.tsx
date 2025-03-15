'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_ROUTES } from '../config/api-endpoints';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Create a function to handle API responses and check for token errors
  const handleApiResponse = async (response: Response) => {
    if (response.status === 401) {
      const data = await response.json();
      if (data.tokenError) {
        // Token is invalid or expired, log out the user
        await logout();
        return null;
      }
    }
    return response;
  };

  // Check authentication status on mount and when token changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      setIsAuthenticated(!!token);
      setIsInitialized(true);
    };

    // Check auth immediately
    checkAuth();

    // Set up event listener for storage changes (in case token is removed in another tab)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Handle redirects based on auth status
  useEffect(() => {
    if (!isInitialized) return;

    const token = localStorage.getItem('auth_token');
    
    // Only redirect if we're sure about the authentication state
    if (!token && pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    } else if (token && pathname === '/login') {
      router.push('/');
    }
  }, [isInitialized, pathname, router]);

  // Function to check auth status without side effects
  const checkAuthStatus = () => {
    const token = localStorage.getItem('auth_token');
    return !!token;
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(API_ROUTES.ADMIN.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Login failed');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('admin_data', JSON.stringify(data.admin));
      setIsAuthenticated(true);
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_data');
    setIsAuthenticated(false);
    await router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout,
      checkAuthStatus
    }}>
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