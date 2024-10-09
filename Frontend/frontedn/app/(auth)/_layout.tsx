import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: 'Log In' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
      <Stack.Screen name="forgot" options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="setup" options={{ title: 'Profile Setup' }} />
    </Stack>
  );
}