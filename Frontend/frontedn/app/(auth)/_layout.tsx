import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AuthLayout() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const router = useRouter();
  const { getToken } = useAuth();

  useEffect(() => {
    const checkTokenStatus = async () => {
      const token = await getToken();
      setHasToken(!!token);
    };

    checkTokenStatus();
  }, [getToken]);

  useEffect(() => {
    if (hasToken === false) {
      // If there's no token, redirect to login
      router.replace('/login');
    }
  }, [hasToken, router]);

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: 'Log In' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
      <Stack.Screen name="forgot" options={{ title: 'Forgot Password' }} />
      <Stack.Screen
        name="setup"
        options={{
          title: 'Profile Setup',
          headerLeft: () => null,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
