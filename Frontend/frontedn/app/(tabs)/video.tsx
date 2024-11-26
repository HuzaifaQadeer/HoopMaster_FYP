import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { useTheme } from '@react-navigation/native';
export default function Video() {
  const { colors } = useTheme();

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera access is required to use this feature'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.text }]}>
        Please allow camera access to continue
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
  },
});