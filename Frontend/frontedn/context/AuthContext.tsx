import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

type User = {
  id: string;
  email: string;
  displayName: string;
  // Add other user properties as needed
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  getToken: () => Promise<string | null>;
  authenticatedRequest: (url: string, options?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userJson = await AsyncStorage.getItem('user');
      if (token && userJson) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userJson));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isSetupScreen = segments[1] === 'setup';

    if (isAuthenticated && inAuthGroup && !isSetupScreen) {
      router.replace('/(tabs)/home');
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, segments, isLoading]);

  const login = async (token: string | null, user: User | null) => {
    try {
      console.log('Login function called with token:', token, 'and user:', user);
      
      if (!token || !user) {
        console.error('Attempted to login with null token or user');
        throw new Error('Invalid login data');
      }

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setIsAuthenticated(true);
      setUser(user);
      console.log('Token and user stored successfully');
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const getToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Retrieved token:', token);
      if (!token) {
        console.warn('No token found in AsyncStorage');
      }
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const authenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    const headers = new Headers(options.headers || {});
    headers.append('Authorization', `Bearer ${token}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token might be invalid or expired
      await logout();
      throw new Error('Authentication failed');
    }

    return response;
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuthStatus,
    getToken,
    authenticatedRequest,
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
