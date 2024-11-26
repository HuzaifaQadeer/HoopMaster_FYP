import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { API_ROUTES } from '../../config/config';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { colors } = useTheme();

  const handleSendEmail = async () => {
    setIsLoading(true);
    try {
      // Send verification email directly since we know the user exists
      const sendEmailResponse = await fetch(API_ROUTES.SEND_VERIFICATION_EMAIL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const responseData = await sendEmailResponse.json();
      
      if (!sendEmailResponse.ok) {
        throw new Error(responseData.message || 'Failed to send reset email');
      }

      // If we get here, the email was sent successfully
      setIsEmailSent(true);
      Alert.alert('Success', `A reset code has been sent to ${email}`);
      
    } catch (error) {
      console.error('Error in handleSendEmail:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = () => {
    setIsModalVisible(true);
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
  
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;
    
    if (!passwordRegex.test(newPassword)) {
      Alert.alert('Error', 'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character');
      return;
    }
  
    try {
      const response = await fetch(API_ROUTES.RESET_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: newPassword
        }),
      });
 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      Alert.alert('Success', 'Password reset successfully');
      setIsModalVisible(false);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to reset password. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Forgot Password</Text>
      
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Email"
        placeholderTextColor={colors.text}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {!isEmailSent ? (
        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: colors.primary },
            isLoading && styles.disabledButton
          ]}
          onPress={handleSendEmail}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Send Email</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Verification Code"
            placeholderTextColor={colors.text}
            value={resetToken}
            onChangeText={setResetToken}
            keyboardType="number-pad"
          />
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleVerifyCode}
          >
            <Text style={styles.buttonText}>Verify Code</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reset Password</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="New Password"
              placeholderTextColor={colors.text}
              value={newPassword}
              onChangeText={setNewPassword}
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
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleResetPassword}
            >
              <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    marginTop: 50
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ForgotPassword;
