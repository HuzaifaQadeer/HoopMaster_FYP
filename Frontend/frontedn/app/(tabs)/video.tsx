import React, { useState, useRef, useEffect } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { Video } from 'expo-av';
import * as Permissions from 'expo-permissions';

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(1);
  const [frameSlider, setFrameSlider] = useState(0);
  const cameraRef = useRef<CameraView | null>(null);
  const videoRef = useRef<Video | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    const getPermissions = async () => {
      const { status: cameraStatus } = await requestCameraPermission();
      const { status: audioStatus } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
      
      setHasPermission(cameraStatus === 'granted' && audioStatus === 'granted');
      
      if (Platform.OS === 'android' && audioStatus !== 'granted') {
        console.warn('Audio permission not granted. Recording may not work properly.');
      }
    };
    getPermissions();
  }, []);

  const handleRecordButtonPress = () => {
    if (recording) {
      stopRecording();
    } else {
      setCountdown(5);
      startCountdown();
    }
  };

  const startCountdown = () => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          startRecording();
          return prev;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      setRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({
          maxDuration: 60, // Automatically stop at 1 minute
        });

        if (video && video.uri) {
          setVideoUri(video.uri);
          setIsVideoReady(true);
        }
      } catch (error) {
        console.error('Error during recording:', error);
      } finally {
        setRecording(false);
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && recording) {
      await cameraRef.current.stopRecording();
      setRecording(false);
    }
  };

  const handleSendButtonPress = () => {
    // Reset camera screen
    setVideoUri(null);
    setIsVideoReady(false);
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera or audio</Text>;
  }

  return (
    <View style={styles.container}>
      {!isVideoReady ? (
        <>
          <CameraView style={styles.camera} ref={cameraRef}>
            {countdown > 0 && !recording ? (
              <View style={styles.countdown}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={[
                styles.recordButton,
                recording ? styles.recording : styles.notRecording,
              ]}
              onPress={handleRecordButtonPress}
            />
          </CameraView>
        </>
      ) : (
        <>
          <Video
            ref={videoRef}
            source={{ uri: videoUri! }}
            style={styles.video}
            useNativeControls={false}
            isLooping
            shouldPlay
          />
          {/* Trimming interface */}
          <View style={styles.trimContainer}>
            <Text>Trim Video</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={trimStart}
              onValueChange={(value: React.SetStateAction<number>) =>
                setTrimStart(value)
              }
            />
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={trimEnd}
              onValueChange={(value: React.SetStateAction<number>) =>
                setTrimEnd(value)
              }
            />
          </View>
          {/* Frame slider for moving across the video */}
          <View style={styles.frameContainer}>
            <Text>Frame</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={frameSlider}
              onValueChange={(value: React.SetStateAction<number>) =>
                setFrameSlider(value)
              }
            />
          </View>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendButtonPress}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 10,
    borderColor: 'white',
    marginBottom: 50,
  },
  notRecording: {
    backgroundColor: 'white',
  },
  recording: {
    backgroundColor: 'red',
  },
  countdown: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
  },
  countdownText: {
    fontSize: 64,
    color: 'orange',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  trimContainer: {
    flexDirection: 'column',
    padding: 10,
  },
  slider: {
    width: '90%',
    height: 40,
  },
  frameContainer: {
    flexDirection: 'column',
    padding: 10,
  },
  sendButton: {
    padding: 10,
    backgroundColor: '#1e90ff',
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 20,
  },
});
