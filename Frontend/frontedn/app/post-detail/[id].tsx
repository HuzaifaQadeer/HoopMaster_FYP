import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Platform,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { API_ROUTES } from '@/config/config';
import { useAuth } from '../../context/AuthContext';

// Interfaces
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

interface Comment {
  id: string;
  content: string;
  date: string;
  user: User;
}

// Comment component
const CommentItem = ({ 
  comment, 
  onReport 
}: { 
  comment: Comment, 
  onReport: () => void 
}) => {
  const { colors } = useTheme();
  const formattedDate = formatDate(comment.date);
  const [showOptions, setShowOptions] = useState(false);

  return (
    <View style={[styles.commentContainer, { backgroundColor: colors.card }]}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUser}>
          <Image 
            source={{ 
              uri: comment.user.profilePicture || 
                "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg" 
            }} 
            style={styles.commentAvatar} 
          />
          <View>
            <Text style={[styles.commentAuthor, { color: colors.text }]}>
              {comment.user.displayName}
            </Text>
            <Text style={styles.commentDate}>{formattedDate}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={() => setShowOptions(!showOptions)}
          style={styles.optionsButton}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.commentContent, { color: colors.text }]}>
        {comment.content}
      </Text>
      
      {showOptions && (
        <View style={[styles.optionsMenu, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => {
              setShowOptions(false);
              onReport();
            }}
          >
            <Ionicons name="flag-outline" size={16} color={colors.text} />
            <Text style={[styles.optionText, { color: colors.text }]}>Report</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Report Modal Component
const ReportModal = ({ 
  visible, 
  onClose, 
  onSubmit 
}: { 
  visible: boolean, 
  onClose: () => void, 
  onSubmit: (reason: string, comment: string) => void 
}) => {
  const { colors } = useTheme();
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  
  const handleSubmit = () => {
    if (!reason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }
    
    onSubmit(reason, comment);
    setReason('');
    setComment('');
  };
  
  const reasons = [
    'Inappropriate content',
    'Harassment',
    'Spam',
    'False information',
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
          <Text style={[styles.modalTitle, { color: colors.text }]}>Report Content</Text>
          
          <Text style={[styles.modalLabel, { color: colors.text }]}>
            Why are you reporting this?
          </Text>
          
          {reasons.map((item) => (
            <TouchableOpacity 
              key={item} 
              style={[
                styles.reasonItem, 
                reason === item && { backgroundColor: 'rgba(255, 107, 0, 0.1)' }
              ]}
              onPress={() => setReason(item)}
            >
              <View style={styles.radioContainer}>
                <View style={[
                  styles.radioOuter,
                  { borderColor: reason === item ? '#FF6B00' : colors.border }
                ]}>
                  {reason === item && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={[styles.reasonText, { color: colors.text }]}>{item}</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          <Text style={[styles.modalLabel, { color: colors.text, marginTop: 16 }]}>
            Additional comments (optional)
          </Text>
          
          <TextInput
            style={[styles.commentInput, { 
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.background
            }]}
            placeholder="Add more details..."
            placeholderTextColor="#999"
            multiline={true}
            value={comment}
            onChangeText={setComment}
          />
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.submitButton]} 
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function PostDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const postId = Array.isArray(id) ? id[0] : id;
  const { getToken, isAuthenticated, user } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{type: 'post' | 'comment', id: string} | null>(null);
  
  useEffect(() => {
    fetchPostDetails();
    fetchComments();
  }, [postId]);
  
  const fetchPostDetails = async () => {
    try {
      if (!postId) return;
      
      setLoading(true);
      const token = await getToken();
      const response = await fetch(
        API_ROUTES.GET_POST.replace(':id', postId as string),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch post details');
      }
      
      const data = await response.json();
      
      // Transform to our Post interface
      setPost({
        id: data.id,
        content: data.content,
        date: data.date,
        author: data.author,
        user: data.user,
        media: data.media,
        status: data.status,
        likes: data.likes || [],
        liked: data.likes ? data.likes.includes(user?._id) : false
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert('Error', 'Failed to load post details');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchComments = async () => {
    try {
      if (!postId) return;
      
      setCommentLoading(true);
      const response = await fetch(
        API_ROUTES.GET_POST_COMMENTS.replace(':id', postId as string)
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setCommentLoading(false);
    }
  };
  
  const handlePostComment = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to comment');
      return;
    }
    
    if (!newComment.trim()) {
      return;
    }
    
    try {
      setSubmittingComment(true);
      const token = await getToken();
      
      const response = await fetch(API_ROUTES.CREATE_COMMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          postId,
          content: newComment
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      // Add the new comment to the list
      const newCommentData = await response.json();
      setComments([newCommentData, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };
  
  const handleLikePost = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to like posts');
      return;
    }
    
    try {
      const token = await getToken();
      const response = await fetch(`${API_ROUTES.LIKE_POST}/${postId}`, {
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
      if (post) {
        const currentlyLiked = post.liked || false;
        // Toggle liked status and update like count
        const updatedLikes = currentlyLiked
          ? post.likes?.filter(id => id !== user?._id) || []
          : [...(post.likes || []), user?._id || ''];
          
        setPost({
          ...post,
          liked: !currentlyLiked,
          likes: updatedLikes
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  const handleReport = (type: 'post' | 'comment', id: string) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to report content');
      return;
    }
    
    setReportTarget({ type, id });
    setIsReporting(true);
  };
  
  const submitReport = async (reason: string, comment: string) => {
    if (!reportTarget || !isAuthenticated) return;
    
    try {
      const token = await getToken();
      const response = await fetch(API_ROUTES.CREATE_REPORT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reporter: user?._id,
          contentType: reportTarget.type,
          contentId: reportTarget.id,
          reason,
          comment
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit report');
      }
      
      Alert.alert(
        'Report Submitted',
        'Thank you for your report. Our moderators will review it.'
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setIsReporting(false);
      setReportTarget(null);
    }
  };
  
  const navigateToUserProfile = (userId: string) => {
    router.push({
      pathname: 'user-profile/[id]' as any,
      params: { id: userId }
    });
  };
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading post...</Text>
      </View>
    );
  }
  
  if (!post) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B00" />
        <Text style={[styles.errorText, { color: colors.text }]}>Post not found</Text>
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
      
      <ScrollView style={styles.scrollView}>
        {/* Post Content */}
        <View style={[styles.postContainer, { backgroundColor: colors.card }]}>
          <View style={styles.postHeader}>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => navigateToUserProfile(post.user.id)}
            >
              <Image 
                source={{ 
                  uri: post.user.profilePicture || 
                    "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg" 
                }} 
                style={styles.profilePic} 
              />
              <View>
                <Text style={[styles.authorName, { color: colors.text }]}>
                  {post.user.displayName}
                </Text>
                <Text style={styles.postTime}>{formatDate(post.date)}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowOptions(!showOptions)}
              style={styles.optionsButton}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.postContent, { color: colors.text }]}>
            {post.content}
          </Text>
          
          {post.media && (
            <View style={styles.mediaContainer}>
              {post.media.type === 'image' ? (
                <Image 
                  source={{ uri: `${API_ROUTES.GET_POST_MEDIA}/${post.media.url}` }} 
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ) : (
                <Video
                  source={{ uri: `${API_ROUTES.GET_POST_MEDIA}/${post.media.url}` }}
                  style={styles.postVideo}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                  shouldPlay={false}
                />
              )}
            </View>
          )}
          
          <View style={styles.postActions}>
            <TouchableOpacity 
              style={styles.likeButton} 
              onPress={handleLikePost}
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
            
            <TouchableOpacity style={styles.commentButton}>
              <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
              <Text style={[styles.commentCount, { color: colors.text }]}>
                {comments.length}
              </Text>
            </TouchableOpacity>
          </View>
          
          {showOptions && (
            <View style={[styles.optionsMenu, { backgroundColor: colors.card }]}>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptions(false);
                  handleReport('post', post.id);
                }}
              >
                <Ionicons name="flag-outline" size={16} color={colors.text} />
                <Text style={[styles.optionText, { color: colors.text }]}>Report</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: colors.text }]}>
            Comments ({comments.length})
          </Text>
          
          {commentLoading ? (
            <ActivityIndicator size="small" color="#FF6B00" style={styles.commentLoader} />
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                onReport={() => handleReport('comment', comment.id)} 
              />
            ))
          ) : (
            <View style={styles.noCommentsContainer}>
              <Text style={[styles.noCommentsText, { color: colors.text }]}>
                No comments yet. Be the first to share your thoughts!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Comment Input Section */}
      <View style={[styles.commentInputContainer, { backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { 
            color: colors.text,
            backgroundColor: colors.background
          }]}
          placeholder="Add a comment..."
          placeholderTextColor="#999"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            (!newComment.trim() || submittingComment) && styles.disabledButton
          ]}
          onPress={handlePostComment}
          disabled={!newComment.trim() || submittingComment}
        >
          {submittingComment ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={18} color="white" />
          )}
        </TouchableOpacity>
      </View>
      
      <ReportModal
        visible={isReporting}
        onClose={() => {
          setIsReporting(false);
          setReportTarget(null);
        }}
        onSubmit={submitReport}
      />
    </SafeAreaView>
  );
}

// Helper function to format date
const formatDate = (dateString: string): string => {
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
  postContainer: {
    padding: 16,
    borderRadius: 16,
    margin: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  optionsButton: {
    padding: 8,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  mediaContainer: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postVideo: {
    width: '100%',
    height: '100%',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  likeCount: {
    marginLeft: 8,
    fontSize: 14,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    marginLeft: 8,
    fontSize: 14,
  },
  optionsMenu: {
    position: 'absolute',
    right: 16,
    top: 50,
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  commentLoader: {
    marginVertical: 16,
  },
  noCommentsContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noCommentsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  commentContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reasonItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B00',
  },
  reasonText: {
    fontSize: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: '45%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#FF6B00',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
}); 