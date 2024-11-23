import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { API_ROUTES } from '@/config/config';
import SocialMediaSelector from '@/components/custom/socialMediaSelector';
import MeasurementField from '@/components/custom/measurmentFields';
import Achievement from '@/components/custom/achivement';
import { Image as ExpoImage } from 'expo-image';
import * as VideoPicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MeasurementValue {
  value: string;
  unit: string;
  feet?: string;
  inches?: string;
}

interface SocialMedia {
  instagram: string;
  facebook: string;
  youtube: string;
  twitter: string;
}

interface ProfileData {
  displayName: string;
  userName: string;
  profilePicture: string | null;
  socialMedia: SocialMedia;
  height: MeasurementValue;
  weight: MeasurementValue;
  wingspan: MeasurementValue;
  position: string;
  verticalJump: MeasurementValue;
  aboutMe: string;
  highlightVideo: string | null;
}

const dummyAchievements = [
  { id: 1, title: "MVP 2023", rank: 1 },
  { id: 2, title: "All-Star 2022", rank: 7 },
  { id: 3, title: "Rookie of the Year", rank: 4 },
  { id: 4, title: "Scoring Champion", rank: 5 },
  { id: 5, title: "3-Point Contest Winner", rank: 6 },
];

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { getToken, checkAuthStatus } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedAchievements, setSelectedAchievements] = useState<number[]>([1, 2]);

  useEffect(() => {
    fetchUserProfile();
    fetchProfilePicture();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await getToken();
      const response = await fetch(API_ROUTES.GET_PROFILE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      
      // Convert measurements to appropriate format
      const formattedData = {
        ...data,
        height: formatMeasurement(data.height),
        weight: formatMeasurement(data.weight),
        wingspan: formatMeasurement(data.wingspan),
        verticalJump: formatMeasurement(data.verticalJump),
      };
      
      setProfileData(formattedData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    }
  };

  const formatMeasurement = (measurement: any) => {
    if (!measurement) return { value: '', unit: 'cm' };

    if (measurement.unit === 'ft') {
      const totalInches = parseFloat(measurement.value);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return {
        value: measurement.value,
        unit: 'ft',
        feet: feet.toString(),
        inches: inches.toString()
      };
    }

    return {
      value: measurement.value?.toString() || '',
      unit: measurement.unit || 'cm'
    };
  };

  const fetchProfilePicture = async () => {
    try {
      const token = await getToken();
      const response = await fetch(API_ROUTES.GET_PROFILE_PICTURE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status !== 404) { // Ignore 404 errors
          throw new Error('Failed to fetch profile picture');
        }
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('image')) {
        console.warn('Response is not an image:', contentType);
        return;
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => setImageUri(reader.result as string);
    } catch (error) {
      console.error('Error fetching profile picture:', error);
      // Don't set imageUri to null here
    }
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const token = await getToken();
        const formData = new FormData();
        formData.append('profilePicture', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);

        const response = await fetch(API_ROUTES.UPDATE_PROFILE_PICTURE, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update profile picture');
        }

        // Update local state with new image
        setImageUri(result.assets[0].uri);
        
        // Optionally refresh the entire profile data
        await fetchUserProfile();
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  const handleVideoUpload = async () => {
    try {
      const permissionResult = await VideoPicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Permission to access media library is required!');
        return;
      }

      const result = await VideoPicker.launchImageLibraryAsync({
        mediaTypes: VideoPicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        if (blob.size > 100 * 1024 * 1024) {
          Alert.alert('Error', 'Video must be smaller than 100MB');
          return;
        }

        const token = await getToken();
        const formData = new FormData();
        formData.append('highlightVideo', {
          uri: result.assets[0].uri,
          type: 'video/mp4',
          name: 'highlight.mp4',
        } as any);

        const uploadResponse = await fetch(API_ROUTES.UPDATE_HIGHLIGHT_VIDEO, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error('Failed to update highlight video');
        Alert.alert('Success', 'Highlight video uploaded successfully');
      }
    } catch (error) {
      console.error('Error updating highlight video:', error);
      Alert.alert('Error', 'Failed to update highlight video');
    }
  };

  const handleInputChange = (key: keyof ProfileData, value: any) => {
    setProfileData(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleMeasurementChange = (
    category: keyof ProfileData,
    value: string,
    unit: string,
    field?: 'feet' | 'inches'
  ) => {
    setProfileData(prevData => {
      if (!prevData) return null;
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

  const toggleAchievement = (id: number) => {
    setSelectedAchievements(prev => 
      prev.includes(id) 
        ? prev.filter(achievementId => achievementId !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    try {
      if (!profileData) return;

      const token = await getToken();
      const formData = new FormData();

      // Format the measurements before sending
      const formattedData = {
        ...profileData,
        height: formatMeasurementForSubmit(profileData.height),
        weight: formatMeasurementForSubmit(profileData.weight),
        wingspan: formatMeasurementForSubmit(profileData.wingspan),
        verticalJump: formatMeasurementForSubmit(profileData.verticalJump),
      };

      // Append all profile data except courses and achievements
      Object.entries(formattedData).forEach(([key, value]) => {
        if (key === 'courses' || key === 'achievements') return;

        if (key === 'socialMedia' || key === 'height' || key === 'weight' || 
            key === 'wingspan' || key === 'verticalJump') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(API_ROUTES.UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      // Get the updated user data from the response
      const updatedUserData = await response.json();

      // Update AsyncStorage with new user details
      await AsyncStorage.setItem('userDetails', JSON.stringify(updatedUserData));

      // Trigger a refresh of the auth context
      await checkAuthStatus();

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            router.push({
              pathname: '/(tabs)/profile',
              params: { refresh: Date.now() }
            });
          }
        }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  // Add this helper function to format measurements for submission
  const formatMeasurementForSubmit = (measurement: MeasurementValue) => {
    if (!measurement || !measurement.value) {
      return null;
    }

    // Convert feet/inches to total inches if unit is 'ft'
    if (measurement.unit === 'ft' && measurement.feet && measurement.inches) {
      const totalInches = (parseFloat(measurement.feet) * 12) + parseFloat(measurement.inches);
      return {
        value: totalInches,
        unit: measurement.unit
      };
    }

    return {
      value: parseFloat(measurement.value),
      unit: measurement.unit
    };
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.profileImageContainer}>
        {imageUri ? (
          <ExpoImage source={{ uri: imageUri }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.profileImagePlaceholderText}>Add Photo</Text>
          </View>
        )}
        <TouchableOpacity style={styles.changePhotoButton} onPress={handleImagePick}>
          <MaterialCommunityIcons name="camera" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Display Name *"
        placeholderTextColor={colors.text}
        value={profileData?.displayName}
        onChangeText={(value) => handleInputChange('displayName', value)}
      />

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="UserName"
        placeholderTextColor={colors.text}
        value={profileData?.userName}
        onChangeText={(value) => handleInputChange('userName', value)}
      />

      <SocialMediaSelector
        socialMedia={{
          instagram: profileData?.socialMedia?.instagram || '',
          facebook: profileData?.socialMedia?.facebook || '',
          youtube: profileData?.socialMedia?.youtube || '',
          twitter: profileData?.socialMedia?.twitter || ''
        }}
        onSocialMediaChange={(newSocialMedia) => handleInputChange('socialMedia', {
          instagram: newSocialMedia.instagram || '',
          facebook: newSocialMedia.facebook || '',
          youtube: newSocialMedia.youtube || '',
          twitter: newSocialMedia.twitter || ''
        })}
      />

      <MeasurementField
        label="Height"
        measurement={profileData?.height ?? { value: '', unit: 'cm' }}
        units={['cm', 'ft']}
        onMeasurementChange={(value, unit, field) => handleMeasurementChange('height', value, unit, field)}
      />

      <MeasurementField
        label="Weight"
        measurement={profileData?.weight ?? { value: '', unit: 'kg' }}
        units={['kg', 'lbs']}
        onMeasurementChange={(value, unit) => handleMeasurementChange('weight', value, unit)}
      />

      <MeasurementField
        label="Wingspan"
        measurement={profileData?.wingspan ?? { value: '', unit: 'cm' }}
        units={['cm', 'in']}
        onMeasurementChange={(value, unit) => handleMeasurementChange('wingspan', value, unit)}
      />

      <MeasurementField
        label="Vertical Jump"
        measurement={profileData?.verticalJump ?? { value: '', unit: 'cm' }}
        units={['cm', 'in']}
        onMeasurementChange={(value, unit) => handleMeasurementChange('verticalJump', value, unit)}
      />

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="Position"
        placeholderTextColor={colors.text}
        value={profileData?.position}
        onChangeText={(value) => handleInputChange('position', value)}
      />

      <TextInput
        style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
        placeholder="About Me"
        placeholderTextColor={colors.text}
        value={profileData?.aboutMe}
        onChangeText={(value) => handleInputChange('aboutMe', value)}
        multiline
      />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Highlights Video</Text>
        <TouchableOpacity 
          style={[styles.uploadButton, { borderColor: colors.border }]} 
          onPress={handleVideoUpload}
        >
          <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
            Upload New Video
          </Text>
        </TouchableOpacity>
        <Text style={[styles.helperText, { color: colors.text }]}>
          Maximum video size: 100MB
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { title: "MVP 2023", rank: 1 },
            { title: "All-Star 2022", rank: 2 },
            { title: "Scoring Champion", rank: 3 },
          ].map((achievement, index) => (
            <View key={index} style={styles.achievementContainer}>
              <Achievement title={achievement.title} rank={achievement.rank} />
              <TouchableOpacity style={styles.removeButton}>
                <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Other Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { title: "Rookie of the Year", rank: 4 },
            { title: "3-Point Contest Winner", rank: 5 },
            { title: "Most Improved Player", rank: 6 },
          ].map((achievement, index) => (
            <View key={index} style={styles.achievementContainer}>
              <Achievement title={achievement.title} rank={achievement.rank} />
              <TouchableOpacity style={styles.addButton}>
                <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
        <Text style={[styles.submitButtonText, { color: colors.background }]}>Save Changes</Text>
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
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop : 40
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
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  uploadButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  uploadButtonText: {
    fontSize: 16,
  },
  achievementContainer: {
    position: 'relative',
    marginRight: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  addButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  submitButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
});