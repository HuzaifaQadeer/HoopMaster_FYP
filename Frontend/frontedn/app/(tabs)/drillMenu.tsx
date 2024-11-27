import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';


const DrillMenuScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();

  const handleRecordPress = useCallback(() => {
    router.push('/videoRecordScreen');
  }, [router]);
    

  const steps: string[] = [
    "Step 1: Start in a balanced stance with the ball in your dominant hand.",
    "Step 2: Push the ball low and hard towards your other hand.",
    "Step 3: Catch the ball with your other hand and immediately push it back.",
    "Step 4: Continue this back-and-forth motion, keeping the dribble low and quick.",
    "Step 5: Gradually increase your speed and the width of your dribble.",
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.videoPlaceholder}>
        <Text style={[styles.placeholderText, { color: colors.text }]}>Video Placeholder</Text>
      </View>

      <TouchableOpacity 
        style={[styles.recordButton, { backgroundColor: colors.primary }]}
        onPress={handleRecordPress}
        activeOpacity={0.7}
      >
        <Text style={styles.recordButtonText}>Record</Text>
      </TouchableOpacity>
      
      <Text style={[styles.drillName, { color: colors.text }]}>Crossover dribble</Text>
      
      <Text style={[styles.description, { color: colors.text }]}>
        To complete this drill you'll have to perform 10 straight cross over dribbles. 
        Know that the faster and further you dribble, the more points you will get.
      </Text>
      
      <Text style={[styles.stepsTitle, { color: colors.text }]}>Steps</Text>
      
      {steps.map((step, index) => (
        <View key={index} style={[styles.stepContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  videoPlaceholder: {
    height: 200,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
  },
  placeholderText: {
    fontSize: 18,
  },
  recordButton: {
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  drillName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stepContainer: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  stepText: {
    fontSize: 16,
  },
});

export default DrillMenuScreen;