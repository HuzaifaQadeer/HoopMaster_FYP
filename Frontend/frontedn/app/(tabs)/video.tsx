import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraView, CameraType, useCameraPermissions }from 'expo-camera';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Button,
  Dimensions,
  Alert,
  Platform 
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const COUNTDOWN_DURATION = 5;
const MAX_RECORDING_DURATION = 30;

export default function VideoScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [trimValues, setTrimValues] = useState({ start: 0, end: 30 });
  const [videoDuration, setVideoDuration] = useState(0);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<Video>(null);
  const recordingTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    (async () => {
      try {
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        const audioStatus = await Camera.requestMicrophonePermissionsAsync();
        
        if (!cameraStatus.granted || !audioStatus.granted) {
          Alert.alert(
            "Permission Required",
            "Camera and microphone permissions are required to record videos",
            [{ text: "OK", onPress: requestPermission }]
          );
          return;
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
  }, []);

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

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleCameraReady = () => {
    setCameraReady(true);
  };

  const startCountdown = async () => {
    if (!cameraReady) {
      Alert.alert("Camera Not Ready", "Please wait for the camera to initialize.");
      return;
    }
    
    setCountdown(COUNTDOWN_DURATION);
    for (let i = COUNTDOWN_DURATION; i > 0; i--) {
      await playBeep();
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(i - 1);
    }
    startRecording();
  };

  const startRecording = async () => {
    if (!permission?.granted || !cameraRef.current || !cameraReady) {
      console.error('Camera permission not granted or camera not ready');
      Alert.alert("Camera Error", "Camera is not ready or permissions are not granted.");
      return;
    }

    try {
      // Small delay to ensure camera is fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRecording(true);
      
      // Configure recording options based on platform
      const recordingOptions = {
        maxDuration: MAX_RECORDING_DURATION,
        maxFileSize: 100 * 1024 * 1024,
        mute: false,
      };
      
      // Start recording
      const recordingPromise = cameraRef.current.recordAsync(recordingOptions);
      
      // Set timeout to stop recording after MAX_RECORDING_DURATION
      recordingTimeout.current = setTimeout(async () => {
        if (recording) {
          await stopRecording();
        }
      }, MAX_RECORDING_DURATION * 1000);

      // Set countdown for last 5 seconds
      setTimeout(() => {
        setCountdown(5);
        const countInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countInterval);
              return null;
            }
            playBeep();
            return prev - 1;
          });
        }, 1000);
      }, 25000);

      // Wait for recording to complete
      const video = await recordingPromise;
      
      if (video && video.uri) {
        console.log("Recording successful, video URI:", video.uri);
        setVideoUri(video.uri);
        setShowTrimmer(true);
      } else {
        throw new Error("No video URI returned");
      }

    } catch (error) {
      console.error('Recording failed with error:', error);
      Alert.alert(
        "Recording Failed", 
        "There was an error while recording. Please try again."
      );
      setRecording(false);
      setCountdown(null);
    }
  };

  const stopRecording = async () => {
    if (!permission.granted || !cameraRef.current) return;
  
    try {
      setRecording(false);
      setCountdown(null);
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
      }
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Stop recording failed:', error);
      setRecording(false);
      setCountdown(null);
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

  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        facing={facing}
        onCameraReady={handleCameraReady}
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
});
//test changes