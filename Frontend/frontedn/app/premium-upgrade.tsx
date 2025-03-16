import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { API_ROUTES } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import valid from 'card-validator';

const PremiumUpgradeScreen = () => {
  const { colors } = useTheme();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Error states
  const [cardNumberError, setCardNumberError] = useState('');
  const [expiryDateError, setExpiryDateError] = useState('');
  const [cvvError, setCvvError] = useState('');
  const [cardholderNameError, setCardholderNameError] = useState('');

  const validateCard = () => {
    let isValid = true;
    
    // Validate card number
    const cardNumberValidation = valid.number(cardNumber);
    if (!cardNumberValidation.isValid) {
      setCardNumberError('Invalid card number');
      isValid = false;
    } else {
      setCardNumberError('');
    }
    
    // Validate expiry date
    const expiryValidation = valid.expirationDate(expiryDate);
    if (!expiryValidation.isValid) {
      setExpiryDateError('Invalid expiry date (MM/YY)');
      isValid = false;
    } else {
      setExpiryDateError('');
    }
    
    // Validate CVV
    const cvvValidation = valid.cvv(cvv);
    if (!cvvValidation.isValid) {
      setCvvError('Invalid CVV');
      isValid = false;
    } else {
      setCvvError('');
    }
    
    // Validate cardholder name
    if (!cardholderName.trim()) {
      setCardholderNameError('Cardholder name is required');
      isValid = false;
    } else {
      setCardholderNameError('');
    }
    
    return isValid;
  };

  const formatCardNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Add space after every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  const formatExpiryDate = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Format as MM/YY
    if (cleaned.length > 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
  };

  const handleExpiryDateChange = (text: string) => {
    const formatted = formatExpiryDate(text);
    setExpiryDate(formatted);
  };

  const handleUpgrade = async () => {
    if (!validateCard()) {
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'You must be logged in to upgrade');
        return;
      }

      const response = await fetch(API_ROUTES.UPGRADE_PREMIUM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardNumber,
          expiryDate,
          cvv,
          cardholderName
        })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response Text:', responseText);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upgrade to premium');
      }

      // Update local storage with premium status
      const userInfo = await AsyncStorage.getItem('userDetails');
      if (userInfo) {
        const parsedInfo = JSON.parse(userInfo);
        parsedInfo.isPremium = true;
        parsedInfo.premiumStartDate = data.premiumStartDate;
        parsedInfo.premiumExpiryDate = data.premiumExpiryDate;
        await AsyncStorage.setItem('userDetails', JSON.stringify(parsedInfo));
      }

      // Fetch fresh profile data to ensure all screens have latest data
      const profileResponse = await fetch(API_ROUTES.GET_PROFILE, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        await AsyncStorage.setItem('userDetails', JSON.stringify(profileData));
      }

      Alert.alert(
        'Success', 
        'You have successfully upgraded to premium!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upgrade to premium');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Upgrade to Premium</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Premium Benefits</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={[styles.benefitText, { color: colors.text }]}>No ads</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={[styles.benefitText, { color: colors.text }]}>Access to premium courses</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={[styles.benefitText, { color: colors.text }]}>Priority support</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Details</Text>
          <Text style={[styles.price, { color: colors.text }]}>$9.99/month</Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Cardholder Name</Text>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: colors.background, borderColor: cardholderNameError ? 'red' : colors.border },
                { color: colors.text }
              ]}
              placeholder="Full Name"
              placeholderTextColor={colors.text + '80'}
              value={cardholderName}
              onChangeText={setCardholderName}
            />
            {cardholderNameError ? <Text style={styles.errorText}>{cardholderNameError}</Text> : null}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Card Number</Text>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: colors.background, borderColor: cardNumberError ? 'red' : colors.border },
                { color: colors.text }
              ]}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.text + '80'}
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              keyboardType="numeric"
              maxLength={19}
            />
            {cardNumberError ? <Text style={styles.errorText}>{cardNumberError}</Text> : null}
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Expiry Date</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.background, borderColor: expiryDateError ? 'red' : colors.border },
                  { color: colors.text }
                ]}
                placeholder="MM/YY"
                placeholderTextColor={colors.text + '80'}
                value={expiryDate}
                onChangeText={handleExpiryDateChange}
                keyboardType="numeric"
                maxLength={5}
              />
              {expiryDateError ? <Text style={styles.errorText}>{expiryDateError}</Text> : null}
            </View>
            
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>CVV</Text>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: colors.background, borderColor: cvvError ? 'red' : colors.border },
                  { color: colors.text }
                ]}
                placeholder="123"
                placeholderTextColor={colors.text + '80'}
                value={cvv}
                onChangeText={setCvv}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
              {cvvError ? <Text style={styles.errorText}>{cvvError}</Text> : null}
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
          onPress={handleUpgrade}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          By upgrading, you agree to our Terms of Service and Privacy Policy. 
          Your subscription will automatically renew every month until canceled.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitText: {
    marginLeft: 10,
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  upgradeButton: {
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default PremiumUpgradeScreen; 