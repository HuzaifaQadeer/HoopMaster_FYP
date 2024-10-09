import { Stack, Slot } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '@react-navigation/native';
import Colors from '../constants/Colors';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={Colors[colorScheme ?? 'light']}>
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

function AuthenticatedLayout() {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        await checkAuthStatus();
        setIsAuthChecked(true);
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, [checkAuthStatus]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isAuthChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isAuthChecked]);

  // Provide a fallback navigation structure during loading
  if (!fontsLoaded || !isAuthChecked) {
    return <RootLayoutNav />; // Ensures Slot is rendered early
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthenticatedLayout />
    </AuthProvider>
  );
}
