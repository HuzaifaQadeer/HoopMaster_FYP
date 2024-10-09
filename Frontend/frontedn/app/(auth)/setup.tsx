import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import SocialMediaSelector from '@/components/custom/socialMediaSelector';
import MeasurementField from '@/components/custom/measurmentFields';

interface MeasurementValue {
  value: string;
  unit: string;
  feet?: string;
  inches?: string;
}

interface ProfileData {
  displayName: string;
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

export default function ProfileSetupScreen() {
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
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

  const { login, getToken } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

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
      try {
        const token = await getToken();
        const formData = new FormData();
        const imageResponse = await fetch(pickerResult.assets[0].uri);
        const blob = await imageResponse.blob();
        formData.append('profilePicture', blob, 'profile.jpg');
        
        const response = await fetch('/api/users/profile-picture', {
          method: 'PUT',
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload profile picture');
        }

        setProfileData((prev) => ({ ...prev, profilePicture: pickerResult.assets[0].uri }));
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        Alert.alert('Error', 'Failed to upload profile picture');
      }
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
    if (!profileData.displayName) {
      setError('Display name is required');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const updatedUser = await response.json();
      if (token) {
        await login(token, updatedUser); // Update the user in AuthContext
        router.replace('/(tabs)/home');
      } else {
        // Handle the case where token is null
        console.error('Token is null');
      }
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    }
  };

  const handleSkip = async () => {
    if (!profileData.displayName) {
      setError('Please fill the necessary credentials (Display Name)');
      return;
    }
    
    try {
      const token = await getToken();
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: profileData.displayName }),
      });

      if (!response.ok) {
        throw new Error('Failed to save display name');
      }

      const updatedUser = await response.json();
      if (token) {
        await login(token, updatedUser); // Update the user in AuthContext
        router.replace('/(tabs)/home');
      } else {
        // Handle the case where token is null
        console.error('Token is null');
      }
    } catch (err) {
      setError('Failed to save display name. Please try again.');
    }
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
        placeholder="Display Name *"
        placeholderTextColor={colors.text}
        value={profileData.displayName}
        onChangeText={(value) => handleInputChange('displayName', value)}
      />

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="UserName"
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

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Position"
        placeholderTextColor={colors.text}
        value={profileData.position}
        onChangeText={(value) => handleInputChange('position', value)}
      />

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
});