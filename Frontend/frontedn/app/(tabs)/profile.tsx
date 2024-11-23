import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LightTheme, CustomDarkTheme } from '@/constants/Colors';
import { useAuth } from '../../context/AuthContext';
import Course from '@/components/custom/course';
import Achievement from '@/components/custom/achivement';
import SocialIcons from '@/components/custom/renderSocialIcons';
import { useRouter } from 'expo-router';
import { API_ROUTES } from '@/config/config';
import { Image as ExpoImage } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Link } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  profilePicture?: string;
  displayName: string;
  userName: string;
  height?: { value: number; unit: string };
  weight?: { value: number; unit: string };
  wingspan?: { value: number; unit: string };
  verticalJump?: { value: number; unit: string };
  position?: string;
  aboutMe?: string;
  isPremium: boolean;
  isPrivate: boolean;
  socialMedia: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
  };
  highlightVideo?: string;
}

const UserProfileScreen: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const { logout, getToken } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? CustomDarkTheme : LightTheme;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const { refresh } = useLocalSearchParams();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const captureViewRef = React.useRef(null);

  useEffect(() => {
    fetchUserProfile();
  }, [refresh]);

  useEffect(() => {
    if (userProfile?.profilePicture) {
      const fetchProfilePicture = async () => {
        try {
          const token = await getToken();
          const response = await fetch(API_ROUTES.GET_PROFILE_PICTURE, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!response.ok) {
            if (response.status !== 404) { // Ignore 404 errors as they're expected when no picture exists
              throw new Error(`Failed to fetch profile picture: ${response.status}`);
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
          reader.onloadend = () => {
            const base64data = reader.result;
            setImageUri(base64data as string);
          };

        } catch (error) {
          console.error('Error fetching profile picture:', error);
          // Don't set imageUri to null here, keep the previous value if any
        }
      };

      fetchProfilePicture();
    }
  }, [userProfile?.profilePicture]);

  useEffect(() => {
    if (userProfile?.highlightVideo) {
      const fetchHighlightVideo = async () => {
        try {
          const token = await getToken();
          const response = await fetch(API_ROUTES.GET_HIGHLIGHT_VIDEO, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch highlight video: ${response.status}`);
          }

          // Get the raw data as base64
          const blob = await response.blob();
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64data = reader.result;
            setVideoUri(base64data as string);
          };

        } catch (error) {
          console.error('Error fetching highlight video:', error);
          setVideoUri(null);
        }
      };

      fetchHighlightVideo();
    }
  }, [userProfile?.highlightVideo]);

  const fetchUserProfile = async () => {
    try {
      // Try to get cached data first
      const userDetailsJson = await AsyncStorage.getItem('userDetails');
      if (!userDetailsJson) {
        // No cached data, make API call
        const token = await getToken();
        const response = await fetch(API_ROUTES.GET_PROFILE, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setUserProfile(data);
        // Cache the data
        await AsyncStorage.setItem('userDetails', JSON.stringify(data));
        return;
      }

      // Use cached data
      const userDetails = JSON.parse(userDetailsJson);
      setUserProfile(userDetails);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const togglePrivacy = async () => {
    try {
      const token = await getToken();
      const response = await fetch(API_ROUTES.TOGGLE_PRIVACY, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      if (!response.ok) {
        throw new Error('Failed to toggle privacy');
      }
      const data = await response.json();
      
      // Update state
      setUserProfile(prev => prev ? { ...prev, isPrivate: data.isPrivate } : null);
      
      // Update AsyncStorage
      const userDetailsJson = await AsyncStorage.getItem('userDetails');
      if (userDetailsJson) {
        const userDetails = JSON.parse(userDetailsJson);
        const updatedDetails = { ...userDetails, isPrivate: data.isPrivate };
        await AsyncStorage.setItem('userDetails', JSON.stringify(updatedDetails));
      }
    } catch (error) {
      console.error('Error toggling privacy:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const courses = [
    { id: '2', name: 'Handles mastery', completion: 25, isPremium: false, imageUrl: 'https://example.com/course1.jpg' },
    { id: '3', name: 'Elite footwork', completion: 99, isPremium: false, imageUrl: 'https://example.com/course1.jpg' }
  ];

  // achievementData.ts

const achievementData = [
  { id: 1, title: "Community challange#1", rank: 1 },
  { id: 2, title: "Community challange#1", rank: 7 },
];

  const captureAndShare = async () => {
    try {
      setShowOptions(false);
      await new Promise(resolve => setTimeout(resolve, 100));
      if (captureViewRef.current) {
        const uri = await captureRef(captureViewRef, {
          format: 'jpg',
          quality: 0.8,
          result: 'tmpfile'
        });

        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share your profile'
        });
      }
    } catch (error) {
      console.error('Error capturing or sharing screenshot:', error);
    }
  };

  const renderOptionsMenu = () => (
    <View style={[styles.optionsMenu, { backgroundColor: theme.colors.card }]}>
      <TouchableOpacity style={styles.optionItem}>
        <Text style={[styles.optionText, { color: theme.colors.text }]}>
          {userProfile?.isPremium ? "Premium Account" : "Upgrade to Premium"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionItem} onPress={togglePrivacy}>
        <Text style={[styles.optionText, { color: theme.colors.text }]}>
          {userProfile?.isPrivate ? "Set Account to Public" : "Set Account to Private"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.optionItem} 
        onPress={() => router.push('/editprofile')}
      >
        <Text style={[styles.optionText, { color: theme.colors.text }]}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionItem} onPress={handleLogout}>
        <Text style={[styles.optionText, { color: theme.colors.text }]}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionItem} onPress={captureAndShare}>
        <Text style={[styles.optionText, { color: theme.colors.text }]}>Share Profile</Text>
      </TouchableOpacity>
    </View>
  );


  const renderHighlights = () => (
    <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Highlights</Text>
      <View style={styles.videoContainer}>
        {videoUri ? (
          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
        ) : (
          <Text style={[styles.noVideoText, { color: theme.colors.text }]}>
            No highlight video available
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.optionsButton} onPress={() => setShowOptions(!showOptions)}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      {showOptions && renderOptionsMenu()}
      
      <View ref={captureViewRef} style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.profilePictureContainer}>
          {imageUri ? (
            <ExpoImage
              source={{ uri: imageUri }}
              style={styles.profilePicture}
              contentFit="cover"
              transition={1000}
            />
          ) : (
            <View style={[styles.profilePicture, { backgroundColor: '#FFA500' }]}>
              <Ionicons name="person" size={50} color="white" />
            </View>
          )}
        </View>

        <View style={styles.centerAlign}>
          <Text style={[styles.displayName, { color: theme.colors.text }]}>
            {userProfile?.displayName}
          </Text>
          <Text style={[styles.username, { color: theme.colors.text }]}>
            {userProfile?.userName}
          </Text>
          
          <View style={styles.socialsContainer}>
            {userProfile?.socialMedia?.instagram && (
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL(`https://instagram.com/${userProfile.socialMedia.instagram}`)}
              >
                <Ionicons name="logo-instagram" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            )}
            {userProfile?.socialMedia?.facebook && (
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL(`https://facebook.com/${userProfile.socialMedia.facebook}`)}
              >
                <Ionicons name="logo-facebook" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            )}
            {userProfile?.socialMedia?.youtube && (
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL(`https://youtube.com/${userProfile.socialMedia.youtube}`)}
              >
                <Ionicons name="logo-youtube" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            )}
            {userProfile?.socialMedia?.twitter && (
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => Linking.openURL(`https://twitter.com/${userProfile.socialMedia.twitter}`)}
              >
                <Ionicons name="logo-twitter" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        


        {renderHighlights()}

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Stats</Text>
          <View style={styles.statsContainer}>
            {userProfile?.height && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Height</Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {`${userProfile.height.value} ${userProfile.height.unit}`}
                </Text>
              </View>
            )}
            {userProfile?.weight && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Weight</Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {`${userProfile.weight.value} ${userProfile.weight.unit}`}
                </Text>
              </View>
            )}
            {userProfile?.wingspan && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Wingspan</Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {`${userProfile.wingspan.value} ${userProfile.wingspan.unit}`}
                </Text>
              </View>
            )}
            {userProfile?.verticalJump && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Vertical Jump</Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {`${userProfile.verticalJump.value} ${userProfile.verticalJump.unit}`}
                </Text>
              </View>
            )}
            {userProfile?.position && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Position</Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{userProfile.position}</Text>
              </View>
            )}
          </View>
        </View>
        
        {userProfile?.aboutMe && (
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About Me</Text>
            <Text style={[styles.aboutMeText, { color: theme.colors.text }]}>{userProfile.aboutMe}</Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Courses</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {courses.map((course) => (
              <Course key={course.id} {...course} />
            ))}
          </ScrollView>
        </View>
        
        
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {achievementData.map((data) => (
              <Achievement key={data.id} {...data} />
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
  },
  profilePictureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop : -30
  },
  optionsButton: {
    padding: 8,
  },
  optionsMenu: {
    position: 'absolute',
    top: 90,
    right: 16,
    borderRadius: 8,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  optionItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
  },
  centerAlign: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  username: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  videoContainer: {
    height: 200,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  noVideoText: {
    fontSize: 16,
  },
  socialsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  socialIcon: {
    marginHorizontal: 8,
    padding: 8,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'column',
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  aboutMeText: {
    fontSize: 14,
  },
});

export default UserProfileScreen;
