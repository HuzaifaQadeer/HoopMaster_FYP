import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { API_ROUTES } from '../config/config';

type User = {
  id: string;
  email: string;
  displayName: string;
  [key: string]: any;
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
      const userDetails = await AsyncStorage.getItem('userDetails');

      if (token && userJson) {
        const basicUser = JSON.parse(userJson);
        const detailedUser = userDetails ? JSON.parse(userDetails) : {};
        
        setUser({ ...basicUser, ...detailedUser });
        setIsAuthenticated(true);
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
    const isSetupScreen = segments[0] === '(tabs)' && segments[1] === 'setup';

    if (
      isAuthenticated && 
      inAuthGroup && 
      !isSetupScreen
    ) {
      router.replace('/(tabs)/home');
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, segments, isLoading]);

  const fetchAndStoreUserDetails = async (token: string) => {
    try {
      const response = await fetch(API_ROUTES.GET_PROFILE, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const userData = await response.json();
      await AsyncStorage.setItem('userDetails', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  };

  const login = async (token: string, user: User) => {
    try {
      console.log('Login function called with token:', token, 'and user:', user);
      
      if (!token || !user) {
        throw new Error('Invalid login data');
      }

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      const userDetails = await fetchAndStoreUserDetails(token);
      setUser({ ...user, ...userDetails });
      setIsAuthenticated(true);
      
      console.log('Token and user data stored successfully');
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userDetails');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const getToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
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
      // Let the calling component handle the error
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