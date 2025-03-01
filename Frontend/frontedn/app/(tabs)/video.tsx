import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraType, useCameraPermissions, useMicrophonePermissions, CameraView } from 'expo-camera';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Button,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_ROUTES } from '@/config/config';

const COUNTDOWN_DURATION = 5;
const MAX_RECORDING_DURATION = 30;

// Add these recording options near your other constants
const RECORDING_OPTIONS = {
  quality: '720p',
  maxDuration: MAX_RECORDING_DURATION * 1000, // Convert to milliseconds
  mute: false,
  videoStabilizationMode: 'auto'
};

export default function VideoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const drillType = params.drillType as string || 'basic_dribble';
  const drillName = params.drillName as string || 'Basketball Drill';
  const drillId = params.drillId as string;

  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [trimValues, setTrimValues] = useState({ start: 0, end: 30 });
  const [videoDuration, setVideoDuration] = useState(0);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState<number | null>(null);
  
  // Add new states for handling analysis results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<Video>(null);
  const processedVideoRef = useRef<Video>(null);
  const recordingTimeout = useRef<NodeJS.Timeout>();
  const timerInterval = useRef<NodeJS.Timeout>();
  const recordStartTime = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      
      // Clean up timers when component unmounts
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [sound]);

  useEffect(() => {
    (async () => {
      try {
        // Request permissions on component mount
        if (!cameraPermission?.granted) {
          const cameraStatus = await requestCameraPermission();
          if (!cameraStatus.granted) {
            Alert.alert(
              "Camera Permission Required",
              "Camera permission is required to record videos",
              [{ text: "OK" }]
            );
          }
        }
        
        if (!microphonePermission?.granted) {
          const audioStatus = await requestMicrophonePermission();
          if (!audioStatus.granted) {
            Alert.alert(
              "Microphone Permission Required",
              "Microphone permission is required to record videos with sound",
              [{ text: "OK" }]
            );
          }
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Error setting up camera and audio:', error);
        Alert.alert("Setup Error", "Failed to initialize camera and audio. Please restart the app.");
      }
    })();
  }, [cameraPermission, microphonePermission]);

  const playBeep = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/beep.mp3')
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing beep sound:', error);
    }
  };

  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestCameraPermission} title="Grant Permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleCameraReady = () => {
    setCameraReady(true);
    console.log("Camera ready event fired");
  };

  const handleCameraError = (error: any) => {
    console.error('Camera error:', error);
    Alert.alert("Camera Error", `An error occurred with the camera: ${error.message || 'Unknown error'}`);
  };

  const startCountdown = async () => {
    if (!cameraReady) {
      Alert.alert("Camera Not Ready", "Please wait for the camera to initialize.");
      return;
    }
    
    if (!cameraPermission?.granted) {
      Alert.alert("Camera Permission Required", "Please grant camera permission to record.");
      await requestCameraPermission();
      return;
    }
    
    if (!microphonePermission?.granted) {
      Alert.alert("Microphone Permission Required", "Please grant microphone permission to record.");
      await requestMicrophonePermission();
      return;
    }
    
    setCountdown(COUNTDOWN_DURATION);
    for (let i = COUNTDOWN_DURATION; i > 0; i--) {
      await playBeep();
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(i - 1);
    }
    await startRecording();
  };

  const startRecording = async () => {
    if (!cameraPermission?.granted || !cameraRef.current || !cameraReady) {
      console.error('Camera permission not granted or camera not ready');
      Alert.alert("Camera Error", "Camera is not ready or permissions are not granted.");
      return;
    }

    if (!microphonePermission?.granted) {
      console.error('Microphone permission not granted');
      Alert.alert("Microphone Error", "Microphone permission is required for video recording.");
      await requestMicrophonePermission();
      return;
    }

    try {
      console.log('Setting recording state...');
      setRecording(true);
      
      // Add a small delay after setting recording state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Starting actual recording with options:', JSON.stringify(RECORDING_OPTIONS));
      console.log("before recording");
      const video = await cameraRef.current.recordAsync(RECORDING_OPTIONS);
      console.log("after recording");
      
      console.log("Recording completed, video:", JSON.stringify(video));
      if (video?.uri) {
        setVideoUri(video.uri);
        setShowTrimmer(true);
      } else {
        console.error('No video URI returned');
        Alert.alert("Recording Issue", "No video data was produced. Please try again.");
      }
    } catch (error: any) {
      console.error('Recording error:', error);
      Alert.alert("Recording Failed", `Error: ${error.message || 'Unknown error'}`);
    } finally {
      console.log('Recording cleanup...');
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !recording) {
      return;
    }

    try {
      console.log('Stopping recording...');
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const resetCamera = () => {
    setVideoUri(null);
    setShowTrimmer(false);
    setTrimValues({ start: 0, end: 30 });
    setShowResults(false);
    setAnalysisResult(null);
    setProcessedVideoUrl(null);
  };

  const handleVideoLoad = (status: any) => {
    if (status.durationMillis) {
      setVideoDuration(status.durationMillis / 1000);
    }
  };

  const selectVideoFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVideoUri(result.assets[0].uri);
        setShowTrimmer(true);
      }
    } catch (error) {
      console.error('Error selecting video from gallery:', error);
      Alert.alert("Gallery Error", "Failed to select video from gallery.");
    }
  };

  const handleRecording = async () => {
    if (recording) {
      console.log('Handle recording - stopping current recording');
      await stopRecording();
    } else {
      console.log('Handle recording - starting new recording');
      await startRecording();
    }
  };

  // Add new function to submit video for analysis
  const submitVideoForAnalysis = async () => {
    if (!videoUri) {
      Alert.alert("Error", "No video available to submit");
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine which API endpoint to use based on drill type
      let apiEndpoint;
      
      switch(drillType) {
        case 'basic_dribble':
          apiEndpoint = API_ROUTES.BASIC_DRIBBLE_ANALYSIS;
          break;
        // Add more cases here as you implement other drill types
        default:
          apiEndpoint = API_ROUTES.BASIC_DRIBBLE_ANALYSIS; // Default to basic dribble for now
          break;
      }

      // Debug logging for API URL
      console.log('API_ROUTES object:', JSON.stringify(API_ROUTES));
      console.log('Using API endpoint:', apiEndpoint);
      console.log('Drill type:', drillType);

      // Test if the API server is reachable with a simple GET request
      try {
        console.log('Testing API server reachability...');
        const testResponse = await fetch(API_ROUTES.CHATBOT_QUERY.split('/chat')[0], {
          method: 'GET',
        });
        console.log('API server test response status:', testResponse.status);
      } catch (error) {
        console.error('Error testing API server:', error);
      }

      // Create form data and append video file
      const formData = new FormData();
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      
      // Get the filename from the URI
      const uriParts = videoUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      
      formData.append('video', {
        uri: videoUri,
        name: fileName,
        type: 'video/mp4'
      } as any);

      console.log(`Submitting video to ${apiEndpoint}...`);
      console.log('File name:', fileName);
      
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Log response status and headers for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()])));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          throw new Error(`Server responded with status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Analysis result:', result);

        setAnalysisResult(result.analysis);
        
        // Extract the filename from the video_url
        if (result.video_url) {
          const videoPath = result.video_url;
          // The video path from server is like '/uploads/processed_videos/filename.mp4'
          // We need to extract just the filename part
          const filename = videoPath.split('/').pop();
          
          // Add a timestamp to prevent caching issues
          const timestamp = new Date().getTime();
          
          // Construct full URL with the AI_API_URL base and correct path
          const fullVideoUrl = `${API_ROUTES.GET_PROCESSED_VIDEO.replace(':filename', filename)}?t=${timestamp}`;
          console.log('Constructed video URL:', fullVideoUrl);
          
          // Store full API endpoint for the video
          setProcessedVideoUrl(fullVideoUrl);
          
          // Pre-warm the video URL by making a HEAD request
          try {
            fetch(fullVideoUrl, { 
              method: 'HEAD',
              headers: {
                'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                'Cache-Control': 'no-cache'
              }
            }).then(response => {
              console.log('Pre-warm video HEAD response:', response.status);
            }).catch(err => {
              console.warn('Pre-warm request failed:', err);
            });
          } catch (e) {
            console.warn('Error making pre-warm request:', e);
          }
        }
        
        setShowResults(true);
        setShowTrimmer(false);

      } catch (error) {
        console.error('Error submitting video:', error);
        Alert.alert("Submission Error", `Failed to submit video for analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsSubmitting(false);
      }

    } catch (error) {
      console.error('Error submitting video:', error);
      Alert.alert("Submission Error", `Failed to submit video for analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        facing={facing}
        onCameraReady={handleCameraReady}
        mode="video"
        onMountError={handleCameraError}
      >
        {recordingTimer !== null && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{recordingTimer}s</Text>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={selectVideoFromGallery}>
            <MaterialIcons name="photo-library" size={30} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.recordButton, recording && styles.recordingButton]}
            onPress={handleRecording}
            disabled={!cameraReady}
          >
            {countdown !== null && (
              <Text style={styles.countdownText}>{countdown}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <MaterialIcons name="flip-camera-ios" size={30} color="white" />
          </TouchableOpacity>
        </View>
        
        {!cameraReady && (
          <View style={styles.cameraNotReadyOverlay}>
            <Text style={styles.cameraNotReadyText}>Initializing camera...</Text>
          </View>
        )}
      </CameraView>
    </View>
  );

  const renderTrimmer = () => (
    <View style={styles.trimmerContainer}>
      <Video
        ref={videoRef}
        source={{ uri: videoUri! }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        onLoad={handleVideoLoad}
        shouldPlay={true}
        isLooping={true}
      />
      
      <View style={styles.trimmerControls}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={videoDuration}
          value={trimValues.start}
          onValueChange={(value) => setTrimValues(prev => ({ ...prev, start: value }))}
        />
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={videoDuration}
          value={trimValues.end}
          onValueChange={(value) => setTrimValues(prev => ({ ...prev, end: value }))}
        />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={resetCamera}>
          <MaterialIcons name="close" size={30} color="red" />
          <Text style={styles.actionButtonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={submitVideoForAnalysis}
          disabled={isSubmitting}
        >
          <MaterialIcons name="check" size={30} color="green" />
          <Text style={styles.actionButtonText}>Analyze</Text>
        </TouchableOpacity>
      </View>

      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FA8128" />
          <Text style={styles.loadingText}>Analyzing your technique...</Text>
        </View>
      )}
    </View>
  );

  const renderResults = () => (
    <ScrollView style={styles.resultsContainer}>
      <Text style={styles.drillTitle}>{drillName} Analysis</Text>
      
      {processedVideoUrl && (
        <View style={styles.videoContainer}>
          {isVideoLoading && (
            <View style={styles.videoLoadingOverlay}>
              <ActivityIndicator size="large" color="#FA8128" />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
          {videoError ? (
            <View style={styles.videoErrorContainer}>
              <MaterialIcons name="error-outline" size={40} color="red" />
              <Text style={styles.videoErrorText}>{videoError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setVideoError(null);
                  setIsVideoLoading(true);
                  
                  // Create a new Video component instance by forcing a refresh
                  if (processedVideoUrl) {
                    const refreshedUrl = `${processedVideoUrl}?timestamp=${new Date().getTime()}`;
                    setProcessedVideoUrl(null);
                    // Short delay before setting the new URL to ensure component remounts
                    setTimeout(() => setProcessedVideoUrl(refreshedUrl), 100);
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Video
              ref={processedVideoRef}
              source={{ 
                uri: processedVideoUrl,
                headers: {
                  'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                  'Cache-Control': 'no-cache',
                  'Access-Control-Allow-Origin': '*'
                }
              }}
              style={styles.processedVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                // Debug console log of playback status for troubleshooting
                console.log('Playback status:', JSON.stringify(status));
                
                if (!status.isLoaded && 'error' in status) {
                  console.error('Playback status error:', status.error);
                  
                  // Only set error if we're not already in error or loading state
                  if (!videoError && !isVideoLoading) {
                    setVideoError(`Playback error: ${status.error}`);
                  }
                }
              }}
              onReadyForDisplay={() => {
                console.log('Video is ready for display');
                setIsVideoLoading(false);
                // Now that video is ready, we can play it
                processedVideoRef.current?.playAsync();
              }}
              onLoadStart={() => {
                console.log('Video loading started from URL:', processedVideoUrl);
                setIsVideoLoading(true);
              }}
              onLoad={(status) => {
                console.log('Video loaded successfully with status:', JSON.stringify(status));
                setIsVideoLoading(false);
              }}
              onError={(error) => {
                console.error('Video playback error:', error, 'URL:', processedVideoUrl);
                setVideoError('Failed to load video. Please try again.');
                setIsVideoLoading(false);
                
                // Automatically retry once after a brief delay
                setTimeout(() => {
                  if (processedVideoRef.current) {
                    console.log('Attempting auto-retry of video playback...');
                    processedVideoRef.current.loadAsync({ 
                      uri: `${processedVideoUrl}?t=${new Date().getTime()}`,
                      headers: {
                        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                        'Cache-Control': 'no-store',
                        'Access-Control-Allow-Origin': '*'
                      }
                    });
                  }
                }, 2000);
              }}
            />
          )}
        </View>
      )}
      
      <View style={styles.analysisTextContainer}>
        <Text style={styles.analysisTitle}>Analysis Results:</Text>
        <Text style={styles.analysisText}>{analysisResult}</Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.returnButton} onPress={resetCamera}>
          <MaterialIcons name="replay" size={24} color="white" />
          <Text style={styles.returnButtonText}>New Recording</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.returnButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
          <Text style={styles.returnButtonText}>Back to Drill</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {showResults ? renderResults() : 
       videoUri && showTrimmer ? renderTrimmer() : 
       renderCamera()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  message: {
    color: 'white',
    textAlign: 'center',
    padding: 20,
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  button: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 40,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: 'white',
  },
  countdownText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  trimmerContainer: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,
  },
  video: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height * 0.6,
    backgroundColor: 'black',
    borderRadius: 10,
  },
  trimmerControls: {
    marginTop: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
  },
  actionButtonText: {
    color: 'white',
    marginTop: 5,
  },
  cameraNotReadyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraNotReadyText: {
    color: 'white',
    fontSize: 18,
  },
  timerContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  // New styles for results view
  resultsContainer: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 15,
  },
  drillTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 10,
  },
  processedVideo: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginVertical: 20,
  },
  analysisTextContainer: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FA8128',
    marginBottom: 10,
  },
  analysisText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
  },
  returnButton: {
    backgroundColor: '#FA8128',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 25,
    minWidth: 150,
  },
  returnButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  videoContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    borderRadius: 10,
    marginVertical: 20,
    position: 'relative',
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  videoErrorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 20,
  },
  videoErrorText: {
    color: 'white',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#FA8128',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
