import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import SearchBar from '../../components/custom/searchbar';
import { router } from 'expo-router';
import { API_ROUTES } from '@/config/config';

// Main course types
const courseTypes = [
  { 
    id: '1', 
    name: 'Handles', 
    imageUrl: 'https://www.stack.com/wp-content/uploads/2012/08/ballhandling-629x417.jpg',
    description: 'Master your ball handling skills with professional training drills'
  },
  { 
    id: '2', 
    name: 'Shooting', 
    imageUrl: 'https://proskillsbasketball.com/wp-content/uploads/2019/11/PSB-shooting-the-basket.jpg',
    description: 'Perfect your shooting technique from any position on the court'
  },
  { 
    id: '3', 
    name: 'Finishing', 
    imageUrl: 'https://www.vice.com/wp-content/uploads/sites/2/2018/12/1544458332692-h_54758643.jpeg?w=1024',
    description: 'Learn advanced layups and finishing moves around the rim'
  }
];

const CourseCard = ({ name, imageUrl, description, onPress }: 
  { name: string, imageUrl: string, description: string, onPress: () => void }) => (
  <TouchableOpacity style={styles.courseCard} onPress={onPress}>
    <ImageBackground
      source={{ uri: imageUrl }}
      style={styles.courseBackground}
      imageStyle={styles.courseImage}
    >
      <View style={styles.courseTitleContainer}>
        <Text style={styles.courseTitle}>{name}</Text>
        <Text style={styles.courseDescription}>{description}</Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

const CoursesPage = () => {
  const { colors } = useTheme();
  const [filteredCourses, setFilteredCourses] = useState(courseTypes);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (searchText: string) => {
    const filtered = courseTypes.filter(course => 
      course.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredCourses(filtered);
  };

  const handleCoursePress = (courseType: string) => {
    // Navigate to course selection screen with the selected course type
    router.push({
      pathname: '/course-selection',
      params: { courseType }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Training courses</Text>
        <SearchBar onSearch={handleSearch} />
        
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <ScrollView style={styles.coursesContainer}>
            {filteredCourses.map((course) => (
              <CourseCard 
                key={course.id} 
                name={course.name} 
                imageUrl={course.imageUrl} 
                description={course.description}
                onPress={() => handleCoursePress(course.name)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  coursesContainer: {
    flex: 1,
    marginTop: 16,
  },
  courseCard: {
    height: 180,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  courseBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  courseImage: {
    borderRadius: 16,
  },
  courseTitleContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 16,
  },
  courseTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  courseDescription: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default CoursesPage;