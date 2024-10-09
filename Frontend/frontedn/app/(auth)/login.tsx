import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, useRouter} from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@react-navigation/native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (pass: string) => {
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(pass);
    const isEightCharacters = pass.length >= 8;
  
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && isEightCharacters;
  };

  const handleLogin = async () => {
    let isValid = true;
    let errorMessage = "";

    if (!email) {
      isValid = false;
      errorMessage += "Email is required. ";
    } else if (!validateEmail(email)) {
      isValid = false;
      errorMessage += "Invalid email format. ";
    }

    if (!password) {
      isValid = false;
      errorMessage += "Password is required. ";
    } else if (!validatePassword(password)) {
      isValid = false;
      errorMessage += "Password must contain a number, a capital letter, a small letter, a special character, and must be at least 8 characters long. ";
    }

    if (isValid) {
      setError('');
      setIsLoading(true);
      try {
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed');
        }

        const { token, user } = await response.json();
        await login(token, user); // Assuming login function is provided by AuthContext
        router.replace('/(tabs)/home');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError(errorMessage.trim());
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Login to HoopMaster</Text>
      </View>
      <View style={styles.formContainer}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Email"
          placeholderTextColor={colors.text}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Password"
          placeholderTextColor={colors.text}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        <Link href="/signup" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={[styles.linkText, { color: colors.primary }]}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/forgot" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={[styles.linkText, { color: colors.primary }]}>Forgot password?</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
    paddingBottom: 20
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
  link: {
    textDecorationLine : "none"
  }
});