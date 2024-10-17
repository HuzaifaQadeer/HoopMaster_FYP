import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import SocialMediaSelector from '@/components/custom/socialMediaSelector';
import MeasurementField from '@/components/custom/measurmentFields';
import { API_ROUTES } from '@/config/config';
import { Picker } from '@react-native-picker/picker';
import { BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MeasurementValue {
  value: string;
  unit: string;
  feet?: string;
  inches?: string;
}

interface ProfileData {
  userName: string;
  profilePicture: string | null;
  socialMedia: Record<string, string>;
  height: MeasurementValue;
  weight: MeasurementValue;
  wingspan: MeasurementValue;
  position: string;
  verticalJump: MeasurementValue;
  aboutMe: string;
}

// Add this function near the top of your file
const convertToStandardUnit = (measurement: MeasurementValue): number => {
  const value = parseFloat(measurement.value);
  if (isNaN(value)) return NaN;

  switch (measurement.unit) {
    case 'cm':
    case 'kg':
      return value;
    case 'ft':
      return value * 30.48; // Convert feet to cm
    case 'in':
      return value * 2.54; // Convert inches to cm
    case 'lbs':
      return value * 0.453592; // Convert pounds to kg
    default:
      return NaN;
  }
};

export default function ProfileSetupScreen() {
  const [profileData, setProfileData] = useState<ProfileData>({
    userName: '',
    profilePicture: null,
    socialMedia: {},
    height: { value: '', unit: 'cm', feet: '', inches: '' },
    weight: { value: '', unit: 'kg' },
    wingspan: { value: '', unit: 'cm' },
    position: '',
    verticalJump: { value: '', unit: 'cm' },
    aboutMe: '',
  });

  const [error, setError] = useState<string>('');

  const { login, authenticatedRequest, getToken } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        "Go Back",
        "Are you sure you want to go back?",
        [
          { text: "Cancel", onPress: () => null, style: "cancel" },
          { text: "Go Back", onPress: () => router.replace('/login') }
        ],
        { cancelable: false }
      );
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [router]);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await getToken();
        console.log('Token in setup screen:', token);
        if (!token) {
          console.error('No token available in setup screen');
          // Handle the no-token scenario, e.g., redirect to login
          // router.replace('/login');
        }
      } catch (error) {
        console.error('Error checking token:', error);
      }
    };
    checkToken();
  }, []);

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      setProfileData((prev) => ({ ...prev, profilePicture: pickerResult.assets[0].uri }));
    }
  };

  const handleInputChange = (key: keyof ProfileData, value: any) => {
    setProfileData((prev) => ({ ...prev, [key]: value }));
  };

  const handleMeasurementChange = (
    category: keyof ProfileData,
    value: string,
    unit: string,
    field?: 'feet' | 'inches'
  ) => {
    setProfileData((prevData) => {
      const updatedCategory = { ...prevData[category] as MeasurementValue, unit };

      if (unit === 'ft' && field) {
        updatedCategory[field] = value;
        updatedCategory.value = calculateTotalInches(updatedCategory.feet || '0', updatedCategory.inches || '0');
      } else {
        updatedCategory.value = value;
      }

      return { ...prevData, [category]: updatedCategory };
    });
  };

  const calculateTotalInches = (feet: string, inches: string): string => {
    const totalInches = (parseFloat(feet) || 0) * 12 + (parseFloat(inches) || 0);
    return totalInches.toString();
  };

  const handleSubmit = async () => {
    // Validation checks
    if (!profileData.userName) {
      setError('Name is required');
      return;
    }

    if (profileData.userName.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }

    let heightValue: number;
    if (profileData.height.unit === 'cm') {
      heightValue = parseFloat(profileData.height.value);
    } else if (profileData.height.unit === 'ft') {
      const feet = parseFloat(profileData.height.feet || '0');
      const inches = parseFloat(profileData.height.inches || '0');
      heightValue = (feet * 30.48) + (inches * 2.54); // Convert to cm
    } else {
      heightValue = NaN;
    }

    if (isNaN(heightValue) || heightValue < 100 || heightValue > 250) {
      setError('Please enter a valid height between 100cm and 250cm (or equivalent)');
      return;
    }

    const weightValue = convertToStandardUnit(profileData.weight);
    if (isNaN(weightValue) || weightValue < 30 || weightValue > 200) {
      setError('Please enter a valid weight between 30kg and 200kg (or equivalent)');
      return;
    }

    const wingspanValue = convertToStandardUnit(profileData.wingspan);
    if (isNaN(wingspanValue) || wingspanValue < 100 || wingspanValue > 250) {
      setError('Please enter a valid wingspan between 100cm and 250cm (or equivalent)');
      return;
    }

    const verticalJumpValue = convertToStandardUnit(profileData.verticalJump);
    if (isNaN(verticalJumpValue) || verticalJumpValue < 0 || verticalJumpValue > 150) {
      setError('Please enter a valid vertical jump between 0cm and 150cm (or equivalent)');
      return;
    }

    if (profileData.aboutMe.length > 500) {
      setError('About Me must be 500 characters or less');
      return;
    }

    try {
      const token = await getToken();
      console.log('Token before API call:', token);

      const formData = new FormData();

      // Append profilePicture if it exists
      if (profileData.profilePicture) {
        const response = await fetch(profileData.profilePicture);
        const blob = await response.blob();
        formData.append('profilePicture', blob, 'profile.jpg');
      }

      // Append other fields
      formData.append('userName', profileData.userName);
      formData.append('height', JSON.stringify(profileData.height));
      formData.append('weight', JSON.stringify(profileData.weight));
      formData.append('wingspan', JSON.stringify(profileData.wingspan));
      formData.append('verticalJump', JSON.stringify(profileData.verticalJump));
      formData.append('position', profileData.position);
      formData.append('aboutMe', profileData.aboutMe);
      formData.append('socialMedia', JSON.stringify(profileData.socialMedia));

      console.log('API URL:', API_ROUTES.UPDATE_PROFILE);
      console.log('FormData entries:', JSON.stringify(formData));

      const response = await authenticatedRequest(API_ROUTES.UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('API call completed. Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const updatedUser = await response.json();
      await login(await AsyncStorage.getItem('userToken') || '', updatedUser);
      await AsyncStorage.setItem('setupCompleted', 'true');
      router.replace('/(tabs)/home');
    } catch (err) {
      console.error('Detailed error in handleSubmit:', err);
      setError(`Failed to save profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('setupCompleted', 'true');
    router.replace('/(tabs)/home');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.profileImageContainer} onPress={handleImagePick}>
        {profileData.profilePicture ? (
          <Image source={{ uri: profileData.profilePicture }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.profileImagePlaceholderText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Name"
        placeholderTextColor={colors.text}
        value={profileData.userName}
        onChangeText={(value) => handleInputChange('userName', value)}
      />

      <SocialMediaSelector
        socialMedia={profileData.socialMedia}
        onSocialMediaChange={(newSocialMedia) => handleInputChange('socialMedia', newSocialMedia)}
      />

      <MeasurementField
        label="Height"
        measurement={profileData.height}
        units={['cm', 'ft']}
        onMeasurementChange={(value, unit, field) => handleMeasurementChange('height', value, unit, field)}
      />

      <MeasurementField
        label="Weight"
        measurement={profileData.weight}
        units={['kg', 'lbs']}
        onMeasurementChange={(value, unit) => handleMeasurementChange('weight', value, unit)}
      />

      <MeasurementField
        label="Wingspan"
        measurement={profileData.wingspan}
        units={['cm', 'in']}
        onMeasurementChange={(value, unit) => handleMeasurementChange('wingspan', value, unit)}
      />

      <MeasurementField
        label="Vertical Jump"
        measurement={profileData.verticalJump}
        units={['cm', 'in']}
        onMeasurementChange={(value, unit) => handleMeasurementChange('verticalJump', value, unit)}
      />

      <Text style={[styles.label, { color: colors.text }]}>Position</Text>
      <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
        <Picker
          selectedValue={profileData.position}
          onValueChange={(value) => handleInputChange('position', value)}
          style={[styles.picker, { color: colors.text }]}
        >
          <Picker.Item label="Select a position" value="" />
          <Picker.Item label="Point Guard" value="Point Guard" />
          <Picker.Item label="Shooting Guard" value="Shooting Guard" />
          <Picker.Item label="Small Forward" value="Small Forward" />
          <Picker.Item label="Power Forward" value="Power Forward" />
          <Picker.Item label="Center" value="Center" />
        </Picker>
      </View>

      <TextInput
        style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
        placeholder="About Me"
        placeholderTextColor={colors.text}
        value={profileData.aboutMe}
        onChangeText={(value) => handleInputChange('aboutMe', value)}
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
        <Text style={[styles.submitButtonText, { color: colors.text }]}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipButtonText, { color: colors.text }]}>Skip for Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    color: 'white',
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
  textArea: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  submitButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    height: 40,
  },
});
