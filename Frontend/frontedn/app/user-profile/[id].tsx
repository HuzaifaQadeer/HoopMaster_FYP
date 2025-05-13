import * as React from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity,  
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image as ExpoImage } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ROUTES } from '@/config/config';
import { useAuth } from '@/context/AuthContext';
import Achievement from '@/components/custom/achivement';

// Define interfaces
interface User {
  _id: string;
  username: string;
  displayName: string;
  bio?: string;
  profilePicture?: string;
  highlightVideo?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
  };
  height?: {
    value: number;
    unit: string;
  };
  weight?: {
    value: number;
    unit: string;
  };
  wingspan?: {
    value: number;
    unit: string;
  };
  verticalJump?: {
    value: number;
    unit: string;
  };
  position?: string;
  aboutMe?: string;
  isPremium: boolean;
  isPrivate: boolean;
  stats: {
    postsCount: number;
    attemptCount: number;
    achievementCount: number;
  };
}

interface Achievement {
  _id: string;
  title: string;
  description?: string;
  position: number;
  challenge: {
    _id: string;
    title: string;
  };
  awardedAt: string;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const { isAuthenticated, getToken } = useAuth();
  
  // State variables
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [loadingAchievements, setLoadingAchievements] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [videoUri, setVideoUri] = React.useState<string | null>(null);

  // Cache user profile data
  const cacheUserProfile = async (userData: User, userImage: string | null, userVideo: string | null) => {
    try {
      if (userData) {
        // Create separate cache entries for media and user data
        const userDataOnly = {
          ...userData,
          profilePicture: undefined, // Remove large media data
          highlightVideo: undefined,
        };

        // Check if data is too large before caching
        const userDataString = JSON.stringify({
          user: userDataOnly,
          timestamp: Date.now()
        });

        // If user data is too large, only cache essential information
        if (userDataString.length > 1000000) { // 1MB limit
          const essentialData = {
            _id: userData._id,
            username: userData.username,
            displayName: userData.displayName,
            isPremium: userData.isPremium,
            isPrivate: userData.isPrivate,
            stats: userData.stats,
            timestamp: Date.now()
          };
          await AsyncStorage.setItem(
            `user_profile_${userData._id}_data`,
            JSON.stringify(essentialData)
          );
        } else {
          await AsyncStorage.setItem(
            `user_profile_${userData._id}_data`,
            userDataString
          );
        }

        // Handle image caching with size check and compression
        if (userImage) {
          try {
            // Check if the image is a data URL
            if (userImage.startsWith('data:image')) {
              // Extract the base64 part of the data URL
              const base64Data = userImage.split(',')[1];
              
              // Check if the base64 data is too large (roughly 500KB limit)
              if (base64Data.length > 500000) {
                console.log('Image too large to cache, skipping...');
                return;
              }
              
              // Store only the base64 data without the data URL prefix
              await AsyncStorage.setItem(
                `user_profile_${userData._id}_image`,
                base64Data
              );
            } else if (userImage.startsWith('http')) {
              // For HTTP URLs, store the URL directly
              await AsyncStorage.setItem(
                `user_profile_${userData._id}_image_url`,
                userImage
              );
            }
          } catch (error) {
            console.warn('Failed to cache image:', error);
          }
        }

        // Cache video separately if exists and not too large
        if (userVideo && userVideo.length < 5000000) { // 5MB limit for videos
          await AsyncStorage.setItem(
            `user_profile_${userData._id}_video`,
            userVideo
          );
        }

        console.log('User profile cached successfully');
      }
    } catch (error) {
      console.error('Error caching user profile:', error);
      // Clean up any partial cache data
      try {
        await AsyncStorage.multiRemove([
          `user_profile_${userData._id}_data`,
          `user_profile_${userData._id}_image`,
          `user_profile_${userData._id}_image_url`,
          `user_profile_${userData._id}_video`
        ]);
      } catch (cleanupError) {
        console.error('Error cleaning up cache:', cleanupError);
      }
    }
  };

  // Retrieve cached user profile
  const getCachedUserProfile = async (): Promise<{ 
    user: User | null, 
    imageUri: string | null, 
    videoUri: string | null 
  }> => {
    try {
      if (!id) return { user: null, imageUri: null, videoUri: null };
      
      // Get core user data
      const cachedUserData = await AsyncStorage.getItem(`user_profile_${id}_data`);
      if (cachedUserData) {
        const parsedData = JSON.parse(cachedUserData);
        
        // Check if cache is still valid (less than 1 hour old)
        const now = Date.now();
        const cacheAge = now - parsedData.timestamp;
        const cacheValidityPeriod = 60 * 60 * 1000; // 1 hour in milliseconds
        
        if (cacheAge < cacheValidityPeriod) {
          // Get cached image and video separately
          let cachedImage = null;
          let cachedVideo = null;
          
          try {
            // Try to get cached image data
            const imageData = await AsyncStorage.getItem(`user_profile_${id}_image`);
            if (imageData) {
              // If we have base64 data, reconstruct the data URL
              cachedImage = `data:image/jpeg;base64,${imageData}`;
            } else {
              // Try to get cached image URL
              const imageUrl = await AsyncStorage.getItem(`user_profile_${id}_image_url`);
              if (imageUrl) {
                cachedImage = imageUrl;
              }
            }
          } catch (error) {
            console.warn('Error retrieving cached image:', error);
          }
          
          try {
            cachedVideo = await AsyncStorage.getItem(`user_profile_${id}_video`);
          } catch (error) {
            console.warn('Error retrieving cached video:', error);
          }
          
          console.log('Using cached user profile data');
          return {
            user: parsedData.user,
            imageUri: cachedImage,
            videoUri: cachedVideo
          };
        } else {
          console.log('Cached user profile data is expired');
          // Clean up expired cache
          await AsyncStorage.multiRemove([
            `user_profile_${id}_data`,
            `user_profile_${id}_image`,
            `user_profile_${id}_image_url`,
            `user_profile_${id}_video`
          ]);
        }
      }
    } catch (error) {
      console.error('Error retrieving cached user profile:', error);
      // Clean up potentially corrupted cache
      try {
        await AsyncStorage.multiRemove([
          `user_profile_${id}_data`,
          `user_profile_${id}_image`,
          `user_profile_${id}_image_url`,
          `user_profile_${id}_video`
        ]);
      } catch (cleanupError) {
        console.error('Error cleaning up cache:', cleanupError);
      }
    }
    
    return { user: null, imageUri: null, videoUri: null };
  };

  // Fetch user profile
  const fetchUserProfile = React.useCallback(async () => {
    if (!id) {
      console.error('[Debug] User profile fetch failed: No ID provided');
      return;
    }
    
    try {
      setLoading(true);
      
      // Try to get cached profile data first
      const cachedProfile = await getCachedUserProfile();
      if (cachedProfile.user) {
        setUser(cachedProfile.user);
        setImageUri(cachedProfile.imageUri);
        setVideoUri(cachedProfile.videoUri);
        setLoading(false);
        return;
      }
      
      // If no cache or expired cache, fetch from API
      const token = await getToken();
      const response = await fetch(API_ROUTES.GET_USER_PROFILE.replace(':id', id as string), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      setUser(data);

      let fetchedImageUri: string | null = null;
      let fetchedVideoUri: string | null = null;

      // Fetch profile picture if available
      if (data.profilePicture) {
        try {
          // Using a dynamic URL or data URI if the profile picture is already a full URL
          if (data.profilePicture.startsWith('http') || data.profilePicture.startsWith('data:')) {
            fetchedImageUri = data.profilePicture;
            setImageUri(fetchedImageUri);
          } else {
            // If it's just a filename, construct a proper URL to fetch it
            const pictureUrl = API_ROUTES.GET_USER_PROFILE_PICTURE.replace(':id', id as string);
            const pictureResponse = await fetch(pictureUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (pictureResponse.ok) {
              const blob = await pictureResponse.blob();
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => {
                fetchedImageUri = reader.result as string;
                setImageUri(fetchedImageUri);
                // Update cache after all data is fetched
                cacheUserProfile(data, fetchedImageUri, fetchedVideoUri);
              };
            }
          }
        } catch (error) {
          // Silently handle image loading error and use default image
          setImageUri("https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg");
        }
      }

      // Fetch highlight video if available
      if (data.highlightVideo) {
        try {
          // Using a dynamic URL or data URI if the highlight video is already a full URL
          if (data.highlightVideo.startsWith('http') || data.highlightVideo.startsWith('data:')) {
            fetchedVideoUri = data.highlightVideo;
            setVideoUri(fetchedVideoUri);
          } else {
            // If it's just a filename, construct a proper URL to fetch it
            const videoUrl = API_ROUTES.GET_USER_HIGHLIGHT_VIDEO.replace(':id', id as string);
            const videoResponse = await fetch(videoUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (videoResponse.ok) {
              const blob = await videoResponse.blob();
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => {
                fetchedVideoUri = reader.result as string;
                setVideoUri(fetchedVideoUri);
                // Update cache after all data is fetched
                cacheUserProfile(data, fetchedImageUri, fetchedVideoUri);
              };
            }
          }
        } catch (error) {
          // Silently handle video loading error
        }
      }
      
      // Cache the profile data if we didn't need to process blob data
      if ((!data.profilePicture || (data.profilePicture && data.profilePicture.startsWith('http'))) &&
          (!data.highlightVideo || (data.highlightVideo && data.highlightVideo.startsWith('http')))) {
        cacheUserProfile(data, fetchedImageUri, fetchedVideoUri);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  // Fetch user achievements
  const fetchUserAchievements = React.useCallback(async () => {
    if (!id || !isAuthenticated) return;
    
    try {
      setLoadingAchievements(true);
      const token = await getToken();
      
      // Check if the route exists
      if (!API_ROUTES.GET_USER_ACHIEVEMENTS) {
        console.error('Achievement route is not defined');
        return;
      }
      
      const achievementsUrl = API_ROUTES.GET_USER_ACHIEVEMENTS.replace(':id', id.toString());
      console.log('Fetching achievements from:', achievementsUrl);
      
      const response = await fetch(achievementsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user achievements:', response.status);
        throw new Error('Failed to fetch user achievements');
      }
      
      const data = await response.json();
      console.log('User achievements data:', data);
      setAchievements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      setAchievements([]); // Set empty array on error
    } finally {
      setLoadingAchievements(false);
    }
  }, [id, getToken, isAuthenticated]);

  // Initial data loading
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
      fetchUserAchievements();
    }
  }, [fetchUserProfile, fetchUserAchievements, isAuthenticated]);

  // Handle refresh
  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchUserAchievements()]);
    setRefreshing(false);
  }, [fetchUserProfile, fetchUserAchievements]);

  // Check if authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to view user profiles',
        [
          { text: 'Cancel', onPress: () => router.back() },
          { text: 'Login', onPress: () => router.replace('/login') }
        ]
      );
    }
  }, [isAuthenticated, router]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen 
          options={{
            title: 'User Profile',
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state if user not found
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen 
          options={{
            title: 'User Profile',
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.text} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            User not found or has been deleted
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: user.displayName || user.username,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
        }}
      />
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
        style={styles.scrollView}
      >
        <View style={styles.profilePictureContainer}>
          {imageUri ? (
            <ExpoImage
              source={{ uri: imageUri }}
              style={styles.profilePicture}
              contentFit="cover"
              transition={1000}
              onError={(error) => {
                console.log('Failed to load image:', error);
                setImageUri("https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg");
              }}
            />
          ) : (
            <View style={[styles.profilePicture, { backgroundColor: '#FFA500' }]}>
              <Ionicons name="person" size={50} color="white" />
            </View>
          )}
        </View>

        <View style={styles.centerAlign}>
          <Text style={[styles.displayName, { color: colors.text }]}>
            {user.displayName || user.username}
          </Text>
          {user.username && (
            <Text style={[styles.username, { color: colors.text }]}>
              @{user.username}
            </Text>
          )}

          <View style={styles.statsOverview}>
            <View style={styles.statOverviewItem}>
              <Text style={[styles.statOverviewValue, { color: colors.text }]}>
                {user.stats?.postsCount || 0}
              </Text>
              <Text style={[styles.statOverviewLabel, { color: colors.text }]}>Posts</Text>
            </View>
            <View style={styles.statOverviewItem}>
              <Text style={[styles.statOverviewValue, { color: colors.text }]}>
                {user.stats?.achievementCount || 0}
              </Text>
              <Text style={[styles.statOverviewLabel, { color: colors.text }]}>Achievements</Text>
            </View>
          </View>
          
          <View style={styles.socialsContainer}>
            {user.socialMedia?.instagram && (
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => console.log('Instagram link:', user.socialMedia?.instagram)}
              >
                <Ionicons name="logo-instagram" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
            {user.socialMedia?.facebook && (
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => console.log('Facebook link:', user.socialMedia?.facebook)}
              >
                <Ionicons name="logo-facebook" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
            {user.socialMedia?.youtube && (
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => console.log('YouTube link:', user.socialMedia?.youtube)}
              >
                <Ionicons name="logo-youtube" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
            {user.socialMedia?.twitter && (
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => console.log('Twitter link:', user.socialMedia?.twitter)}
              >
                <Ionicons name="logo-twitter" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
            {!user.socialMedia?.instagram && !user.socialMedia?.facebook && 
              !user.socialMedia?.youtube && !user.socialMedia?.twitter && (
              <Text style={{color: colors.text, fontStyle: 'italic'}}>No social media links</Text>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Highlights</Text>
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
              <Text style={[styles.noVideoText, { color: colors.text }]}>
                No highlight video available
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Stats</Text>
          <View style={styles.statsContainer}>
            {user.height && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Height</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {`${user.height.value} ${user.height.unit}`}
                </Text>
              </View>
            )}
            {user.weight && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Weight</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {`${user.weight.value} ${user.weight.unit}`}
                </Text>
              </View>
            )}
            {user.wingspan && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Wingspan</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {`${user.wingspan.value} ${user.wingspan.unit}`}
                </Text>
              </View>
            )}
            {user.verticalJump && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Vertical Jump</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {`${user.verticalJump.value} ${user.verticalJump.unit}`}
                </Text>
              </View>
            )}
            {user.position && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text }]}>Position</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{user.position}</Text>
              </View>
            )}
          </View>
        </View>

        {user.aboutMe && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
            <Text style={[styles.aboutMeText, { color: colors.text }]}>{user.aboutMe}</Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
          {loadingAchievements ? (
            <ActivityIndicator size="small" color="#FF6B00" style={styles.loader} />
          ) : achievements.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {achievements.map((achievement) => (
                <Achievement 
                  key={achievement._id}
                  id={achievement._id}
                  title={achievement.title}
                  description={achievement.description}
                  position={achievement.position}
                  challenge={achievement.challenge}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.noItemsText, { color: colors.text }]}>
              No achievements yet
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  profilePictureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40, // Increased top margin
  },
  profilePicture: {
    width: 120, // Increased size
    height: 120, // Increased size
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAlign: {
    alignItems: 'center',
    marginVertical: 24, // Increased vertical margin
  },
  displayName: {
    fontSize: 28, // Increased font size
    fontWeight: 'bold',
    textAlign: 'center',
  },
  username: {
    fontSize: 18, // Increased font size
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    opacity: 0.8,
  },
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginVertical: 16,
    paddingVertical: 8,
  },
  statOverviewItem: {
    alignItems: 'center',
  },
  statOverviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statOverviewLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  socialsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  socialIcon: {
    marginHorizontal: 12,
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
    lineHeight: 20,
  },
  loader: {
    padding: 16,
  },
  noItemsText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
}); 