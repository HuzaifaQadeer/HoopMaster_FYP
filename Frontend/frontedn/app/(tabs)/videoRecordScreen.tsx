import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform
} from 'react-native';
import { RNCamera, RecordResponse } from 'react-native-camera';
import CountDown from 'react-native-countdown-component';
import Video from 'react-native-video';

const VideoRecordScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<RNCamera | null>(null);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      console.log('Checking camera permission...');
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "This app needs access to your camera to record videos.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        console.log('Android permission result:', granted);
      } else {
        // For iOS, permission is handled by the RNCamera component
        setHasPermission(true);
        console.log('iOS: Assuming permission is granted');
      }
    } catch (err) {
      console.error('Error checking camera permission:', err);
      setError('Failed to check camera permission');
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      setShowCountdown(true);
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        await cameraRef.current.stopRecording();
      } catch (error) {
        console.error('Error stopping video recording:', error);
        Alert.alert('Error', 'Failed to stop recording. Please try again.');
      } finally {
        setIsRecording(false);
      }
    }
  };

  const handleCountdownFinish = async () => {
    setShowCountdown(false);
    setIsRecording(true);
    if (cameraRef.current) {
      try {
        const data: RecordResponse = await cameraRef.current.recordAsync({
          maxDuration: 30,
        });
        setVideoUri(data.uri);
      } catch (error) {
        console.error('Error recording video:', error);
        Alert.alert('Error', 'Failed to record video. Please try again.');
      } finally {
        setIsRecording(false);
      }
    }
  };

  const resetRecording = () => {
    setVideoUri(null);
  };

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Error: {error}</Text>
        <TouchableOpacity style={styles.button} onPress={checkCameraPermission}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading camera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Camera permission is required to use this feature.</Text>
        <TouchableOpacity style={styles.button} onPress={checkCameraPermission}>
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (videoUri) {
    return (
      <View style={styles.container}>
        <Video
          source={{ uri: videoUri }}
          style={styles.video}
          controls={true}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.button} onPress={resetRecording}>
          <Text style={styles.buttonText}>Record Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        captureAudio={true}
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
      >
        {showCountdown && (
          <CountDown
            until={5}
            onFinish={handleCountdownFinish}
            size={30}
            digitStyle={styles.countdownDigit}
            digitTxtStyle={styles.countdownText}
            timeToShow={['S']}
            timeLabels={{ s: '' }}
          />
        )}
        {!showCountdown && !isRecording && (
          <TouchableOpacity style={styles.button} onPress={startRecording}>
            <Text style={styles.buttonText}>Start Recording</Text>
          </TouchableOpacity>
        )}
        {isRecording && (
          <TouchableOpacity style={styles.button} onPress={stopRecording}>
            <Text style={styles.buttonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}
      </RNCamera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 5,
    margin: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  countdownDigit: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  countdownText: {
    color: 'white',
  },
  video: {
    flex: 1,
  },
});

export default VideoRecordScreen;