import React, { useState, useEffect } from 'react';
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

// Add API base URL constant
const API_BASE_URL = config.API_BASE_URL;

// Interface definitions
interface Participant {
  _id: string;
  name: string;
  displayName: string;
  profilePicture?: string;
  score?: string;
}

interface Challenge {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  participants: Participant[];
  participantCount: number;
  status: 'upcoming' | 'active' | 'completed';
  thumbnail?: string;
}

interface User {
  id: string;
  displayName: string;
  profilePicture?: string;
  email?: string;
}

interface Post {
  id: string;
  content: string;
  date: string;
  author: string;
  user: User;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  status?: string;
  likes?: string[];
  liked?: boolean;
}

const ChallengeCard = ({ challenge, onPress }: { challenge: Challenge, onPress: () => void }) => {
  const { colors } = useTheme();
  
  // Calculate time remaining
  const endDate = new Date(challenge.endDate);
  const now = new Date();
  const timeRemaining = getTimeRemaining(endDate, now);
  
  return (
    <TouchableOpacity 
      style={[styles.challengeCard, { backgroundColor: '#FF6B00' }]}
      onPress={onPress}
    >
      <Text style={styles.challengeTitle}>{challenge.title}</Text>
      <Text style={styles.challengeDescription}>{challenge.description}</Text>
      <View style={styles.participantsContainer}>
        <Text style={styles.participantsLabel}>Top Participants:</Text>
        {challenge.participants && challenge.participants.slice(0, 4).map((participant, index) => (
          <View key={participant._id || index} style={styles.participantRow}>
            <Text style={styles.participantName}>
              {index === 0 && challenge.participants.length > 0 && 'You' in participant ? 'You' : participant.displayName || 'Anonymous'}
            </Text>
            <Text style={styles.participantScore}>{participant.score || '0'}</Text>
          </View>
        ))}
        {(!challenge.participants || challenge.participants.length === 0) && (
          <Text style={styles.noParticipantsText}>No participants yet. Be the first!</Text>
        )}
      </View>
      <Text style={styles.timeRemaining}>Time remaining: {timeRemaining}</Text>
    </TouchableOpacity>
  );
};

const SocialPost = ({ post, onPress, onLike }: { post: Post, onPress: () => void, onLike: () => void }) => {
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const formattedTime = formatPostTime(post.date);
  
  // Fetch authentication token
  useEffect(() => {
    const fetchToken = async () => {
      const token = await getToken();
      setAuthToken(token);
    };
    fetchToken();
  }, []);
  
  // Helper function to get the full media URL
  const getFullMediaUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url}`;
  };
  
  // Debug media URL
  useEffect(() => {
    if (post.media?.url) {
      const fullUrl = getFullMediaUrl(post.media.url);
      console.log('[Debug Media] Post ID:', post.id);
      console.log('[Debug Media] Original media URL:', post.media.url);
      console.log('[Debug Media] Full media URL:', fullUrl);
      console.log('[Debug Media] Media type:', post.media.type);
      console.log('[Debug Media] Auth token present:', !!authToken);
      
      // Test media URL accessibility
      if (authToken) {
        fetch(fullUrl, {
          method: 'HEAD',
          headers: {
            'Accept': '*/*',
            'Origin': API_BASE_URL,
            'Authorization': `Bearer ${authToken}`
          }
        })
        .then(response => {
          console.log('[Debug Media] URL test response:', {
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
          });
        })
        .catch(error => {
          console.error('[Debug Media] URL test error:', error);
        });
      }
    }
  }, [post.media, authToken]);
  
  return (
    <TouchableOpacity 
      style={[styles.postCard, { backgroundColor: colors.background }]}
      onPress={onPress}
    >
      <View style={styles.postHeader}>
        <Image 
          source={{ 
            uri: post.user.profilePicture || 
              "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg" 
          }} 
          style={styles.profilePic} 
        />
        <View>
          <Text style={[styles.authorName, { color: colors.text }]}>{post.user.displayName}</Text>
          <Text style={styles.postTime}>{formattedTime}</Text>
        </View>
      </View>
      <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>
      
      {post.media?.type && post.media?.url && (
        <View style={styles.mediaContainer}>
          {post.media.type === 'image' ? (
            <Image 
              source={{ 
                uri: getFullMediaUrl(post.media.url),
                headers: authToken ? {
                  'Authorization': `Bearer ${authToken}`
                } : undefined
              }} 
              style={styles.postImage}
              resizeMode="cover"
            />
          ) : post.media.type === 'video' ? (
            <TouchableOpacity 
              style={styles.postVideo}
              onPress={onPress}
            >
              <Ionicons name="play-circle" size={48} color="white" />
              <Text style={styles.videoPlayText}>Tap to play video</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.likeButton} 
          onPress={onLike}
        >
          <Ionicons 
            name={post.liked ? "heart" : "heart-outline"} 
            size={24} 
            color={post.liked ? "#FF6B00" : colors.text} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.commentButton}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
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
  const [banStatus, setBanStatus] = useState<{isBanned: boolean, bannedUntil: string, banReason: string} | null>(null);

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
            setBanStatus({
              isBanned: true,
              bannedUntil: data.bannedUntil,
              banReason: data.banReason
            });
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
          participants: Array.isArray(challenge.participants) 
            ? challenge.participants.map((p: any) => ({
                _id: p._id || p.id || '',
                name: p.name || '',
                displayName: p.displayName || 'Anonymous',
                profilePicture: p.profilePicture,
                score: p.score || '0'
              }))
            : [],
          participantCount: challenge.participantCount || (challenge.participants?.length || 0),
          status: challenge.status || 'active',
          thumbnail: challenge.thumbnail || ''
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
        author: post.author || '',
        user: {
          id: post.user?._id || post.user?.id || '',
          displayName: post.user?.displayName || 'Unknown User',
          profilePicture: post.user?.profilePicture || null,
          email: post.user?.email || ''
        },
        media: post.media,
        status: post.status || '',
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchChallenges();
    fetchPosts();
  };

  const navigateToChallenge = (challengeId: string) => {
    router.push(`/challenge-details/${challengeId}` as any);
  };
  
  const navigateToPostDetail = (postId: string) => {
    router.push({
      pathname: 'post-detail/[id]' as any,
      params: { id: postId }
    });
  };
  
  const navigateToCreatePost = () => {
    router.push('create-post' as any);
  };

  // If user is banned, show ban message
  if (banStatus?.isBanned) {
    const bannedUntil = new Date(banStatus.bannedUntil);
    const formattedDate = bannedUntil.toLocaleDateString();
    const formattedTime = bannedUntil.toLocaleTimeString();
    
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.headerContainer}>
          <Header />
        </View>
        <View style={styles.banContainer}>
          <Ionicons name="ban" size={80} color="#FF6B00" />
          <Text style={[styles.banTitle, { color: colors.text }]}>Account Temporarily Restricted</Text>
          <Text style={[styles.banMessage, { color: colors.text }]}>
            You are currently banned from accessing the community section.
          </Text>
          <Text style={[styles.banReason, { color: colors.text }]}>
            Reason: {banStatus.banReason}
          </Text>
          <Text style={[styles.banExpiry, { color: colors.text }]}>
            Your access will be restored on {formattedDate} at {formattedTime}.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.headerContainer}>
        <Header />
      </View>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B00']}
          />
        }
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Challenges</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#FF6B00" style={styles.loader} />
        ) : challenges.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.challengesScroll}
          >
            {challenges.map(challenge => (
              <ChallengeCard 
                key={challenge._id} 
                challenge={challenge} 
                onPress={() => navigateToChallenge(challenge._id)} 
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noChallengesContainer}>
            <Text style={[styles.noChallengesText, { color: colors.text }]}>
              No active challenges at the moment. Check back soon!
            </Text>
          </View>
        )}
        
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Community Posts</Text>
        </View>
        
        {postsLoading ? (
          <ActivityIndicator size="large" color="#FF6B00" style={styles.loader} />
        ) : posts.length > 0 ? (
          posts.map(post => (
            <SocialPost 
              key={post.id} 
              post={post} 
              onPress={() => navigateToPostDetail(post.id)}
              onLike={() => handleLikePost(post.id)}
            />
          ))
        ) : (
          <View style={styles.noPostsContainer}>
            <Text style={[styles.noPostsText, { color: colors.text }]}>
              No posts yet. Be the first to share something with the community!
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Floating button to create a new post */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={navigateToCreatePost}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
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
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    color: 'white',
    marginBottom: 16,
  },
  participantsContainer: {
    marginBottom: 16,
  },
  participantsLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  participantName: {
    color: 'white',
  },
  participantScore: {
    color: 'white',
    fontWeight: 'bold',
  },
  timeRemaining: {
    color: 'white',
    fontSize: 12,
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
  authorName: {
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
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
  postVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayText: {
    color: 'white',
    marginTop: 8,
    fontSize: 14,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    marginRight: 16,
  },
  commentButton: {
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
  noParticipantsText: {
    color: 'white',
    fontStyle: 'italic',
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
  banReason: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  banExpiry: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CommunityPage;