import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface ReliableVideoPlayerProps {
  uri: string;
  headers?: Record<string, string>;
  style?: any;
  resizeMode?: keyof typeof ResizeMode;
  shouldPlay?: boolean;
  isLooping?: boolean;
  useNativeControls?: boolean;
  onPlaybackStatusUpdate?: (status: any) => void;
  onError?: (error: any) => void;
  onLoad?: (status: any) => void;
}

const ReliableVideoPlayer: React.FC<ReliableVideoPlayerProps> = ({
  uri,
  headers,
  style,
  resizeMode = ResizeMode.CONTAIN,
  shouldPlay = false,
  isLooping = false,
  useNativeControls = true,
  onPlaybackStatusUpdate,
  onError,
  onLoad,
}) => {
  const [videoKey, setVideoKey] = useState(`video-${Date.now()}`);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<any>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Maximum number of automatic retries
  const MAX_AUTO_RETRIES = 3;
  
  // Reset video player with a new key to force reload
  const resetPlayer = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    
    setVideoKey(`video-${Date.now()}`);
    setIsLoading(true);
    setVideoError(null);
  };
  
  // Handle manual retry button press
  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount(0); // Reset retry count for manual retries
    resetPlayer();
    
    // Reset retry state after a short delay
    setTimeout(() => {
      setIsRetrying(false);
    }, 500);
  };
  
  // Auto-retry logic
  const attemptAutoRetry = () => {
    if (retryCount < MAX_AUTO_RETRIES) {
      console.log(`Auto-retrying video playback (${retryCount + 1}/${MAX_AUTO_RETRIES})...`);
      setRetryCount(prev => prev + 1);
      resetPlayer();
      return true;
    }
    return false;
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <View style={[styles.container, style]}>
      {videoError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF6B00" />
          <Text style={styles.errorText}>{videoError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetry}
            disabled={isRetrying}
          >
            <Text style={styles.retryButtonText}>
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Video
            key={videoKey}
            ref={videoRef}
            source={{
              uri,
              headers
            }}
            style={styles.video}
            resizeMode={resizeMode}
            shouldPlay={shouldPlay}
            isLooping={isLooping}
            useNativeControls={useNativeControls}
            onPlaybackStatusUpdate={(status: any) => {
              // Forward the status update to parent component if provided
              if (onPlaybackStatusUpdate) {
                onPlaybackStatusUpdate(status);
              }
            }}
            onLoadStart={() => {
              console.log('Video load started');
              setIsLoading(true);
              
              // Set a timeout to detect if video doesn't load properly
              if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
              }
              
              loadTimeoutRef.current = setTimeout(() => {
                console.log('Video load timeout - attempting auto-retry');
                if (!attemptAutoRetry()) {
                  setVideoError('Video loading timed out. Please try again.');
                  setIsLoading(false);
                }
              }, 10000); // 10 second timeout
            }}
            onLoad={(status: any) => {
              console.log('Video loaded successfully');
              setIsLoading(false);
              
              // Clear the timeout since video loaded successfully
              if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
                loadTimeoutRef.current = null;
              }
              
              // Forward the load event to parent component if provided
              if (onLoad) {
                onLoad(status);
              }
            }}
            onError={(error: any) => {
              console.error('Video playback error:', error);
              
              // Clear the timeout
              if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
                loadTimeoutRef.current = null;
              }
              
              // Try auto-retry first
              if (!attemptAutoRetry()) {
                // If we've exhausted auto-retries, show error
                setVideoError(`Failed to play video. Please try again.`);
                setIsLoading(false);
              }
              
              // Forward the error to parent component if provided
              if (onError) {
                onError(error);
              }
            }}
          />
          
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FF6B00" />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  errorText: {
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
    color: '#555',
  },
  retryButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ReliableVideoPlayer; 