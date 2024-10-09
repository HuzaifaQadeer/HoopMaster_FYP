import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  FlatList, 
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Header from '../../components/custom/header';
import Course from '../../components/custom/course';
import Drill from '../../components/custom/drill';
import SearchBar from '../../components/custom/searchbar';
import Chat from '@/components/custom/chat';

const courses = [
  { id: '1', name: 'Sharpshooter Masterclass', completion: 7, isPremium: true, imageUrl: 'https://example.com/course1.jpg' },
  { id: '2', name: 'Handles mastery', completion: 25, isPremium: false, imageUrl: 'https://example.com/course1.jpg' },
  { id: '3', name: 'Elite footwork', completion: 99, isPremium: false, imageUrl: 'https://example.com/course1.jpg' }
];

const drills = [
  { id: '1', name: 'Free throw', imageUrl: 'https://example.com/drill1.jpg'},
  { id: '2', name: 'Behind the back dribble', imageUrl: 'https://example.com/drill2.jpg' },
  { id: '3', name: 'Hesitation dribble', imageUrl: 'https://example.com/drill3.jpg' },
  { id: '4', name: 'Pivot exercise', imageUrl: 'https://example.com/drill3.jpg' },
  { id: '5', name: 'Crossover dribble', imageUrl: 'https://example.com/drill4.jpg' },
  { id: '6', name: 'Jump shot', imageUrl: 'https://example.com/drill5.jpg' },
  // Add more drills...
];

const HomePage = () => {
  const { colors } = useTheme();
  const [filteredDrills, setFilteredDrills] = useState(drills);

  const handleSearch = useCallback((searchText: string) => {
    const filtered = drills.filter(drill => 
      drill.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredDrills(filtered);
  }, []);

  // Calculate the height for 3 drill items
  const drillItemHeight = 80; // Adjust this value based on your Drill component's height
  const drillListHeight = drillItemHeight * 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.headerContainer}>
        <Header />
      </View>
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Plans</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coursesScrollView}>
          {courses.map((course) => (
            <Course key={course.id} {...course} />
          ))}
        </ScrollView>
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 10 }]}>Practice drills</Text>
        <SearchBar onSearch={handleSearch} />
        <FlatList
          data={filteredDrills}
          renderItem={({ item }) => <Drill description={''} difficulty={''} {...item} />}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          style={{ height: drillListHeight }}
          overScrollMode="always"
        />
        <Chat />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    zIndex: 1,
    elevation: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    marginLeft: 10,
  },
  coursesScrollView: {
    paddingLeft: 10,
  },

});

export default HomePage;