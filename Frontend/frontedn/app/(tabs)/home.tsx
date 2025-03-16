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
import { router, useFocusEffect } from 'expo-router';
import { API_ROUTES } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Drill type
interface Drill {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  difficulty: string;
}

interface CourseType {
  _id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  frequency: string;
  thumbnail: string;
  isPremium: boolean;
  progress?: number;
}

// Cache configuration
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds
const CACHE_KEYS = {
  DRILLS: 'cached_drills',
  COURSES: 'cached_courses'
};

const HomePage = () => {
  const { colors } = useTheme();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [filteredDrills, setFilteredDrills] = useState<Drill[]>([]);
  const [userCourses, setUserCourses] = useState<CourseType[]>([]);
  const [loadingDrills, setLoadingDrills] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Cache management functions
  const getCachedData = async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error(`Error reading cache for ${key}:`, error);
      return null;
    }
  };

  const setCachedData = async (key: string, data: any) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Error caching ${key}:`, error);
    }
  };

  const fetchDrills = async () => {
    try {
      // First try to get cached drills
      const cachedDrills = await getCachedData(CACHE_KEYS.DRILLS);
      if (cachedDrills) {
        setDrills(cachedDrills);
        setFilteredDrills(cachedDrills);
        setLoadingDrills(false);
      }

      // Fetch fresh data from API
      const response = await fetch(API_ROUTES.GET_ALL_DRILLS);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      // Compare with cached data
      if (JSON.stringify(data) !== JSON.stringify(cachedDrills)) {
        setDrills(data);
        setFilteredDrills(data);
        await setCachedData(CACHE_KEYS.DRILLS, data);
      }
    } catch (error) {
      console.error('Error fetching drills:', error);
      // If we have cached data, we can still show it even if the fetch failed
      if (!drills.length) {
        const cachedDrills = await getCachedData(CACHE_KEYS.DRILLS);
        if (cachedDrills) {
          setDrills(cachedDrills);
          setFilteredDrills(cachedDrills);
        }
      }
    } finally {
      setLoadingDrills(false);
    }
  };

  const fetchUserCourses = async () => {
    try {
      setLoadingCourses(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setLoadingCourses(false);
        return;
      }

      // First try to get cached courses
      const cachedCourses = await getCachedData(CACHE_KEYS.COURSES);
      if (cachedCourses) {
        setUserCourses(cachedCourses);
        setLoadingCourses(false);
      }

      const response = await fetch(API_ROUTES.GET_USER_COURSES, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user courses');
      }

      const coursesData = await response.json();
      
      // Fetch progress for each course
      const coursesWithProgress = await Promise.all(
        coursesData.map(async (course: CourseType) => {
          try {
            const progressUrl = API_ROUTES.GET_COURSE_PROGRESS.replace(':courseId', course._id);
            const progressResponse = await fetch(progressUrl, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              const progressValue = progressData.progress !== undefined 
                ? progressData.progress 
                : (typeof progressData === 'number' ? progressData : 0);
              
              const validProgress = !isNaN(progressValue) 
                ? Math.min(Math.max(0, progressValue), 100) 
                : 0;
              
              return { ...course, progress: validProgress };
            }
            return { ...course, progress: 0 };
          } catch (error) {
            return { ...course, progress: 0 };
          }
        })
      );

      // Compare with cached data
      if (JSON.stringify(coursesWithProgress) !== JSON.stringify(cachedCourses)) {
        setUserCourses(coursesWithProgress);
        await setCachedData(CACHE_KEYS.COURSES, coursesWithProgress);
      }
    } catch (error) {
      console.error('Error fetching user courses:', error);
      // If we have cached data, we can still show it even if the fetch failed
      if (!userCourses.length) {
        const cachedCourses = await getCachedData(CACHE_KEYS.COURSES);
        if (cachedCourses) {
          setUserCourses(cachedCourses);
        }
      }
    } finally {
      setLoadingCourses(false);
    }
  };

  // Use effect to fetch drills on mount
  useEffect(() => {
    fetchDrills();
  }, []);

  // Use focus effect to refresh user courses when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserCourses();
    }, [])
  );

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
        
        {loadingCourses ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.courseLoader} />
        ) : userCourses.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coursesScrollView}>
            {userCourses.map((course) => (
              <Course 
                key={course._id} 
                id={course._id}
                name={course.title} 
                completion={course.progress || 0} 
                isPremium={course.isPremium}
                imageUrl={course.thumbnail}
                level={course.level}
                duration={course.duration}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.noCourseContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.noCourseText, { color: colors.text }]}>
              You haven't registered for any courses yet. 
              Check out the Courses tab to find courses.
            </Text>
          </View>
        )}
        
        <View style={styles.sectionDivider} />
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dribble Practice drills</Text>
        <SearchBar onSearch={handleSearch} />
        {loadingDrills ? (
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
  sectionDivider: {
    height: 20, // Add space between sections
  },
  coursesScrollView: {
    paddingLeft: 10,
  },
  courseLoader: {
    height: 150,
    justifyContent: 'center',
  },
  loader: {
    marginTop: 20,
  },
  noCourseContainer: {
    marginHorizontal: 10,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  noCourseText: {
    fontSize: 14,
    textAlign: 'center',
  }
});

export default HomePage;