import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AchievementProps {
  id: string;
  title: string;
  description?: string;
  position: number;
  challenge?: {
    _id: string;
    title: string;
  };
}

const Achievement = ({ title, position, description }: AchievementProps) => {
  // Get medal color based on position
  const getMedalColor = () => {
    switch (position) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#555555'; // Dark gray for other positions
    }
  };

  // Get position text
  const getPositionText = () => {
    switch (position) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      default:
        return `${position}th`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.medalCircle, { backgroundColor: getMedalColor() }]}>
        <Text style={styles.positionText}>{getPositionText()}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 10,
    width: 120,
  },
  medalCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  positionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  description: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
});

export default Achievement;