import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import moment from 'moment';

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
  hasMedia: boolean;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  isPrivate: boolean;
  isLiked?: boolean;
}

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onPress: () => void;
}

const MAX_CONTENT_LENGTH = 150;

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onPress }) => {
  const { colors } = useTheme();
  const videoRef = useRef<any>(null);
  const [expanded, setExpanded] = useState(false);
  
  // Add debug logs for post and like status
  console.log('[Debug] PostCard - post id:', post._id);
  console.log('[Debug] PostCard - isLiked:', post.isLiked);
  console.log('[Debug] PostCard - likes count:', post.likes.length);
  
  // Check if content should be truncated
  const shouldTruncate = post.content.length > MAX_CONTENT_LENGTH;
  
  // Format the date as relative time (e.g., "2 hours ago")
  const formattedDate = moment(post.createdAt).fromNow();
  
  // Helper function to safely get user profile picture
  const getUserProfilePicture = () => {
    if (!post.user || !post.user.profilePicture) {
      return "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg";
    }
    return post.user.profilePicture;
  };
  
  // Helper function to safely get user display name
  const getUserDisplayName = () => {
    if (!post.user) return 'Unknown User';
    return post.user.displayName || post.user.username || 'Unknown User';
  };
  
  // Render media content if present
  const renderMedia = () => {
    if (!post.hasMedia || !post.mediaUrl) return null;
    
    if (post.mediaType === 'image') {
      return (
        <Image 
          source={{ uri: post.mediaUrl }} 
          style={styles.media}
          resizeMode="cover"
        />
      );
    } else if (post.mediaType === 'video') {
      return (
        <Video
          ref={videoRef}
          source={{ uri: post.mediaUrl }}
          style={styles.media}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          shouldPlay={false}
        />
      );
    }
    
    return null;
  };
  
  // Handle like with debugging
  const handleLike = (e: any) => {
    console.log('[Debug] PostCard - Like button pressed for post:', post._id);
    e.stopPropagation();
    onLike();
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Post header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: getUserProfilePicture() }} 
          style={styles.avatar} 
        />
        <View style={styles.headerInfo}>
          <Text style={[styles.username, { color: colors.text }]}>
            {getUserDisplayName()}
          </Text>
          <View style={styles.metaInfo}>
            <Text style={[styles.timestamp, { color: colors.text }]}>
              {formattedDate}
            </Text>
            {post.isPrivate && (
              <View style={styles.privateIndicator}>
                <Ionicons name="lock-closed" size={12} color={colors.text} />
                <Text style={[styles.privateText, { color: colors.text }]}>
                  Private
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {/* Post content */}
      {post.content && (
        <Text style={[styles.content, { color: colors.text }]}>
          {shouldTruncate && !expanded
            ? `${post.content.slice(0, MAX_CONTENT_LENGTH)}...`
            : post.content}
          {shouldTruncate && (
            <Text 
              style={[styles.readMore, { color: '#FF6B00' }]}
              onPress={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? ' See less' : ' See more'}
            </Text>
          )}
        </Text>
      )}
      
      {/* Post media */}
      {renderMedia()}
      
      {/* Post stats */}
      <View style={styles.stats}>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={handleLike}
        >
          <Ionicons 
            name={post.isLiked ? 'heart' : 'heart-outline'} 
            size={20} 
            color={post.isLiked ? '#FF6B00' : colors.text} 
          />
          <Text style={[styles.statText, { color: colors.text }]}>
            {post.likes.length}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
          <Text style={[styles.statText, { color: colors.text }]}>
            {post.commentCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  privateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
  },
  privateText: {
    fontSize: 10,
    marginLeft: 2,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  readMore: {
    fontWeight: 'bold',
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
  },
});

export default PostCard; 