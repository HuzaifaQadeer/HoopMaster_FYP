import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  Switch,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { API_ROUTES } from '@/config/config';
import { useAuth } from '../context/AuthContext';

export default function CreatePostScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { getToken, isAuthenticated, user } = useAuth();
  
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [media, setMedia] = useState<{
    uri: string;
    type: 'image' | 'video';
    name?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const videoRef = useRef(null);
  
  // Check if user is authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to create a post',
        [
          { text: 'Cancel', onPress: () => router.back() },
          { text: 'Login', onPress: () => router.replace('/login') }
        ]
      );
    }
  }, [isAuthenticated]);
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Check file size (max 10MB)
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri) as any;
        if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
          Alert.alert('Error', 'Image too large (max 10MB)');
          return;
        }
        
        // Extract filename
        const uriParts = result.assets[0].uri.split('/');
        const name = uriParts[uriParts.length - 1];
        
        setMedia({
          uri: result.assets[0].uri,
          type: 'image',
          name
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Check file size (max 100MB)
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri) as any;
        if (fileInfo.size && fileInfo.size > 100 * 1024 * 1024) {
          Alert.alert('Error', 'Video too large (max 100MB)');
          return;
        }
        
        // Extract filename
        const uriParts = result.assets[0].uri.split('/');
        const name = uriParts[uriParts.length - 1];
        
        setMedia({
          uri: result.assets[0].uri,
          type: 'video',
          name
        });
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
  };
  
  const removeMedia = () => {
    setMedia(null);
  };
  
  const submitPost = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'You need to be logged in to post');
      return;
    }
    
    if (!content.trim() && !media) {
      Alert.alert('Error', 'Please add text or media to your post');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const token = await getToken();
      
      // Create form data
      const formData = new FormData();
      
      // Ensure content is never empty, even with media-only posts
      // This is required by the backend validation
      const postContent = content.trim() || (media ? 'Shared a ' + media.type : 'New post');
      formData.append('content', postContent);
      
      formData.append('isPrivate', String(isPrivate));
      formData.append('userId', user?._id || '');
      
      // Add media if present
      if (media) {
        console.log('Adding media to form data:', media);
        formData.append('media', {
          uri: media.uri,
          type: media.type === 'image' ? 'image/jpeg' : 'video/mp4',
          name: media.name || `${Date.now()}.${media.type === 'image' ? 'jpg' : 'mp4'}`
        } as any);
      }
      
      console.log('Submitting post with content length:', postContent.length);
      
      // Submit to server
      const response = await fetch(API_ROUTES.CREATE_POST, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to create post';
        try {
          const errorText = await response.text();
          console.log('Error response text:', errorText);
          
          // Try to parse as JSON
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // If parsing fails, use the raw text if it's not empty
            if (errorText && errorText.trim()) {
              errorMessage = `Server error: ${errorText.trim()}`;
            }
          }
        } catch (responseError) {
          console.error('Error reading response:', responseError);
        }
        
        // Show error with retry option
        Alert.alert(
          'Error',
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Retry', 
              onPress: () => {
                setIsSubmitting(false);
                // Wait a moment before retrying
                setTimeout(() => submitPost(), 1000);
              } 
            }
          ]
        );
        return;
      }
      
      // Success! Go back to community page
      Alert.alert(
        'Success',
        'Your post has been created',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert(
        'Error', 
        error instanceof Error ? error.message : 'Failed to create post',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Retry', 
            onPress: () => {
              setIsSubmitting(false);
              // Wait a moment before retrying
              setTimeout(() => submitPost(), 1000);
            } 
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render media preview
  const renderMediaPreview = () => {
    if (!media) return null;
    
    if (media.type === 'image') {
      return (
        <View style={styles.mediaPreviewContainer}>
          <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
          <TouchableOpacity 
            style={styles.removeMediaButton}
            onPress={removeMedia}
          >
            <Ionicons name="close-circle" size={30} color="#FF6B00" />
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.mediaPreviewContainer}>
          <ExpoVideo
            ref={videoRef}
            source={{ uri: media.uri }}
            style={styles.mediaPreview}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
          <TouchableOpacity 
            style={styles.removeMediaButton}
            onPress={removeMedia}
          >
            <Ionicons name="close-circle" size={30} color="#FF6B00" />
          </TouchableOpacity>
        </View>
      );
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'Create Post',
          headerTitleStyle: { color: colors.text },
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.userInfo}>
          <Image 
            source={{ 
              uri: user?.profilePicture || 
                "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg" 
            }} 
            style={styles.profilePic}
          />
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.displayName || 'Anonymous'}
            </Text>
            <View style={styles.privacyToggle}>
              <Text style={{ color: colors.text, marginRight: 5 }}>
                {isPrivate ? 'Private' : 'Public'}
              </Text>
              <Switch
                trackColor={{ false: '#767577', true: '#FF6B00' }}
                thumbColor={isPrivate ? '#FFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={setIsPrivate}
                value={isPrivate}
              />
            </View>
          </View>
        </View>
        
        <TextInput
          style={[styles.contentInput, { 
            color: colors.text,
            backgroundColor: colors.background
          }]}
          placeholder="What's on your mind?"
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
          autoFocus
        />
        
        {renderMediaPreview()}
        
        <View style={styles.mediaOptions}>
          <TouchableOpacity style={styles.mediaOption} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color="#FF6B00" />
            <Text style={[styles.mediaOptionText, { color: colors.text }]}>Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.mediaOption} onPress={pickVideo}>
            <Ionicons name="videocam-outline" size={24} color="#FF6B00" />
            <Text style={[styles.mediaOptionText, { color: colors.text }]}>Video</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={[styles.footer, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={[
            styles.postButton, 
            (!content.trim() && !media) && styles.disabledButton
          ]}
          onPress={submitPost}
          disabled={(!content.trim() && !media) || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contentInput: {
    minHeight: 150,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e0e0e0',
  },
  mediaOption: {
    alignItems: 'center',
  },
  mediaOptionText: {
    marginTop: 8,
  },
  mediaPreviewContainer: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  postButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
}); 