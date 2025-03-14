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
import { Video, ResizeMode } from 'expo-av';
import { API_ROUTES } from '@/config/config';
import { useAuth } from '@/context/AuthContext';
import moment from 'moment';

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
  userId: User;
  createdAt: string;
  likes: string[];
  commentCount: number;
  hasMedia: boolean;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  isPrivate: boolean;
}

interface Comment {
  _id: string;
  content: string;
  postId: string;
  userId: User;
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
  
  return (
    <View style={[styles.commentItem, { borderBottomColor: colors.border }]}>
      <View style={styles.commentHeader}>
        <Image 
          source={{ 
            uri: comment.userId.profilePicture || 
              "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg" 
          }}
          style={styles.commentAvatar} 
        />
        <View style={styles.commentInfo}>
          <Text style={[styles.commentUsername, { color: colors.text }]}>
            {comment.userId.displayName || comment.userId.username}
          </Text>
          <Text style={[styles.commentTimestamp, { color: colors.text }]}>
            {moment(comment.createdAt).fromNow()}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.commentMenu}
          onPress={() => onReportComment(comment._id)}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.commentContent, { color: colors.text }]}>
        {comment.content}
      </Text>
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
  const videoRef = useRef<Video>(null);
  
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
  
  // Fetch post details
  const fetchPostDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch(`${API_ROUTES.GET_POST}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch post details');
      }
      
      const data = await response.json();
      setPost(data);
      
      // Check if user has liked the post
      if (isAuthenticated && user && data.likes.includes(user._id)) {
        setLiked(true);
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
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
      const token = await getToken();
      
      const response = await fetch(`${API_ROUTES.GET_POST_COMMENTS}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
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
    if (!post || !post.hasMedia || !post.mediaUrl) return null;
    
    if (post.mediaType === 'image') {
      return (
        <Image 
          source={{ uri: post.mediaUrl }} 
          style={styles.postMedia}
          resizeMode="cover"
        />
      );
    } else if (post.mediaType === 'video') {
      return (
        <Video
          ref={videoRef}
          source={{ uri: post.mediaUrl }}
          style={styles.postMedia}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
        />
      );
    }
    
    return null;
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
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      
      <FlatList
        data={comments}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <CommentItem 
            comment={item} 
            onReportComment={handleReportComment} 
          />
        )}
        ListHeaderComponent={
          <View>
            {/* Post header */}
            <View style={styles.postHeader}>
              <Image 
                source={{ 
                  uri: post.userId.profilePicture || 
                    "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg" 
                }} 
                style={styles.avatar} 
              />
              <View style={styles.postInfo}>
                <Text style={[styles.username, { color: colors.text }]}>
                  {post.userId.displayName || post.userId.username}
                </Text>
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
          !commentsLoading ? (
            <View style={styles.emptyComments}>
              <Text style={[styles.emptyCommentsText, { color: colors.text }]}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          ) : null
        }
      />
      
      {/* Comment input */}
      <View style={[styles.commentInputContainer, { backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.commentInput, { color: colors.text, backgroundColor: colors.background }]}
          placeholder="Add a comment..."
          placeholderTextColor="#999"
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!commentText.trim() || submittingComment) && styles.disabledButton
          ]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submittingComment}
        >
          {submittingComment ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Report Modal */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={submitReport}
        type={reportType}
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postMedia: {
    width: '100%',
    height: 300,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
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
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentInfo: {
    flex: 1,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentTimestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  commentMenu: {
    padding: 4,
  },
  commentContent: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 48, // Align with the username
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
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentInput: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#FF6B00',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.5,
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
}); 