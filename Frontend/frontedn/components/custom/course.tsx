import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface CourseProps {
  name: string;
  completion: number;
  isPremium: boolean;
  imageUrl: string;
}

const Course: React.FC<CourseProps> = ({ name, completion, isPremium, imageUrl }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.courseContainer}>
      <Image source={{ uri: imageUrl }} style={styles.courseImage} />
      <Text style={[styles.courseName, { color: colors.text }]}>{name}</Text>
      <View style={styles.courseInfoContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${completion}%`, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.completionText, { color: colors.text }]}>{`${completion}% complete`}</Text>
        {isPremium && <Ionicons name="diamond" size={16} color={colors.primary} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  courseContainer: {
    width: 200,
    marginRight: 10,
  },
  courseImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  courseInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  progressBar: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  completionText: {
    fontSize: 12,
    marginRight: 5,
  },
});

export default Course;