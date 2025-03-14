import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface CourseProps {
  id: string;
  name: string;
  completion?: number;
  isPremium?: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  level?: string;
  showDetails?: boolean;
  onPress?: () => void;
}

// Default images based on course type
const DEFAULT_IMAGES = {
  // Key course types with their placeholder images
  SHOOTING: 'https://proskillsbasketball.com/wp-content/uploads/2019/11/PSB-shooting-the-basket.jpg',
  HANDLES: 'https://www.stack.com/wp-content/uploads/2012/08/ballhandling-629x417.jpg',
  FINISHING: 'https://www.vice.com/wp-content/uploads/sites/2/2018/12/1544458332692-h_54758643.jpeg?w=1024',
  DEFENSE: 'https://cdn.nba.com/manage/2021/06/GettyImages-1233194812-scaled-e1624366385410-1568x882.jpg',
  FOOTWORK: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2Et6jpeaHZnq0f_lagtL3an1yt3mBCX3guA&s',
  DEFAULT: 'https://dsgmedia.blob.core.windows.net/pub/2017/10/BasketballDrillsToImproveYourGame2.jpg'
};

const Course: React.FC<CourseProps> = ({ 
  id,
  name, 
  completion = 0, 
  isPremium = false, 
  imageUrl,
  thumbnailUrl,
  duration,
  level,
  showDetails = false,
  onPress 
}) => {
  const { colors } = useTheme();
  
  // Ensure completion is a valid number between 0-100
  const validCompletion = isNaN(completion) ? 0 : Math.min(Math.max(0, completion), 100);
  
  // Log the progress value for debugging
  React.useEffect(() => {
    console.log(`Course component for ${name}: completion=${completion}, validCompletion=${validCompletion}`);
    if (isNaN(completion) || completion < 0 || completion > 100) {
      console.warn(`Invalid completion value for course ${name}: ${completion}`);
    }
  }, [name, completion, validCompletion]);
  
  const getDefaultImage = () => {
    const courseName = name.toUpperCase();
    
    if (courseName.includes('SHOOTING') || courseName.includes('SHOT')) {
      return DEFAULT_IMAGES.SHOOTING;
    } else if (courseName.includes('HANDLES') || courseName.includes('DRIBBLE')) {
      return DEFAULT_IMAGES.HANDLES;
    } else if (courseName.includes('FINISHING') || courseName.includes('LAYUP')) {
      return DEFAULT_IMAGES.FINISHING;
    } else if (courseName.includes('DEFENSE') || courseName.includes('DEFEND')) {
      return DEFAULT_IMAGES.DEFENSE;
    } else if (courseName.includes('FOOTWORK') || courseName.includes('FEET')) {
      return DEFAULT_IMAGES.FOOTWORK;
    }
    
    return DEFAULT_IMAGES.DEFAULT;
  };
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default navigation to course details
      router.push({
        pathname: '/course-details' as any,
        params: { courseId: id }
      });
    }
  };

  return (
    <TouchableOpacity 
      style={styles.courseContainer} 
      onPress={handlePress}
    >
      <Image 
        source={{ uri: imageUrl || thumbnailUrl || getDefaultImage() }} 
        style={styles.courseImage} 
      />
      <Text style={[styles.courseName, { color: colors.text }]}>{name}</Text>
      
      <View style={styles.courseInfoContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${validCompletion}%`, backgroundColor: colors.primary }
            ]} 
          />
        </View>
        <Text style={[styles.completionText, { color: colors.text }]}>
          {`${validCompletion}% complete`}
        </Text>
        {isPremium && <Ionicons name="diamond" size={16} color={colors.primary} />}
      </View>

      {showDetails && (
        <View style={styles.detailsContainer}>
          {level && (
            <View style={styles.detailItem}>
              <Ionicons name="fitness" size={14} color={colors.text} style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </View>
          )}
          
          {duration && (
            <View style={styles.detailItem}>
              <Ionicons name="time" size={14} color={colors.text} style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {duration}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
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
  detailsContainer: {
    marginTop: 5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  detailIcon: {
    marginRight: 5,
  },
  detailText: {
    fontSize: 12,
  }
});

export default Course;