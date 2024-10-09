import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import SocialMediaSelector from '@/components/custom/socialMediaSelector';
import MeasurementField from '@/components/custom/measurmentFields';
import Achievement from '@/components/custom/achivement';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

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
  highlightsVideo: string | null;
}

interface AchievementData {
  id: string;
  title: string;
  rank : number;
}

const dummyAchievements: AchievementData[] = [
  { id: '1', title: 'MVP 2023', rank:1 },
  { id: '2', title: 'All-Star 2022', rank:6  },
  { id: '3', title: 'Rookie of the Year', rank:51  },
  { id: '4', title: 'Scoring Champion', rank:22  },
  { id: '5', title: '3-Point Contest Winner', rank:3  },
];

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile data');
    }
  };

  const [activeAchievements, setActiveAchievements] = useState<string[]>(['1', '2', '5']);

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
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
        formData.append('profilePicture', new File([pickerResult.assets[0].uri], 'profile.jpg', { type: 'image/jpeg' }));
        const response = await fetch('/api/users/profile-picture', {
          method: 'PUT',
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (!response.ok) {
          throw new Error('Failed to upload profile picture');
        }
        setProfileData(prev => prev ? { ...prev, profilePicture: pickerResult.assets[0].uri } : null);
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        Alert.alert('Error', 'Failed to upload profile picture');
      }
    }
  };

  const handleVideoUpload = () => {
    Alert.alert(
      'Upload Video',
      'This would typically open a video picker. For now, we\'ll simulate a successful upload.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'OK', 
          onPress: () => {
            setProfileData((prev) => 
              prev ? { ...prev, highlightsVideo: 'https://example.com/new-highlights.mp4' } : null
            );
            Alert.alert('Success', 'Video uploaded successfully!');
          }
        }
      ]
    );
  };

  const handleInputChange = (key: keyof ProfileData, value: any) => {
    setProfileData((prev) => {
      if (!prev) return {} as ProfileData; // Initialize if null
      return { ...prev, [key]: value };
    });
  };

  const handleMeasurementChange = (
    category: keyof ProfileData,
    value: string,
    unit: string,
    field?: 'feet' | 'inches'
  ) => {
    setProfileData((prevData) => {
      if (!prevData) return null;
      const updatedCategory = { ...prevData[category] as MeasurementValue, unit };

      if (unit === 'ft' && field) {
        updatedCategory[field] = value;
        updatedCategory.value = calculateTotalInches(updatedCategory.feet || '0', updatedCategory.inches || '0');
      } else {
        updatedCategory.value = value;
      }

      return {
        ...prevData,
        [category]: updatedCategory
      };
    });
  };

  const calculateTotalInches = (feet: string, inches: string): string => {
    const totalInches = (parseFloat(feet) || 0) * 12 + (parseFloat(inches) || 0);
    return totalInches.toString();
  };

  const toggleAchievement = (id: string) => {
    setActiveAchievements(prev =>
      prev.includes(id) ? prev.filter(achievementId => achievementId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!profileData?.displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.profileImageContainer}>
        {profileData?.profilePicture ? (
          <Image source={{ uri: profileData.profilePicture }} style={styles.profileImage} />
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
        socialMedia={profileData?.socialMedia ?? {}}
        onSocialMediaChange={(newSocialMedia) => handleInputChange('socialMedia', newSocialMedia)}
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
        <TouchableOpacity style={[styles.uploadButton, { borderColor: colors.border }]} onPress={handleVideoUpload}>
          <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
            {profileData?.highlightsVideo ? 'Change Video' : 'Upload Video'}
          </Text>
        </TouchableOpacity>
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
});