import React, { useState, useEffect, useCallback } from 'react';
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
  useWindowDimensions,
  SafeAreaView
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { TabView, TabBar } from 'react-native-tab-view';

import { API_ROUTES } from '@/config/config';
import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/custom/PostCard';
import Achievement from '@/components/custom/achievement';
import AttemptCard from '@/components/custom/AttemptCard';

// Define interfaces
interface User {
  _id: string;
  username: string;
  displayName: string;
  bio?: string;
  profilePicture?: string;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
  stats: {
    postsCount: number;
    attemptCount: number;
    achievementCount: number;
  };
}

interface Post {
  _id: string;
  content: string;
  userId: {
    _id: string;
    displayName: string;
    username: string;
    profilePicture?: string;
  };
  createdAt: string;
  likes: string[];
  commentCount: number;
  hasMedia: boolean;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  isPrivate: boolean;
  isLiked?: boolean;
}

interface Achievement {
  _id: string;
  title: string;
  description?: string;
  position: number;
  challenge: {
    _id: string;
    title: string;
    description?: string;
  };
  awardedAt: string;
}

interface Attempt {
  _id: string;
  videoUrl: string;
  votes: string[];
  userId: {
    _id: string;
    displayName: string;
    username: string;
    profilePicture?: string;
  };
  challengeId: {
    _id: string;
    title: string;
    description?: string;
  };
  createdAt: string;
  status: string;
}

interface Tab {
  key: string;
  title: string;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const { isAuthenticated, getToken, user: currentUser } = useAuth();
  const layout = useWindowDimensions();
  
  // State variables
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Tab state
  const [index, setIndex] = useState(0);
  const [routes] = useState<Tab[]>([
    { key: 'posts', title: 'Posts' },
    { key: 'achievements', title: 'Achievements' },
    { key: 'attempts', title: 'Attempts' }
  ]);
  
  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!id || !isAuthenticated) return;
    
    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch(`${API_ROUTES.GET_USER_PROFILE}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [id, getToken, isAuthenticated]);
  
  // Fetch user posts
  const fetchUserPosts = useCallback(async () => {
    if (!id || !isAuthenticated) return;
    
    try {
      setLoadingPosts(true);
      const token = await getToken();
      
      const response = await fetch(`${API_ROUTES.GET_USER_POSTS}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user posts');
      }
      
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      Alert.alert('Error', 'Failed to load user posts');
    } finally {
      setLoadingPosts(false);
    }
  }, [id, getToken, isAuthenticated]);
  
  // Fetch user achievements
  const fetchUserAchievements = useCallback(async () => {
    if (!id || !isAuthenticated) return;
    
    try {
      setLoadingAchievements(true);
      const token = await getToken();
      
      const response = await fetch(`${API_ROUTES.GET_USER_ACHIEVEMENTS}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user achievements');
      }
      
      const data = await response.json();
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      Alert.alert('Error', 'Failed to load user achievements');
    } finally {
      setLoadingAchievements(false);
    }
  }, [id, getToken, isAuthenticated]);
  
  // Fetch user challenge attempts
  const fetchUserAttempts = useCallback(async () => {
    if (!id || !isAuthenticated) return;
    
    try {
      setLoadingAttempts(true);
      const token = await getToken();
      
      const response = await fetch(`${API_ROUTES.GET_USER_ATTEMPTS}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user attempts');
      }
      
      const data = await response.json();
      setAttempts(data.attempts || []);
    } catch (error) {
      console.error('Error fetching user attempts:', error);
      Alert.alert('Error', 'Failed to load user challenge attempts');
    } finally {
      setLoadingAttempts(false);
    }
  }, [id, getToken, isAuthenticated]);
  
  // Initial data loading
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, isAuthenticated]);
  
  // Load tab data when tab changes
  useEffect(() => {
    if (!user) return;
    
    if (index === 0 && posts.length === 0) {
      fetchUserPosts();
    } else if (index === 1 && achievements.length === 0) {
      fetchUserAchievements();
    } else if (index === 2 && attempts.length === 0) {
      fetchUserAttempts();
    }
  }, [index, user, fetchUserPosts, fetchUserAchievements, fetchUserAttempts, posts.length, achievements.length, attempts.length]);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    if (index === 0) {
      await fetchUserPosts();
    } else if (index === 1) {
      await fetchUserAchievements();
    } else if (index === 2) {
      await fetchUserAttempts();
    }
    
    setRefreshing(false);
  }, [index, fetchUserPosts, fetchUserAchievements, fetchUserAttempts]);
  
  // Check if authenticated
  useEffect(() => {
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
  
  // Handle like post
  const handleLikePost = useCallback(async (postId: string) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'You need to be logged in to like posts');
      return;
    }
    
    try {
      const token = await getToken();
      
      const response = await fetch(`${API_ROUTES.LIKE_POST}/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to like post');
      }
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            const userLiked = post.likes.includes(currentUser?._id || '');
            return {
              ...post,
              isLiked: !userLiked,
              likes: userLiked 
                ? post.likes.filter(id => id !== currentUser?._id)
                : [...post.likes, currentUser?._id || '']
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  }, [getToken, isAuthenticated, currentUser]);
  
  // Render posts tab
  const renderPostsTab = () => {
    if (loadingPosts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      );
    }
    
    if (posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color={colors.text} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No posts yet
          </Text>
        </View>
      );
    }
    
    return (
      <FlashList
        data={posts}
        renderItem={({ item }) => (
          <PostCard 
            post={item}
            onLike={() => handleLikePost(item._id)}
            onPress={() => router.push(`/post-detail/${item._id}`)}
          />
        )}
        estimatedItemSize={250}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
      />
    );
  };
  
  // Render achievements tab
  const renderAchievementsTab = () => {
    if (loadingAchievements) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      );
    }
    
    if (achievements.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={48} color={colors.text} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No achievements yet
          </Text>
        </View>
      );
    }
    
    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
      >
        <View style={styles.achievementsContainer}>
          {achievements.map(achievement => (
            <Achievement 
              key={achievement._id}
              title={achievement.title}
              description={achievement.description}
              position={achievement.position}
              id={achievement._id}
              challenge={achievement.challenge}
            />
          ))}
        </View>
      </ScrollView>
    );
  };
  
  // Render attempts tab
  const renderAttemptsTab = () => {
    if (loadingAttempts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      );
    }
    
    if (attempts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={48} color={colors.text} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No challenge attempts yet
          </Text>
        </View>
      );
    }
    
    return (
      <FlashList
        data={attempts}
        renderItem={({ item }) => (
          <AttemptCard
            attempt={item}
            onPress={() => router.push(`/challenge-details/${item.challengeId._id}`)}
          />
        )}
        estimatedItemSize={300}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
      />
    );
  };
  
  // Render scene for tab view
  const renderScene = ({ route }: { route: Tab }) => {
    switch (route.key) {
      case 'posts':
        return renderPostsTab();
      case 'achievements':
        return renderAchievementsTab();
      case 'attempts':
        return renderAttemptsTab();
      default:
        return null;
    }
  };
  
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
  
  // Show profile
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: user.displayName || user.username,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
        }}
      />
      
      <View style={styles.profileHeader}>
        <Image 
          source={{ 
            uri: user.profilePicture || 
              "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg" 
          }} 
          style={styles.profilePicture} 
        />
        
        <View style={styles.profileInfo}>
          <Text style={[styles.displayName, { color: colors.text }]}>
            {user.displayName || user.username}
          </Text>
          <Text style={[styles.username, { color: colors.text }]}>
            @{user.username}
          </Text>
          
          {user.bio && (
            <Text style={[styles.bio, { color: colors.text }]}>
              {user.bio}
            </Text>
          )}
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {user.stats.postsCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>
                Posts
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {user.stats.attemptCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>
                Attempts
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {user.stats.achievementCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>
                Achievements
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            style={{ backgroundColor: colors.card }}
            indicatorStyle={{ backgroundColor: '#FF6B00' }}
            activeColor="#FF6B00"
            inactiveColor={colors.text}
            labelStyle={{ textTransform: 'none', fontWeight: 'bold' }}
          />
        )}
        style={styles.tabView}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  profileHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  displayName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  tabView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  achievementsContainer: {
    padding: 16,
  },
}); 