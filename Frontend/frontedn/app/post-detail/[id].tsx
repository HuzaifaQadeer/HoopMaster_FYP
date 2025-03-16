import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  ActivityIndicator, 
  Modal, 
  Alert,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { API_ROUTES } from '@/config/config';
import { useAuth } from '@/context/AuthContext';
import moment from 'moment';
import config from '@/config/config';

// Add API base URL constant
const API_BASE_URL = config.API_BASE_URL;

// Define interfaces 
interface User {
  _id: string;
  displayName: string;
  username: string;
  profilePicture?: string;
}

interface Post {
  _id: string;
  content: string;
  user: User;
  createdAt: string;
  likes: string[];
  commentCount: number;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  isPrivate: boolean;
}

interface Comment {
  _id: string;
  content: string;
  postId: string;
  user: User;
  createdAt: string;
}

// Comment item component
const CommentItem = ({ 
  comment, 
  onReportComment 
}: { 
  comment: Comment; 
  onReportComment: (commentId: string) => void;
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  
  // Add debug logging for comment data
  console.log('[Debug] Comment user data:', JSON.stringify(comment.user));
  
  // Helper function to safely get user profile picture
  const getUserProfilePicture = () => {
    if (!comment.user || !comment.user.profilePicture) {
      return "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg";
    }
    return comment.user.profilePicture;
  };
  
  // Helper function to safely get user display name
  const getUserDisplayName = () => {
    if (!comment.user) return 'Unknown User';
    return comment.user.displayName || comment.user.username || 'Unknown User';
  };
  
  // Navigate to user profile when avatar is tapped
  const navigateToUserProfile = () => {
    console.log('[Debug] Navigating to user profile, userId:', comment.user?._id);
    if (comment.user && comment.user._id) {
      router.push(`/user-profile/${comment.user._id}`);
    }
  };
  
  return (
    <View style={[styles.commentContainer, { backgroundColor: colors.card }]}>
      <TouchableOpacity onPress={navigateToUserProfile}>
        <Image 
          source={{ uri: getUserProfilePicture() }} 
          style={styles.commentAvatar} 
        />
      </TouchableOpacity>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <TouchableOpacity onPress={navigateToUserProfile}>
            <Text style={[styles.commentUsername, { color: colors.text }]}>
              {getUserDisplayName()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onReportComment(comment._id)}>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.commentText, { color: colors.text }]}>
          {comment.content}
        </Text>
        <Text style={styles.commentTime}>
          {moment(comment.createdAt).fromNow()}
        </Text>
      </View>
    </View>
  );
};

// Report modal component
const ReportModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  type 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSubmit: (reason: string) => void; 
  type: 'post' | 'comment';
}) => {
  const { colors } = useTheme();
  const reasons = [
    'Inappropriate content',
    'Harassment or bullying',
    'Spam',
    'False information',
    'Violence',
    'Hate speech',
    'Intellectual property violation',
    'Other'
  ];
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Report {type === 'post' ? 'Post' : 'Comment'}
          </Text>
          
          <Text style={[styles.modalSubtitle, { color: colors.text }]}>
            Please select a reason for reporting:
          </Text>
          
          <ScrollView style={styles.reasonsContainer}>
            {reasons.map((reason, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.reasonItem, { borderBottomColor: colors.border }]}
                onPress={() => onSubmit(reason)}
              >
                <Text style={[styles.reasonText, { color: colors.text }]}>{reason}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Main post detail screen
export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const { isAuthenticated, getToken, user } = useAuth();
  const videoRef = useRef(null);
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  
  // Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState<'post' | 'comment'>('post');
  const [reportTargetId, setReportTargetId] = useState<string>('');
  
  // Add debugging for token
  useEffect(() => {
    const checkToken = async () => {
      const token = await getToken();
      console.log('[Debug] Auth token available:', !!token);
      if (token) console.log('[Debug] Token starts with:', token.substring(0, 10) + '...');
    };
    checkToken();
  }, []);
  
  // Fetch post details
  const fetchPostDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      console.log('[Debug] Fetching post details for ID:', id);
      console.log('[Debug] Using API endpoint:', API_ROUTES.GET_POST.replace(':id', id));
      
      const token = await getToken();
      const response = await fetch(API_ROUTES.GET_POST.replace(':id', id), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('[Debug] Post fetch response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Debug] Error response:', errorText);
        throw new Error(`Failed to fetch post: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Debug] Received post data:', data);
      setPost(data);
      
      // Check if user has liked the post
      if (isAuthenticated && user && data.likes.includes(user._id)) {
        setLiked(true);
      }
    } catch (error) {
      console.error('[Debug] Error fetching post details:', error);
      Alert.alert('Error', 'Failed to load post details');
    } finally {
      setLoading(false);
    }
  }, [id, getToken, isAuthenticated, user]);
  
  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!id) return;
    try {
      setCommentsLoading(true);
      console.log('[Debug] Fetching comments for post ID:', id);
      
      const token = await getToken();
      console.log('[Debug] Token available for comments fetch:', !!token);
      
      const apiUrl = API_ROUTES.GET_POST_COMMENTS.replace(':id', id);
      console.log('[Debug] Using API endpoint for comments:', apiUrl);
      
      // Add more detailed headers debugging
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      console.log('[Debug] Comments request headers:', JSON.stringify(headers));
      
      const response = await fetch(apiUrl, { headers });

      console.log('[Debug] Comments fetch response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Debug] Error response for comments:', errorText);
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Debug] Received comments data type:', typeof data);
      console.log('[Debug] Is comments data array?', Array.isArray(data));
      console.log('[Debug] First comment example:', data.length > 0 ? JSON.stringify(data[0]) : 'No comments');
      
      // Make sure we're setting an array of comments
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[Debug] Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  }, [id, getToken]);
  
  // Load data on mount
  useEffect(() => {
    fetchPostDetails();
    fetchComments();
  }, [fetchPostDetails, fetchComments]);
  
  // Handle post like
  const handleLike = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to like posts',
        [
          { text: 'Cancel' },
          { text: 'Login', onPress: () => router.push('/login') }
        ]
      );
      return;
    }
    
    if (!post) return;
    
    try {
      const token = await getToken();
      
      const response = await fetch(`${API_ROUTES.LIKE_POST}/${post._id}`, {
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
      setLiked(!liked);
      setPost(prev => {
        if (!prev) return null;
        
        const updatedLikes = liked
          ? prev.likes.filter(id => id !== user?._id)
          : [...prev.likes, user?._id || ''];
          
        return { ...prev, likes: updatedLikes };
      });
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  };
  
  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to comment',
        [
          { text: 'Cancel' },
          { text: 'Login', onPress: () => router.push('/login') }
        ]
      );
      return;
    }
    
    if (!commentText.trim() || !post) return;
    
    try {
      setSubmittingComment(true);
      const token = await getToken();
      
      const response = await fetch(API_ROUTES.CREATE_COMMENT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: commentText.trim(),
          postId: post._id,
          userId: user?._id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }
      
      // Clear input and refresh comments
      setCommentText('');
      fetchComments();
      
      // Update post comment count
      setPost(prev => {
        if (!prev) return null;
        return { ...prev, commentCount: prev.commentCount + 1 };
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };
  
  // Handle post reporting
  const handleReportPost = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to report posts',
        [
          { text: 'Cancel' },
          { text: 'Login', onPress: () => router.push('/login') }
        ]
      );
      return;
    }
    
    if (!post) return;
    
    setReportType('post');
    setReportTargetId(post._id);
    setReportModalVisible(true);
  };
  
  // Handle comment reporting
  const handleReportComment = (commentId: string) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to report comments',
        [
          { text: 'Cancel' },
          { text: 'Login', onPress: () => router.push('/login') }
        ]
      );
      return;
    }
    
    setReportType('comment');
    setReportTargetId(commentId);
    setReportModalVisible(true);
  };
  
  // Submit report
  const submitReport = async (reason: string) => {
    try {
      const token = await getToken();
      
      const response = await fetch(API_ROUTES.CREATE_REPORT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason,
          contentType: reportType,
          contentId: reportTargetId,
          reportedBy: user?._id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit report');
      }
      
      Alert.alert(
        'Report Submitted',
        'Thank you for helping to keep our community safe. We will review your report.'
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setReportModalVisible(false);
    }
  };
  
  // Render post media
  const renderMedia = () => {
    if (!post || !post.media?.url) return null;
    
    // Helper function to get the full media URL
    const getFullMediaUrl = (url: string) => {
      if (url.startsWith('http')) {
        return url;
      }
      return `${API_BASE_URL}${url}`;
    };
    
    const mediaUrl = getFullMediaUrl(post.media.url);
    console.log('[Debug] Rendering media with URL:', mediaUrl);
    
    if (post.media.type === 'image') {
      return (
        <Image 
          source={{ 
            uri: mediaUrl,
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Accept': '*/*',
              'Origin': API_BASE_URL
            }
          }} 
          style={styles.postMedia}
          resizeMode="cover"
        />
      );
    } else if (post.media.type === 'video') {
      return (
        <ExpoVideo
          ref={videoRef}
          source={{ 
            uri: mediaUrl,
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Accept': '*/*',
              'Origin': API_BASE_URL
            }
          }}
          style={styles.postMedia}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          shouldPlay={false}
          onError={(error: { error: string }) => {
            console.error('Video playback error:', error);
          }}
          onLoadStart={() => {
            console.log('Video load started');
          }}
          onLoad={(status: { uri: string }) => {
            console.log('Video loaded successfully:', status);
          }}
        />
      );
    }
    
    return null;
  };
  
  // Add this helper function to safely access user profile picture
  const getUserProfilePicture = () => {
    console.log('[Debug] Post user data:', post?.user);
    if (!post || !post.user || !post.user.profilePicture) {
      return "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg";
    }
    return post.user.profilePicture;
  };
  
  // Add this helper function to safely get user display name
  const getUserDisplayName = () => {
    if (!post || !post.user) return 'Unknown User';
    return post.user.displayName || 'Unknown User';
  };
  
  // Loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }
  
  // Error state
  if (!post) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Post not found or has been deleted
        </Text>
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
          title: 'Post',
          headerTitleStyle: { color: colors.text },
          headerStyle: { 
            backgroundColor: colors.background,
          },
          headerSafeAreaInsets: { top: Platform.OS === 'android' ? 40 : 0 },
        }}
      />
      
      <View style={styles.contentContainer}>
        <FlatList
          data={comments}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <CommentItem 
              comment={item} 
              onReportComment={handleReportComment} 
            />
          )}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.postContainer}>
              {/* Post header */}
              <View style={styles.postHeader}>
                <TouchableOpacity onPress={() => post.user && post.user._id && router.push(`/user-profile/${post.user._id}`)}>
                  <Image 
                    source={{ 
                      uri: getUserProfilePicture()
                    }} 
                    style={styles.avatar} 
                  />
                </TouchableOpacity>
                <View style={styles.postInfo}>
                  <TouchableOpacity onPress={() => post.user && post.user._id && router.push(`/user-profile/${post.user._id}`)}>
                    <Text style={[styles.username, { color: colors.text }]}>
                      {getUserDisplayName()}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.timestamp, { color: colors.text }]}>
                    {moment(post.createdAt).fromNow()} • {post.isPrivate ? 'Private' : 'Public'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={handleReportPost}
                >
                  <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              {/* Post content */}
              <Text style={[styles.postContent, { color: colors.text }]}>
                {post.content}
              </Text>
              
              {/* Post media */}
              {renderMedia()}
              
              {/* Post stats */}
              <View style={[styles.postStats, { borderBottomColor: colors.border, borderTopColor: colors.border }]}>
                <TouchableOpacity 
                  style={styles.statItem} 
                  onPress={handleLike}
                >
                  <Ionicons 
                    name={liked ? "heart" : "heart-outline"} 
                    size={22} 
                    color={liked ? "#FF6B00" : colors.text} 
                  />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {post.commentCount} {post.commentCount === 1 ? 'Comment' : 'Comments'}
                  </Text>
                </View>
              </View>
              
              {/* Comments header */}
              <View style={styles.commentsHeader}>
                <Text style={[styles.commentsTitle, { color: colors.text }]}>
                  Comments
                </Text>
                {commentsLoading && (
                  <ActivityIndicator size="small" color="#FF6B00" />
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            commentsLoading ? null : (
              <View style={styles.emptyComments}>
                <Text style={[styles.emptyCommentsText, { color: colors.text }]}>
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            commentsLoading ? (
              <ActivityIndicator size="small" color="#FF6B00" style={styles.commentsLoader} />
            ) : (
              <View style={{ height: 60 }} />
            )
          }
        />
        
        {/* Comment input */}
        <View style={[styles.commentInputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.commentInput, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.text + '80'}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.commentButton, 
              { opacity: commentText.trim().length > 0 && !submittingComment ? 1 : 0.5 }
            ]}
            onPress={handleSubmitComment}
            disabled={commentText.trim().length === 0 || submittingComment}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Report modal */}
        <ReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          onSubmit={submitReport}
          type={reportType}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    marginTop: Platform.OS === 'android' ? 20 : 0,
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
  postContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  menuButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  postMedia: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  postStats: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentContainer: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentTime: {
    marginTop: 4,
    fontSize: 12,
    color: '#888',
  },
  emptyComments: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  commentButton: {
    backgroundColor: '#FF6B00',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  reasonsContainer: {
    maxHeight: 300,
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  reasonText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    alignItems: 'center',
    padding: 15,
  },
  cancelButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentsLoader: {
    marginTop: 10,
  },
  flatListContent: {
    paddingTop: 24,
    paddingBottom: 80,
  },
}); 