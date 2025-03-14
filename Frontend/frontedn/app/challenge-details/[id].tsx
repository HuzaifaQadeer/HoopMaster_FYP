import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { API_ROUTES } from '@/config/config';
import { useAuth } from '../../context/AuthContext';

// Interfaces for the data
interface Challenge {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  startDate: string;
  endDate: string;
  participants: any[];
  status: 'upcoming' | 'active' | 'completed';
  demoVideo?: string;
}

interface User {
  _id: string;
  displayName: string;
  username?: string;
  profilePicture?: string;
}

interface Attempt {
  _id: string;
  user: User;
  challenge: string;
  videoUrl: string;
  upvotes: string[];
  downvotes: string[];
  score: number;
  createdAt: string;
}

// Component to display a challenge attempt with voting
const AttemptCard = ({ 
  attempt, 
  onVote,
  isLoggedIn,
  userId,
  onLoginPrompt
}: { 
  attempt: Attempt;
  onVote: (attemptId: string, voteType: 'up' | 'down') => void;
  isLoggedIn: boolean;
  userId: string | null;
  onLoginPrompt: () => void;
}) => {
  const { colors } = useTheme();
  const [videoStatus, setVideoStatus] = useState({ isPlaying: false });
  
  // Check if the current user has already voted
  const hasUpvoted = attempt.upvotes.includes(userId || '');
  const hasDownvoted = attempt.downvotes.includes(userId || '');
  
  // Get formatted date
  const formattedDate = new Date(attempt.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const handleVote = (voteType: 'up' | 'down') => {
    if (!isLoggedIn) {
      onLoginPrompt();
      return;
    }
    
    // Can't vote on your own attempt
    if (attempt.user._id === userId) {
      Alert.alert('Cannot vote', 'You cannot vote on your own attempt');
      return;
    }
    
    onVote(attempt._id, voteType);
  };

  return (
    <View style={[styles.attemptCard, { backgroundColor: colors.card }]}>
      <View style={styles.attemptHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ 
              uri: attempt.user.profilePicture || 
                "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg" 
            }}
            style={styles.profilePic}
          />
          <View>
            <Text style={[styles.username, { color: colors.text }]}>
              {attempt.user.displayName}
            </Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>
        <Text style={styles.score}>
          Score: {attempt.score}
        </Text>
      </View>
      
      {attempt.videoUrl && (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: `${API_ROUTES.GET_CHALLENGE_VIDEO.replace(':filename', attempt.videoUrl.split('/').pop() || '')}` }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onPlaybackStatusUpdate={status => setVideoStatus({ isPlaying: status.isLoaded && status.isPlaying })}
          />
        </View>
      )}
      
      <View style={styles.voteContainer}>
        <TouchableOpacity 
          style={[
            styles.voteButton, 
            hasUpvoted && styles.votedButton
          ]}
          onPress={() => handleVote('up')}
        >
          <Ionicons 
            name={hasUpvoted ? "arrow-up-circle" : "arrow-up-circle-outline"} 
            size={24} 
            color={hasUpvoted ? "#4CAF50" : colors.text} 
          />
          <Text style={[styles.voteText, { color: hasUpvoted ? "#4CAF50" : colors.text }]}>
            {attempt.upvotes.length}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.voteButton, 
            hasDownvoted && styles.votedButton
          ]}
          onPress={() => handleVote('down')}
        >
          <Ionicons 
            name={hasDownvoted ? "arrow-down-circle" : "arrow-down-circle-outline"} 
            size={24} 
            color={hasDownvoted ? "#F44336" : colors.text} 
          />
          <Text style={[styles.voteText, { color: hasDownvoted ? "#F44336" : colors.text }]}>
            {attempt.downvotes.length}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ChallengeDetailsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const challengeId = Array.isArray(id) ? id[0] : id;
  const { getToken, isAuthenticated, user } = useAuth();
  const userId = user?._id || null;
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [attemptLoading, setAttemptLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userHasAttempted, setUserHasAttempted] = useState(false);
  
  useEffect(() => {
    fetchChallengeDetails();
    fetchAttempts();
    checkUserAttempt();
  }, [challengeId]);
  
  const fetchChallengeDetails = async () => {
    try {
      if (!challengeId) return;
      
      const response = await fetch(API_ROUTES.GET_CHALLENGE_BY_ID.replace(':id', challengeId));
      
      if (!response.ok) {
        throw new Error('Failed to fetch challenge details');
      }
      
      const data = await response.json();
      setChallenge(data);
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      Alert.alert('Error', 'Failed to load challenge details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const fetchAttempts = async () => {
    try {
      if (!challengeId) return;
      
      setAttemptLoading(true);
      const response = await fetch(
        API_ROUTES.GET_CHALLENGE_ATTEMPTS.replace(':challengeId', challengeId)
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch challenge attempts');
      }
      
      const data = await response.json();
      setAttempts(data);
    } catch (error) {
      console.error('Error fetching challenge attempts:', error);
      Alert.alert('Error', 'Failed to load challenge attempts');
    } finally {
      setAttemptLoading(false);
    }
  };
  
  const checkUserAttempt = async () => {
    try {
      if (!isAuthenticated || !challengeId) return;
      
      const token = await getToken();
      const response = await fetch(
        API_ROUTES.GET_USER_ATTEMPT.replace(':challengeId', challengeId),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.status === 200) {
        setUserHasAttempted(true);
      } else {
        setUserHasAttempted(false);
      }
    } catch (error) {
      console.error('Error checking user attempt:', error);
      setUserHasAttempted(false);
    }
  };
  
  const handleVote = async (attemptId: string, voteType: 'up' | 'down') => {
    try {
      const token = await getToken();
      
      const response = await fetch(
        API_ROUTES.VOTE_ON_ATTEMPT.replace(':attemptId', attemptId),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ voteType })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to vote');
      }
      
      // Update the attempt in state
      fetchAttempts();
    } catch (error) {
      console.error('Error voting on attempt:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to vote');
    }
  };
  
  const handleAttemptChallenge = () => {
    if (!isAuthenticated) {
      promptLogin();
      return;
    }
    
    if (userHasAttempted) {
      Alert.alert('Already Attempted', 'You have already submitted an attempt for this challenge.');
      return;
    }
    
    if (challenge?.status !== 'active') {
      Alert.alert('Challenge Not Active', 'This challenge is not currently active.');
      return;
    }
    
    // Navigate to attemptchallenge screen for recording an attempt
    router.push({
      pathname: 'attemptchallenge' as any,
      params: { challengeId }
    });
  };
  
  const promptLogin = () => {
    Alert.alert(
      'Login Required',
      'You need to login to perform this action.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') }
      ]
    );
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchChallengeDetails();
    fetchAttempts();
    checkUserAttempt();
  };
  
  const getTimeRemaining = (endDate: string): string => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
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
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading challenge...</Text>
      </View>
    );
  }
  
  if (!challenge) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B00" />
        <Text style={[styles.errorText, { color: colors.text }]}>Challenge not found</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'Challenge Details',
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B00']}
          />
        }
      >
        <View style={[styles.challengeHeader, { backgroundColor: '#FF6B00' }]}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>
          <View style={styles.challengeStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={styles.statValue}>{challenge.status.toUpperCase()}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time Remaining</Text>
              <Text style={styles.statValue}>{getTimeRemaining(challenge.endDate)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Participants</Text>
              <Text style={styles.statValue}>{challenge.participants?.length || 0}</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions</Text>
          <Text style={[styles.instructions, { color: colors.text }]}>{challenge.instructions}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Attempts</Text>
          
          {attemptLoading ? (
            <ActivityIndicator size="small" color="#FF6B00" style={styles.attemptsLoader} />
          ) : attempts.length > 0 ? (
            attempts.map(attempt => (
              <AttemptCard 
                key={attempt._id} 
                attempt={attempt} 
                onVote={handleVote}
                isLoggedIn={isAuthenticated}
                userId={userId}
                onLoginPrompt={promptLogin}
              />
            ))
          ) : (
            <View style={[styles.noAttemptsContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.noAttemptsText, { color: colors.text }]}>
                No attempts yet. Be the first to attempt this challenge!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {challenge.status === 'active' && (
        <TouchableOpacity 
          style={styles.attemptButton}
          onPress={handleAttemptChallenge}
        >
          <Ionicons name="videocam" size={24} color="white" />
          <Text style={styles.attemptButtonText}>
            {userHasAttempted ? 'You have attempted this challenge' : 'Attempt Challenge'}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 12,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  challengeHeader: {
    padding: 20,
    borderRadius: 0,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 16,
    color: 'white',
    marginBottom: 16,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    padding: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  instructions: {
    fontSize: 16,
    lineHeight: 24,
  },
  attemptCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  score: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  voteContainer: {
    flexDirection: 'row',
    padding: 12,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  votedButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  voteText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  attemptsLoader: {
    marginVertical: 20,
  },
  noAttemptsContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  noAttemptsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  attemptButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF6B00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  attemptButtonText: {
    marginLeft: 8,
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 