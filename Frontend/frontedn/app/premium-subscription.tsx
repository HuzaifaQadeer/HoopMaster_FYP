import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { API_ROUTES } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionInfo {
  isPremium: boolean;
  premiumStartDate: string | null;
  premiumExpiryDate: string | null;
}

const PremiumSubscriptionScreen = () => {
  const { colors } = useTheme();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'You must be logged in to view subscription details');
        router.back();
        return;
      }

      // Get user profile which contains premium status
      const response = await fetch(API_ROUTES.GET_PROFILE, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription information');
      }

      const userData = await response.json();
      setSubscriptionInfo({
        isPremium: userData.isPremium,
        premiumStartDate: userData.premiumStartDate,
        premiumExpiryDate: userData.premiumExpiryDate
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch subscription information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Premium Subscription',
      'Are you sure you want to cancel your premium subscription? You will lose access to premium features at the end of your current billing period.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: confirmCancellation }
      ]
    );
  };

  const confirmCancellation = async () => {
    try {
      setIsCancelling(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'You must be logged in to cancel your subscription');
        return;
      }

      // Create a new endpoint for cancellation
      const response = await fetch(API_ROUTES.CANCEL_PREMIUM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel subscription');
      }

      // Update local storage
      const userInfo = await AsyncStorage.getItem('userDetails');
      if (userInfo) {
        const parsedInfo = JSON.parse(userInfo);
        parsedInfo.isPremium = false;
        await AsyncStorage.setItem('userDetails', JSON.stringify(parsedInfo));
      }

      Alert.alert(
        'Subscription Cancelled', 
        'Your premium subscription has been cancelled. You will have access to premium features until the end of your current billing period.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      // Parse the date string and handle potential invalid dates
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'N/A';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Premium Subscription</Text>
      </View>

      {subscriptionInfo?.isPremium ? (
        <>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={24} color="green" />
              <Text style={[styles.statusText, { color: colors.text }]}>Active</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Subscription:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>Premium Monthly</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Price:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>$9.99/month</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Started on:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(subscriptionInfo.premiumStartDate)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Next billing date:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(subscriptionInfo.premiumExpiryDate)}
              </Text>
            </View>
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

          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: colors.notification }]}
            onPress={handleCancelSubscription}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color={colors.notification} />
            ) : (
              <Text style={[styles.cancelButtonText, { color: colors.notification }]}>
                Cancel Subscription
              </Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>
            By cancelling, you will lose all premium features.
          </Text>
        </>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.noSubscriptionText, { color: colors.text }]}>
            You don't have an active premium subscription.
          </Text>
          <TouchableOpacity 
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/premium-upgrade' as any)}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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
  cancelButton: {
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  noSubscriptionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  upgradeButton: {
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PremiumSubscriptionScreen; 