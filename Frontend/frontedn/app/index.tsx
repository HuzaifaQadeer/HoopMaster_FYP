import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      await checkAuthStatus();
      setIsLoading(false);
    }
    initializeAuth();
  }, []);
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  // Wait until the RootLayout has mounted and the user is authenticated
  if (isAuthenticated !== null) {
    return isAuthenticated ? (
      <Redirect href="/(tabs)/home" />
    ) : (
      <Redirect href="/(auth)/login" />
    );
  }
  
  return null;
}  