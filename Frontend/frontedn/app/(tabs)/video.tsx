import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraType, useCameraPermissions, useMicrophonePermissions, CameraView } from 'expo-camera';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Button,
  Dimensions,
  Alert
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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
  
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<Video>(null);
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
        <TouchableOpacity style={styles.actionButton} onPress={resetCamera}>
          <MaterialIcons name="check" size={30} color="green" />
          <Text style={styles.actionButtonText}>Use Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {videoUri && showTrimmer ? renderTrimmer() : renderCamera()}
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
});
