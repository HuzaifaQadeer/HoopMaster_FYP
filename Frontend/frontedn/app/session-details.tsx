import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Platform, 
  StatusBar, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
  BackHandler
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { API_ROUTES } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';

interface Drill {
  _id: string;
  title: string;
  instructions: string;
  order: number;
  session: number;
  type: string;
  level: string;
  videoUrl: string;
}

const SessionDetailsScreen = () => {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { courseId, sessionNumber, sessionStatus } = params;

  const [drills, setDrills] = useState<Drill[]>([]);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoStatus, setVideoStatus] = useState({});
  const [completingSession, setCompletingSession] = useState(false);

  useEffect(() => {
    if (courseId && sessionNumber) {
      fetchSessionDrills();
    }
  }, [courseId, sessionNumber]);

  // Handle hardware back button press on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Navigate to course details with refresh param
      navigateBackWithRefresh();
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [courseId]);

  const fetchSessionDrills = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'You must be logged in to view session details');
        router.back();
        return;
      }

      // Replace the params in the URL
      const url = API_ROUTES.GET_COURSE_SESSION_DRILLS
        .replace(':courseId', courseId as string)
        .replace(':sessionNumber', sessionNumber as string);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session drills');
      }

      const drillsData = await response.json();
      if (!drillsData || drillsData.length === 0) {
        throw new Error('No drills found for this session');
      }

      // Sort drills by order
      const sortedDrills = drillsData.sort((a: Drill, b: Drill) => a.order - b.order);
      setDrills(sortedDrills);
    } catch (error) {
      console.error('Error fetching session drills:', error);
      Alert.alert('Error', (error as Error).message || 'Failed to load session drills');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentDrillIndex < drills.length - 1) {
      setCurrentDrillIndex(currentDrillIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentDrillIndex > 0) {
      setCurrentDrillIndex(currentDrillIndex - 1);
    }
  };

  const handleCompleteSession = async () => {
    try {
      setCompletingSession(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'You must be logged in to complete a session');
        return;
      }

      // Replace the params in the URL
      const url = API_ROUTES.UPDATE_COURSE_SESSION_PROGRESS
        .replace(':courseId', courseId as string)
        .replace(':sessionNumber', sessionNumber as string);

      console.log(`Completing session ${sessionNumber} for course ${courseId}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete session');
      }

      const result = await response.json();
      console.log('Session completion result:', result);

      // Check if this isn't already the last session
      const maxSessionNumber = parseInt(sessionNumber as string);
      const isLastSession = await checkIfLastSession(courseId as string, maxSessionNumber);
      
      const successMessage = isLastSession 
        ? 'Session completed successfully!' 
        : 'Session completed successfully! The next session has been unlocked.';

      Alert.alert(
        'Success', 
        successMessage,
        [{ 
          text: 'OK', 
          onPress: () => {
            // Navigate back to course details with a refresh flag
            router.replace({
              pathname: '/course-details' as any,
              params: {
                courseId,
                refresh: Date.now() // Add timestamp to force refresh
              }
            });
          } 
        }]
      );
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Error', (error as Error).message || 'Failed to complete session');
    } finally {
      setCompletingSession(false);
    }
  };

  // Navigate back with refresh
  const navigateBackWithRefresh = () => {
    router.replace({
      pathname: '/course-details' as any,
      params: {
        courseId,
        refresh: Date.now() // Add timestamp to force refresh
      }
    });
  };

  const currentDrill = drills[currentDrillIndex];
  const isLastDrill = currentDrillIndex === drills.length - 1;
  const isFirstDrill = currentDrillIndex === 0;
  const isCompleted = sessionStatus === 'completed';

  // Function to format instructions into numbered list
  const formatInstructions = (instructionsText: string) => {
    if (!instructionsText) return [];
    
    // Split by new lines or periods that are followed by a space and not preceded by a number
    const steps = instructionsText
      .split(/\.\s+(?!\d)|(?:\r\n|\r|\n)+/)
      .filter(step => step.trim().length > 0)
      .map(step => step.trim());
    
    return steps;
  };

  // Helper function to check if this is the last session
  const checkIfLastSession = async (courseId: string, sessionNumber: number): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return true; // Default to true if can't check
      
      // Get course details to determine max session
      const courseDetailsUrl = API_ROUTES.GET_COURSE_BY_ID.replace(':id', courseId);
      const response = await fetch(courseDetailsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) return true; // Default to true if can't check
      
      const courseData = await response.json();
      
      // Determine max session number
      let maxSession = 0;
      if (courseData.coursedrills && courseData.coursedrills.length > 0) {
        maxSession = Math.max(...courseData.coursedrills.map((drill: any) => drill.session));
      } else if (courseData.frequency) {
        // Fallback to frequency-based determination
        if (courseData.frequency === 'daily') {
          maxSession = 14; // 2 weeks
        } else if (courseData.frequency === 'every 2 days') {
          maxSession = 15; // 1 month
        } else if (courseData.frequency === 'weekly') {
          maxSession = 8; // 2 months
        }
      }
      
      return sessionNumber >= maxSession;
    } catch (error) {
      console.error('Error checking if last session:', error);
      return true; // Default to true if error
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading session drills...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.border} />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={navigateBackWithRefresh}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Session {sessionNumber} - Drill {currentDrillIndex + 1} of {drills.length}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.drillTitle, { color: colors.text }]}>{currentDrill?.title}</Text>
        
        <View style={styles.videoContainer}>
          {currentDrill?.videoUrl ? (
            <Video
              source={{ uri: currentDrill.videoUrl }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              onPlaybackStatusUpdate={(status: React.SetStateAction<{}>) => setVideoStatus(status)}
            />
          ) : null}
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>Instructions</Text>
          
          {currentDrill?.instructions ? (
            <FlatList
              data={formatInstructions(currentDrill.instructions)}
              keyExtractor={(item, index) => `instruction-${index}`}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <View style={styles.instructionItem}>
                  <Text style={[styles.instructionNumber, { color: colors.primary }]}>
                    {index + 1}.
                  </Text>
                  <Text style={[styles.instructionText, { color: colors.text }]}>
                    {item}
                  </Text>
                </View>
              )}
            />
          ) : (
            <Text style={[styles.instructionsText, { color: colors.text }]}>
              No instructions available.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[
            styles.navButton, 
            { backgroundColor: isFirstDrill ? colors.border : colors.primary },
            styles.previousButton
          ]}
          onPress={handlePrevious}
          disabled={isFirstDrill}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        {isLastDrill ? (
          <TouchableOpacity 
            style={[
              styles.navButton, 
              styles.completeButton,
              { backgroundColor: isCompleted ? colors.border : colors.primary }
            ]}
            onPress={handleCompleteSession}
            disabled={isCompleted || completingSession}
          >
            {completingSession ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.navButtonText}>Complete</Text>
                <Ionicons name="checkmark" size={24} color="white" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={styles.navButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  drillTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  videoContainer: {
    width: '100%',
    height: 200,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  instructionsContainer: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 16,
    lineHeight: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  previousButton: {
    justifyContent: 'flex-start',
  },
  nextButton: {
    justifyContent: 'flex-end',
  },
  completeButton: {
    justifyContent: 'center',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingRight: 10,
  },
  instructionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    width: 25,
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
});

export default SessionDetailsScreen; 