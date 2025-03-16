import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Header from '../../components/custom/header';
import { API_ROUTES } from '@/config/config';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import config from '@/config/config';
import ProfilePicture from '@/components/custom/ProfilePicture';

// Add API base URL constant
const API_BASE_URL = config.API_BASE_URL;

// Helper function to get full media URL
const getFullMediaUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

// Interface definitions
interface Participant {
  _id: string;
  displayName: string;
  profilePicture?: string;
}

interface Challenge {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  status: 'upcoming' | 'active' | 'completed';
  thumbnail?: string;
  topParticipants?: {
    user: {
      displayName: string;
      _id: string;
      profilePicture?: string;
    };
    score: number;
  }[];
}

interface User {
  id: string;
  displayName: string;
  profilePicture?: string;
}

interface Post {
  id: string;
  content: string;
  date: string;
  user: User;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  likes?: string[];
  liked?: boolean;
}

const ChallengeCard = ({ challenge, onPress }: { challenge: Challenge, onPress: () => void }) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.challengeCard]} 
      onPress={onPress}
    >
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeTitle}>{challenge.title}</Text>
        <Text style={styles.challengeParticipants}>
          {challenge.participantCount} participants
        </Text>
      </View>
      <Text style={styles.challengeDescription} numberOfLines={2}>
        {challenge.description}
      </Text>
      
      {challenge.topParticipants && challenge.topParticipants.length > 0 && (
        <View style={styles.topParticipantsContainer}>
          <Text style={styles.topParticipantsTitle}>Top Participants</Text>
          {challenge.topParticipants.slice(0, 3).map((participant, index) => (
            <View key={participant.user._id} style={styles.participantRow}>
              <View style={styles.participantInfo}>
                <Text style={styles.rankNumber}>#{index + 1}</Text>
                <ProfilePicture userId={participant.user._id} size={24} />
                <Text style={styles.participantName} numberOfLines={1}>
                  {participant.user.displayName}
                </Text>
              </View>
              <Text style={styles.participantScore}>{participant.score} pts</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.challengeTimeRemaining}>
        {getTimeRemaining(new Date(challenge.endDate), new Date())}
      </Text>
    </TouchableOpacity>
  );
};

const SocialPost = ({ post, onPress, onLike }: { post: Post, onPress: () => void, onLike: () => void }) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const authToken = await getToken();
      setToken(authToken);
    };
    fetchToken();
  }, [getToken]);

  return (
    <TouchableOpacity 
      style={[styles.postCard, { backgroundColor: colors.card }]} 
      onPress={onPress}
    >
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => post.user && router.push(`/user-profile/${post.user.id}`)}
        >
          <ProfilePicture userId={post.user.id} size={40} />
          <View>
            <Text style={[styles.username, { color: colors.text }]}>
              {post.user.displayName}
            </Text>
            <Text style={[styles.postTime, { color: colors.text }]}>
              {formatPostTime(post.date)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.postContent, { color: colors.text }]}>
        {post.content}
      </Text>

      {post.media && post.media.type && post.media.url && (
        <View style={styles.mediaContainer}>
          {post.media.type === 'image' ? (
            <Image 
              source={{ 
                uri: getFullMediaUrl(post.media.url),
                headers: token ? {
                  'Authorization': `Bearer ${token}`
                } : undefined
              }} 
              style={styles.postImage}
            />
          ) : null}
        </View>
      )}

      <View style={styles.postFooter}>
        <TouchableOpacity 
          style={styles.likeButton} 
          onPress={onLike}
        >
          <Ionicons 
            name={post.liked ? "heart" : "heart-outline"} 
            size={24} 
            color={post.liked ? "#FF6B00" : colors.text} 
          />
          <Text style={[styles.likeCount, { color: colors.text }]}>
            {post.likes?.length || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const CommunityPage = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { getToken, isAuthenticated, user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    checkBanStatus();
    fetchChallenges();
    fetchPosts();
  }, []);

  // Add debugging for token
  useEffect(() => {
    const checkToken = async () => {
      const token = await getToken();
      console.log('[Debug] Community page - Auth token available:', !!token);
      if (token) console.log('[Debug] Token starts with:', token.substring(0, 10) + '...');
    };
    checkToken();
  }, []);

  const checkBanStatus = async () => {
    try {
      if (!isAuthenticated) return;
      
      const token = await getToken();
      const response = await fetch(API_ROUTES.CHECK_BAN_STATUS, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if user is banned and ban period is still active
        if (data.isBanned) {
          const bannedUntil = new Date(data.bannedUntil);
          const now = new Date();
          
          if (bannedUntil > now) {
            setIsBanned(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking ban status:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      console.log('[Debug] Fetching active challenges');
      console.log('[Debug] Using API endpoint:', API_ROUTES.GET_ACTIVE_CHALLENGES);
      
      const response = await fetch(API_ROUTES.GET_ACTIVE_CHALLENGES);
      
      console.log('[Debug] Challenges response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Debug] Error response:', errorText);
        throw new Error(`Failed to fetch challenges: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Debug] Received challenges data, count:', data.length);
      
      // The backend might return an array directly or an object with a challenges property
      // Handle both formats
      let challengesArray = [];
      
      if (Array.isArray(data)) {
        console.log('Challenge data is an array with', data.length, 'items');
        challengesArray = data;
      } else if (data && typeof data === 'object') {
        if (data.challenges && Array.isArray(data.challenges)) {
          console.log('Challenge data has challenges array with', data.challenges.length, 'items');
          challengesArray = data.challenges;
        } else {
          console.log('Challenge data is an object but does not have a challenges array');
          // Try to convert the object to an array if it's not already one
          challengesArray = Object.values(data).filter(item => 
            item && typeof item === 'object' && '_id' in (item as Record<string, any>)
          );
          console.log('Extracted', challengesArray.length, 'challenges from object');
        }
      }
      
      // Transform and validate challenge data
      const validChallenges = challengesArray
        .filter((challenge: any) => challenge && challenge._id)
        .map((challenge: any) => ({
          _id: challenge._id,
          title: challenge.title || 'Unnamed Challenge',
          description: challenge.description || '',
          startDate: challenge.startDate || new Date().toISOString(),
          endDate: challenge.endDate || new Date().toISOString(),
          participantCount: challenge.participantCount || (challenge.participants?.length || 0),
          status: challenge.status || 'active',
          thumbnail: challenge.thumbnail || '',
          topParticipants: challenge.topParticipants || []
        }));
      
      console.log(`Found ${validChallenges.length} valid challenges after processing`);
      setChallenges(validChallenges);
    } catch (error) {
      console.error('[Debug] Error fetching challenges:', error);
      setChallenges([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      console.log('[Debug] Fetching community posts');
      console.log('[Debug] Using API endpoint:', API_ROUTES.GET_ALL_POSTS);
      
      const token = await getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_ROUTES.GET_ALL_POSTS}?limit=10`, {
        headers
      });
      
      console.log('[Debug] Posts response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Debug] Error response:', errorText);
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Debug] Received posts data, count:', data.posts ? data.posts.length : 0);
      
      // Extract posts array from response - the backend returns {posts: [...], pagination: {...}}
      const postsArray = data.posts || [];
      
      if (!Array.isArray(postsArray)) {
        console.log('Posts data is not an array:', typeof postsArray);
        throw new Error('Invalid posts data format');
      }
      
      console.log(`Found ${postsArray.length} posts`);
      
      // Transform the data to match our Post interface and check if user has liked each post
      const transformedPosts = postsArray.map((post: any) => ({
        id: post._id || post.id,
        content: post.content || '',
        date: post.createdAt || post.date || new Date().toISOString(),
        user: {
          id: post.user?._id || post.user?.id || '',
          displayName: post.user?.displayName || 'Unknown User',
          profilePicture: post.user?.profilePicture || null,
        },
        media: post.media,
        likes: post.likes || [],
        liked: post.likes ? post.likes.includes(user?._id) : false
      }));
      
      // Sort posts by like count (descending)
      transformedPosts.sort((a: Post, b: Post) => 
        (b.likes?.length || 0) - (a.likes?.length || 0)
      );
      
      setPosts(transformedPosts);
    } catch (error) {
      console.error('[Debug] Error fetching posts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
      setRefreshing(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!isAuthenticated) {
      alert('Please login to like posts');
      return;
    }
    
    try {
      console.log('[Debug] Liking post with ID:', postId);
      console.log('[Debug] Using API endpoint:', API_ROUTES.LIKE_POST.replace(':id', postId));
      
      const token = await getToken();
      // Replace :id in the URL with the actual postId
      const likeUrl = API_ROUTES.LIKE_POST.replace(':id', postId);
      
      const response = await fetch(likeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to like post');
      }
      
      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          // Toggle the liked status
          const newLikedStatus = !post.liked;
          
          // Update the likes array based on the new status
          let updatedLikes = [...(post.likes || [])];
          if (newLikedStatus && user?._id) {
            // Add user ID to likes if not already there
            if (!updatedLikes.includes(user._id)) {
              updatedLikes.push(user._id);
            }
          } else if (!newLikedStatus && user?._id) {
            // Remove user ID from likes
            updatedLikes = updatedLikes.filter(id => id !== user._id);
          }
          
          return {
            ...post,
            liked: newLikedStatus,
            likes: updatedLikes
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('[Debug] Error liking post:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchChallenges(), fetchPosts()]);
    setRefreshing(false);
  }, [fetchChallenges, fetchPosts]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Community" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Community" />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Challenges</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge._id}
                challenge={challenge}
                onPress={() => router.push(`/challenge-details/${challenge._id}`)}
              />
            ))}
            {challenges.length === 0 && (
              <View style={[styles.noContentCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.noContentText, { color: colors.text }]}>
                  No active challenges at the moment
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Community Posts</Text>
            <TouchableOpacity
              style={styles.createPostButton}
              onPress={() => router.push('/create-post')}
            >
              <Ionicons name="add-circle" size={24} color="#FF6B00" />
            </TouchableOpacity>
          </View>
          {posts.map((post) => (
            <SocialPost
              key={post.id}
              post={post}
              onPress={() => router.push(`/post-detail/${post.id}`)}
              onLike={() => handleLikePost(post.id)}
            />
          ))}
          {posts.length === 0 && (
            <View style={[styles.noContentCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.noContentText, { color: colors.text }]}>
                No posts yet. Be the first to share!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper functions
const getTimeRemaining = (endDate: Date, now: Date): string => {
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return "Expired";
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

const formatPostTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Convert to hours
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) {
    // Less than an hour ago
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} min ago`;
  } else if (hours < 24) {
    // Less than a day ago
    return `${hours} hours ago`;
  } else {
    // Format as date
    return date.toLocaleDateString();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    zIndex: 1,
    elevation: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengesScroll: {
    marginBottom: 24,
  },
  challengeCard: {
    width: 300,
    padding: 16,
    borderRadius: 16,
    marginRight: 16,
    backgroundColor: '#FF6B00',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  challengeParticipants: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    opacity: 0.9,
  },
  challengeTimeRemaining: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
  },
  topParticipantsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  topParticipantsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
    width: 20,
  },
  participantName: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
    opacity: 0.9,
  },
  participantScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    marginBottom: 12,
  },
  mediaContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    color: 'white',
    fontSize: 14,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    marginRight: 16,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  noChallengesContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  noChallengesText: {
    fontSize: 16,
    textAlign: 'center',
  },
  noPostsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    marginBottom: 20,
  },
  noPostsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  banContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  banTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  banMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    padding: 16,
  },
  createPostButton: {
    padding: 8,
  },
  noContentCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  noContentText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommunityPage;