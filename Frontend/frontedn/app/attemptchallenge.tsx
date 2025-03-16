import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraType, useCameraPermissions, useMicrophonePermissions, CameraView } from 'expo-camera';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { API_ROUTES } from '@/config/config';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdBanner from '@/components/custom/AdBanner';

const COUNTDOWN_DURATION = 5;
const MAX_RECORDING_DURATION = 30;

// Recording options
const RECORDING_OPTIONS = {
  quality: '720p',
  maxDuration: MAX_RECORDING_DURATION * 1000, // Convert to milliseconds
  mute: false,
  videoStabilizationMode: 'auto'
};

export default function AttemptChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { challengeId } = params;
  const { getToken } = useAuth();

  const [challenge, setChallenge] = useState<any>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [sound, setSound] = useState<any>(null);
  const [trimValues, setTrimValues] = useState({ start: 0, end: 30 });
  const [videoDuration, setVideoDuration] = useState(0);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [userHasPremium, setUserHasPremium] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<any>(null);
  const recordingTimeout = useRef<NodeJS.Timeout>();
  const timerInterval = useRef<NodeJS.Timeout>();
  const recordStartTime = useRef<number | null>(null);
  const recordingTimerInterval = useRef<NodeJS.Timeout>();

  // Video trimmer state
  const [position, setPosition] = useState(0);

  useEffect(() => {
    fetchChallengeDetails();
    checkUserPremium();
    
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
  }, [sound, recording, challengeId]);

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

  const fetchChallengeDetails = async () => {
    if (!challengeId) return;
    
    try {
      const response = await fetch(API_ROUTES.GET_CHALLENGE_BY_ID.replace(':id', challengeId as string));
      
      if (!response.ok) {
        throw new Error('Failed to fetch challenge details');
      }
      
      const data = await response.json();
      setChallenge(data);
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      Alert.alert('Error', 'Failed to load challenge details');
    }
  };

  const checkUserPremium = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userDetails');
      if (userInfo) {
        const parsedInfo = JSON.parse(userInfo);
        setUserHasPremium(parsedInfo.isPremium || false);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const playBeep = async () => {
    try {
      // Instead of loading a sound file, we'll use the Audio API to create a beep
      const sound = new Audio.Sound();
      
      // We'll comment out the file loading for now
      /*
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/beep.mp3')
      );
      */
      
      setSound(sound);
      
      // Since we can't play the beep sound file, we'll just log it for now
      console.log('Beep sound would play here');
      
      // In a real implementation, you would play the beep sound
      // await sound.playAsync();
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
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading challenge details...</Text>
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
      
      // Start the recording timer
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
      const video = await cameraRef.current.recordAsync(RECORDING_OPTIONS);
      
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
      
      // Make sure to clear the interval when recording stops
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

  const submitChallengeAttempt = async () => {
    if (!videoUri || !challengeId) {
      Alert.alert("Error", "No video or challenge ID available");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Authentication Error", "You must be logged in to submit a challenge attempt");
        router.push('/login');
        return;
      }

      // Check if user already has an attempt for this challenge
      const checkResponse = await fetch(
        API_ROUTES.GET_USER_ATTEMPT.replace(':challengeId', challengeId as string),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const isReplacingAttempt = checkResponse.status === 200;

      // Create form data with the video file
      const formData = new FormData();
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(videoUri) as any;
      console.log('File info:', fileInfo);
      
      // Check file size - increase to match backend limit (100MB)
      if (fileInfo.size && fileInfo.size > 100 * 1024 * 1024) {
        Alert.alert('Error', 'Video too large (max 100MB)');
        setIsSubmitting(false);
        return;
      }
      
      // Get the filename from the URI
      const uriParts = videoUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      
      // Correctly format the file object for the form data
      formData.append('video', {
        uri: Platform.OS === 'ios' ? videoUri.replace('file://', '') : videoUri,
        name: fileName,
        type: 'video/mp4'
      } as any);

      console.log('Submitting to URL:', API_ROUTES.CREATE_CHALLENGE_ATTEMPT.replace(':challengeId', challengeId as string));

      const response = await fetch(
        API_ROUTES.CREATE_CHALLENGE_ATTEMPT.replace(':challengeId', challengeId as string),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit challenge attempt');
      }

      // Recheck premium status before showing ad
      await checkUserPremium();
      
      // Show ad if user is not premium
      if (!userHasPremium) {
        setShowAd(true);
      } else {
        // Navigate immediately for premium users
        Alert.alert(
          'Success',
          isReplacingAttempt 
            ? 'Your challenge attempt has been updated!'
            : 'Your challenge attempt has been submitted!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting challenge attempt:', error);
      Alert.alert('Error', 'Failed to submit challenge attempt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdClose = () => {
    setShowAd(false);
    Alert.alert(
      'Success',
      'Your challenge attempt has been submitted!',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
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
      
      {recording && (
        <View style={styles.recordingTimerContainer}>
          <MaterialIcons name="fiber-manual-record" size={18} color="red" />
          <Text style={styles.recordingTimerText}>{formatTime(recordingDuration)}</Text>
        </View>
      )}

      <View style={styles.challengeInfoContainer}>
        <Text style={styles.challengeTitle}>{challenge.title}</Text>
        <Text style={styles.challengeDescription}>{challenge.description}</Text>
      </View>
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
        <Text style={styles.trimmerText}>Trim Video:</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={videoDuration}
          value={trimValues.start}
          onValueChange={(value) => setTrimValues(prev => ({ ...prev, start: value }))}
          minimumTrackTintColor="#FF6B00"
          thumbTintColor="#FF6B00"
        />
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={videoDuration}
          value={trimValues.end}
          onValueChange={(value) => setTrimValues(prev => ({ ...prev, end: value }))}
          minimumTrackTintColor="#FF6B00"
          thumbTintColor="#FF6B00"
        />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={resetCamera}>
          <MaterialIcons name="close" size={30} color="red" />
          <Text style={styles.actionButtonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={submitChallengeAttempt}
          disabled={isSubmitting}
        >
          <MaterialIcons name="check" size={30} color="green" />
          <Text style={styles.actionButtonText}>Submit Attempt</Text>
        </TouchableOpacity>
      </View>

      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Submitting your attempt...</Text>
        </View>
      )}
    </View>
  );

  // Helper function to format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Challenge Attempt',
          headerTintColor: 'white',
          headerStyle: { backgroundColor: '#000' },
        }}
      />
      {videoUri && showTrimmer ? renderTrimmer() : renderCamera()}
      
      {showAd && (
        <AdBanner 
          type="challenge" 
          onClose={handleAdClose} 
        />
      )}
    </View>
  );
}

const { width, height } = Dimensions.get('window');

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
  permissionButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
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
    width: width - 40,
    height: height * 0.5,
    backgroundColor: 'black',
    borderRadius: 10,
  },
  trimmerText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
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
  challengeInfoContainer: {
    position: 'absolute',
    top: StatusBar.currentHeight || 40,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  challengeTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  challengeDescription: {
    color: 'white',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
}); 