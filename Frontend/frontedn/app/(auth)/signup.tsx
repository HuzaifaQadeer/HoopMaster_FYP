import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@react-navigation/native';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  const validateEmail = (email : string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (pass : string) => {
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(pass);
    const isEightCharacters = pass.length >= 8;
  
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && isEightCharacters;
  };

  const handleSignup = async () => {
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

    if (password !== confirmPassword) {
      isValid = false;
      errorMessage += "Passwords don't match. ";
    }

    if (!isValid) {
      setError(errorMessage.trim());
    } else {
      setError('');
      setIsLoading(true);
      try {
        router.replace('/setup');
      } catch (err) {
        setError('Signup failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Sign up for HoopMaster</Text>
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
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Confirm Password"
          placeholderTextColor={colors.text}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={[styles.linkText, { color: colors.primary }]}>
              Already have an account? Log in
            </Text>
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
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
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
    marginBottom: 10,
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
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
  },
});