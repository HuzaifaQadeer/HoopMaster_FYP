import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  FlatList, 
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Header from '../../components/custom/header';
import Course from '../../components/custom/course';
import Drill from '../../components/custom/drill';
import SearchBar from '../../components/custom/searchbar';
import Chat from '@/components/custom/chat';
import { router } from 'expo-router';
import { API_ROUTES } from '@/config/config';

const courses = [
  { id: '1', name: 'Sharpshooter Masterclass', completion: 7, isPremium: true, imageUrl: 'https://proskillsbasketball.com/wp-content/uploads/2019/11/PSB-shooting-the-basket.jpg' },
  { id: '2', name: 'Handles mastery', completion: 25, isPremium: false, imageUrl: 'https://www.vice.com/wp-content/uploads/sites/2/2018/12/1544458332692-h_54758643.jpeg?w=1024' },
  { id: '3', name: 'Elite footwork', completion: 99, isPremium: false, imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2Et6jpeaHZnq0f_lagtL3an1yt3mBCX3guA&s' }
];

// Define the Drill type
interface Drill {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  difficulty: string;
}

interface DrillProps {
  name: string;
  description: string;
  imageUrl: string;
  difficulty: string;
  onPress?: () => void;  // Add onPress prop
}

const HomePage = () => {
  const { colors } = useTheme();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [filteredDrills, setFilteredDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrills();
  }, []);

  const fetchDrills = async () => {
    try {
      const response = await fetch(API_ROUTES.GET_ALL_DRILLS);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setDrills(data);
      setFilteredDrills(data);
    } catch (error) {
      console.error('Error fetching drills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((searchText: string) => {
    const filtered = drills.filter(drill => 
      drill.title.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredDrills(filtered);
  }, [drills]);

  const handleDrillPress = (drillId: string) => {
    console.log('Navigating to drill with ID:', drillId);
    router.push(`/drill/${drillId}`);
  };

  // Calculate the height for 3 drill items
  const drillItemHeight = 140; // Adjust this value based on your Drill component's height
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
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 10 }]}>Dribble Practice drills</Text>
        <SearchBar onSearch={handleSearch} />
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={filteredDrills}
            renderItem={({ item }) => (
              <Drill
                name={item.title}
                imageUrl={item.imageUrl}
                description={item.description}
                difficulty={item.difficulty}
                onPress={() => handleDrillPress(item._id)}
              />
            )}
            keyExtractor={(item) => item._id}
            keyboardShouldPersistTaps="handled"
            style={{ height: drillListHeight }}
            overScrollMode="always"
          />
        )}
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
  loader: {
    marginTop: 20,
  },
});

export default HomePage;