import React, { useState } from 'react';
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
  Dimensions
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import SearchBar from '../../components/custom/searchbar';

const coursesList = [
  { 
    id: '1', 
    name: 'Increase vertical jump', 
    imageUrl: 'https://proskillsbasketball.com/wp-content/uploads/2019/11/PSB-shooting-the-basket.jpg'
  },
  { 
    id: '2', 
    name: 'Correct shooting form', 
    imageUrl: 'https://www.vice.com/wp-content/uploads/sites/2/2018/12/1544458332692-h_54758643.jpeg?w=1024'
  },
  { 
    id: '3', 
    name: 'Handles Masterclass', 
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2Et6jpeaHZnq0f_lagtL3an1yt3mBCX3guA&s'
  },
  { 
    id: '4', 
    name: 'Basic layup package', 
    imageUrl: 'https://www.stack.com/wp-content/uploads/2012/08/ballhandling-629x417.jpg'
  },
  { 
    id: '5', 
    name: 'Advance full court plays', 
    imageUrl: 'https://cdn.bleacherreport.net/images_root/slides/photos/000/756/224/109463728_original.jpg?1298906020'
  }
];

const CourseCard = ({ name, imageUrl }: { name: string, imageUrl: string }) => (
  <TouchableOpacity style={styles.courseCard}>
    <ImageBackground
      source={{ uri: imageUrl }}
      style={styles.courseBackground}
      imageStyle={styles.courseImage}
    >
      <View style={styles.courseTitleContainer}>
        <Text style={styles.courseTitle}>{name}</Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

const CoursesPage = () => {
  const { colors } = useTheme();
  const [filteredCourses, setFilteredCourses] = useState(coursesList);

  const handleSearch = (searchText: string) => {
    const filtered = coursesList.filter(course => 
      course.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredCourses(filtered);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Training courses</Text>
        <SearchBar onSearch={handleSearch} />
        <ScrollView style={styles.coursesContainer}>
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </ScrollView>
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
    height: 140,
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 16,
  },
  courseTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  }
});

export default CoursesPage;