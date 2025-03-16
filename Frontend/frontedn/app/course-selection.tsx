import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Platform, 
  StatusBar, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { API_ROUTES } from '@/config/config';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdBanner from '@/components/custom/AdBanner';

const CourseSelectionScreen = () => {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { courseType } = params;

  const [level, setLevel] = useState('beginner');
  const [frequency, setFrequency] = useState('daily');
  const [duration, setDuration] = useState('2 week');
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [userHasPremium, setUserHasPremium] = useState(false);

  useEffect(() => {
    // Calculate duration based on frequency
    if (frequency === 'daily') {
      setDuration('2 week');
    } else if (frequency === 'every 2 days') {
      setDuration('1 month');
    } else if (frequency === 'weekly') {
      setDuration('2 months');
    }

    // Check if user has premium
    checkUserPremium();
  }, [frequency]);

  const checkUserPremium = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const parsedInfo = JSON.parse(userInfo);
        setUserHasPremium(parsedInfo.isPremium || false);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // First find the course that matches the criteria
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'You must be logged in to register for a course');
        return;
      }

      // Fetch the course ID based on parameters
      const response = await fetch(
        `${API_ROUTES.GET_COURSES_BY_PARAMETERS}?type=${courseType}&level=${level}&frequency=${frequency}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to find course');
      }

      const course = await response.json();
      
      if (!course) {
        Alert.alert('Error', 'No course found with the selected criteria');
        return;
      }

      // Check if course is premium and user has premium access
      if (course.isPremium && !userHasPremium) {
        Alert.alert(
          'Premium Course', 
          'This is a premium course. Upgrade to premium to access it.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Upgrade', 
              onPress: () => router.push('/premium-upgrade' as any) 
            }
          ]
        );
        return;
      }

      // Register user for the course
      const registerResponse = await fetch(API_ROUTES.REGISTER_FOR_COURSE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseId: course._id })
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.message || 'Failed to register for course');
      }

      // Show ad if user is not premium
      if (!userHasPremium) {
        setShowAd(true);
        // Continue with navigation after a short delay to ensure ad is seen
        setTimeout(() => {
          Alert.alert(
            'Success',
            'You have successfully registered for the course!',
            [
              {
                text: 'OK',
                onPress: () => router.push('/courses' as any)
              }
            ]
          );
        }, 1500);
      } else {
        // Navigate immediately for premium users
        Alert.alert(
          'Success',
          'You have successfully registered for the course!',
          [
            {
              text: 'OK',
              onPress: () => router.push('/courses' as any)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error registering for course:', error);
      Alert.alert('Error', (error as Error).message || 'Failed to register for course');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Course Selection</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.courseTypeContainer}>
          <Text style={[styles.courseTypeTitle, { color: colors.text }]}>
            {courseType} Training
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Skill Level</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Picker
              selectedValue={level}
              onValueChange={(itemValue) => setLevel(itemValue)}
              style={[styles.picker, { color: colors.text }]}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="Beginner" value="beginner" />
              <Picker.Item label="Intermediate" value="intermediate" />
              <Picker.Item label="Expert" value="expert" />
            </Picker>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Practice Frequency</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Picker
              selectedValue={frequency}
              onValueChange={(itemValue) => setFrequency(itemValue)}
              style={[styles.picker, { color: colors.text }]}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="Daily" value="daily" />
              <Picker.Item label="Every 2 Days" value="every 2 days" />
              <Picker.Item label="Weekly" value="weekly" />
            </Picker>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Course Duration</Text>
          <View style={[styles.durationContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.durationText, { color: colors.text }]}>{duration}</Text>
          </View>

          <Text style={styles.infoText}>
            Duration is automatically determined based on practice frequency.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.registerButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.registerButtonText}>Register for Course</Text>
          )}
        </TouchableOpacity>
      </View>

      {showAd && (
        <AdBanner 
          type="course" 
          onClose={() => setShowAd(false)} 
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  courseTypeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  courseTypeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  durationContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  durationText: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#888',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
  },
  registerButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CourseSelectionScreen; 