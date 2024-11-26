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
  { id: '1', name: 'Sharpshooter Masterclass', completion: 7, isPremium: true, imageUrl: 'https://proskillsbasketball.com/wp-content/uploads/2019/11/PSB-shooting-the-basket.jpg' },
  { id: '2', name: 'Handles mastery', completion: 25, isPremium: false, imageUrl: 'https://www.vice.com/wp-content/uploads/sites/2/2018/12/1544458332692-h_54758643.jpeg?w=1024' },
  { id: '3', name: 'Elite footwork', completion: 99, isPremium: false, imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2Et6jpeaHZnq0f_lagtL3an1yt3mBCX3guA&s' }
];

const drills = [
  {
    id: '1',
    name: 'Free throw',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuh27U7yq3pXN9SK58P-cHaS-5QlsawKiDQQ&s'
  },
  {
    id: '2',
    name: 'Behind the back dribble',
    imageUrl: 'https://i.ytimg.com/vi/9G-TF0_5m8c/maxresdefault.jpg'
  },
  {
    id: '3',
    name: 'Hesitation dribble',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtA1tIl3ReZPUGsGZf9OCrMTkp3-6cifUACw&s'
  },
  {
    id: '4',
    name: 'Cross over dribble',
    imageUrl: 'https://www.stack.com/wp-content/uploads/2012/08/ballhandling-629x417.jpg'
  },
  {
    id: '5',
    name: 'Pivot dribble',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1tr2-wSRifi4NcyiAXuW19FserHE9CZIGtw&s'
  },
  {
    id: '6',
    name: 'Jump shot',
    imageUrl: 'https://cdn.bleacherreport.net/images_root/slides/photos/000/756/224/109463728_original.jpg?1298906020'
  }
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