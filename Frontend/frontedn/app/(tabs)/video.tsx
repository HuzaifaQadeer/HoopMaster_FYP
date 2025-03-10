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
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Add new states for handling analysis results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<Video>(null);
  const processedVideoRef = useRef<Video>(null);
  const recordingTimeout = useRef<NodeJS.Timeout>();
  const timerInterval = useRef<NodeJS.Timeout>();
  const recordStartTime = useRef<number | null>(null);
  const recordingTimerInterval = useRef<NodeJS.Timeout>();

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
      if (recordingTimerInterval.current) {
        clearInterval(recordingTimerInterval.current);
      }
    };
  }, [sound, recording]);

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
      setRecordingDuration(0);
      
      // Start the recording timer - FIXED: Set the start time first, then create interval
      recordStartTime.current = Date.now();
      console.log('Recording start time set:', recordStartTime.current);
      
      // Clear any existing interval first
      if (recordingTimerInterval.current) {
        clearInterval(recordingTimerInterval.current);
      }
      
      recordingTimerInterval.current = setInterval(() => {
        if (recordStartTime.current) {
          const elapsed = Math.floor((Date.now() - recordStartTime.current) / 1000);
          console.log('Recording elapsed time:', elapsed);
          setRecordingDuration(elapsed);
        }
      }, 1000);
      
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
      
      // FIXED: Make sure to clear the interval when recording stops
      if (recordingTimerInterval.current) {
        clearInterval(recordingTimerInterval.current);
        recordingTimerInterval.current = undefined;
      }
      recordStartTime.current = null;
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !recording) {
      return;
    }

    try {
      console.log('Stopping recording...');
      
      // Clear the recording timer
      if (recordingTimerInterval.current) {
        clearInterval(recordingTimerInterval.current);
        recordingTimerInterval.current = undefined;
      }
      recordStartTime.current = null;
      
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

  const downloadAndPlayProcessedVideo = async (videoUrl: string | null) => {
    try {
      if (!videoUrl) {
        throw new Error('Invalid video URL');
      }
      
      // Check if documentDirectory exists
      if (!FileSystem.documentDirectory) {
        throw new Error('Document directory is not available');
      }
      
      setIsVideoLoading(true);
      setDownloadProgress(0);
      
      // Extract filename from URL
      const filename = videoUrl.split('/').pop();
      
      // Define where to save the file on the device
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Check if we've already downloaded this file
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      
      if (!fileInfo.exists) {
        console.log(`Downloading video from ${videoUrl} to ${localUri}...`);
        
        // Download the file with progress tracking
        const download = await FileSystem.downloadAsync(
          videoUrl,
          localUri,
          { 
            md5: false, // Set to false for faster downloads
            headers: {
              'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
              'Cache-Control': 'no-cache'
            }
          }
        );
        
        if (download.status !== 200) {
          throw new Error(`Download failed with status ${download.status}`);
        }
        
        console.log('Download complete!');
      } else {
        console.log('File already exists, using cached version');
      }
      
      // Update the video source to use the local file
      setProcessedVideoUrl(localUri);
      
      // Clean up old videos
      await cleanupOldVideos();
      
      setIsVideoLoading(false);
    } catch (error) {
      console.error('Error downloading video:', error);
      setVideoError(`Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsVideoLoading(false);
    }
  };

  // Add function to clean up old videos
  const cleanupOldVideos = async () => {
    try {
      // Check if documentDirectory exists
      if (!FileSystem.documentDirectory) {
        console.warn('Document directory is not available');
        return;
      }
      
      const dirContents = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const videoFiles = dirContents.filter(file => file.endsWith('.mp4'));
      
      // Get the current filename if we have a processed video URL
      const currentFilename = processedVideoUrl ? processedVideoUrl.split('/').pop() : null;
      
      // Filter out the current video from the list of files to consider for deletion
      const videosToConsider = currentFilename 
        ? videoFiles.filter(file => file !== currentFilename)
        : videoFiles;
      
      // Keep only the 5 most recent videos (excluding the current one)
      if (videosToConsider.length > 5) {
        // Sort by creation time (you may need to get file info for each)
        const filesToDelete = videosToConsider.slice(0, videosToConsider.length - 5);
        
        for (const file of filesToDelete) {
          await FileSystem.deleteAsync(`${FileSystem.documentDirectory}${file}`);
          console.log(`Deleted old video: ${file}`);
        }
      }
    } catch (error) {
      console.warn('Error cleaning up old videos:', error);
    }
  };

  // Modify the submitVideoForAnalysis function
  const submitVideoForAnalysis = async () => {
    if (!videoUri) {
      Alert.alert("Error", "No video available to submit");
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine which API endpoint to use based on exact drill titles from the database
      let apiEndpoint;
      
      // Match exact drill titles from the database
      switch(drillName) {
        case "Basic Dribbling":
          apiEndpoint = API_ROUTES.BASIC_DRIBBLE_ANALYSIS;
          console.log('Using basic dribble analysis endpoint');
          break;
        case "Behind the Back Dribble":
          apiEndpoint = API_ROUTES.BEHIND_THE_BACK_ANALYSIS;
          console.log('Using behind the back analysis endpoint');
          break;
        case "Between the Legs":
          apiEndpoint = API_ROUTES.BETWEEN_THE_LEGS_ANALYSIS;
          console.log('Using between the legs analysis endpoint');
          break;
        case "Crossover Dribble":
          apiEndpoint = API_ROUTES.CROSSOVER_DRIBBLE_ANALYSIS;
          console.log('Using crossover dribble analysis endpoint');
          break;
        case "Tween Dribble":
          apiEndpoint = API_ROUTES.TWEEN_DRIBBLE_ANALYSIS;
          console.log('Using tween dribble analysis endpoint');
          break;
        default:
          // If the drill name doesn't match exactly, fall back to keyword matching
          const drillNameLower = drillName.toLowerCase();
          if (drillNameLower.includes('behind the back') || drillNameLower.includes('behind-the-back')) {
            apiEndpoint = API_ROUTES.BEHIND_THE_BACK_ANALYSIS;
            console.log('Using behind the back analysis endpoint (keyword match)');
          } else if (drillNameLower.includes('between the legs') || drillNameLower.includes('between-the-legs')) {
            apiEndpoint = API_ROUTES.BETWEEN_THE_LEGS_ANALYSIS;
            console.log('Using between the legs analysis endpoint (keyword match)');
          } else if (drillNameLower.includes('crossover')) {
            apiEndpoint = API_ROUTES.CROSSOVER_DRIBBLE_ANALYSIS;
            console.log('Using crossover dribble analysis endpoint (keyword match)');
          } else if (drillNameLower.includes('tween')) {
            apiEndpoint = API_ROUTES.TWEEN_DRIBBLE_ANALYSIS;
            console.log('Using tween dribble analysis endpoint (keyword match)');
          } else {
            // Default to basic dribble if no match is found
            apiEndpoint = API_ROUTES.BASIC_DRIBBLE_ANALYSIS;
            console.log('Using basic dribble analysis endpoint (default)');
          }
          break;
      }

      // Debug logging for API URL
      console.log('API_ROUTES object:', JSON.stringify(API_ROUTES));
      console.log('Using API endpoint:', apiEndpoint);
      console.log('Drill name:', drillName);

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
        
        // Extract the filename from the video_url and download it
        if (result.video_url) {
          const videoPath = result.video_url;
          // The video path from server is like '/uploads/processed_videos/filename.mp4'
          // We need to extract just the filename part
          const filename = videoPath.split('/').pop();
          
          if (filename) {
            // Construct full URL with the API_ROUTES base and immediately download
            // No need for additional validation or checks
            const fullVideoUrl = `${API_ROUTES.GET_PROCESSED_VIDEO.replace(':filename', filename)}`;
            console.log('Downloading from URL:', fullVideoUrl);
            
            // Download the video immediately
            await downloadAndPlayProcessedVideo(fullVideoUrl);
          } else {
            console.error('Invalid filename in video_url');
            setVideoError('Invalid video filename received from server');
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
      setIsSubmitting(false);
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={selectVideoFromGallery}>
            <MaterialIcons name="photo-library" size={30} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.recordButton, recording && styles.recordingButton]}
            onPress={recording ? stopRecording : startCountdown}
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
      
      {/* FIXED: Changed condition to just check recording state */}
      {recording && (
        <View style={styles.recordingTimerContainer}>
          <MaterialIcons name="fiber-manual-record" size={18} color="red" />
          <Text style={styles.recordingTimerText}>{formatTime(recordingDuration)}</Text>
        </View>
      )}
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
              <Text style={styles.loadingText}>Loading video... {downloadProgress > 0 ? `${Math.round(downloadProgress)}%` : ''}</Text>
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
                  
                  // Retry downloading the video
                  if (processedVideoUrl) {
                    // FIX: Properly extract the filename without assuming file:// prefix
                    const filename = processedVideoUrl.split('/').pop();
                    if (filename) {
                      // Simplified URL construction without timestamp
                      const apiUrl = API_ROUTES.GET_PROCESSED_VIDEO.replace(':filename', filename);
                      downloadAndPlayProcessedVideo(apiUrl);
                    } else {
                      setVideoError('Invalid video filename');
                      setIsVideoLoading(false);
                    }
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Video
              ref={processedVideoRef}
              source={{ uri: processedVideoUrl }}
              style={styles.processedVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                // Debug console log of playback status for troubleshooting
                if (status.isLoaded) {
                  console.log('Playback status:', status.isPlaying ? 'playing' : 'paused');
                }
              }}
              onReadyForDisplay={() => {
                console.log('Video is ready for display');
                setIsVideoLoading(false);
                // Now that video is ready, we can play it
                processedVideoRef.current?.playAsync();
              }}
              onLoadStart={() => {
                console.log('Video loading started from local file:', processedVideoUrl);
              }}
              onLoad={(status) => {
                console.log('Video loaded successfully with status:', JSON.stringify(status));
                setIsVideoLoading(false);
              }}
              onError={(error) => {
                console.error('Video playback error:', error, 'URL:', processedVideoUrl);
                setVideoError('Failed to play video. Please try again.');
                setIsVideoLoading(false);
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

  // Helper function to format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
  recordingTimerContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  recordingTimerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
