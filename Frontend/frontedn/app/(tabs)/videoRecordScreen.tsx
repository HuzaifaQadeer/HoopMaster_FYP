import React from 'react';
import { View, StyleSheet } from 'react-native';
import VideoScreen from './video';

export default function VideoRecordScreen() {
  return (
    <View style={styles.container}>
      <VideoScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
