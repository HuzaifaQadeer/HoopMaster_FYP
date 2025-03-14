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
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { API_ROUTES } from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SessionStatus = 'locked' | 'available' | 'completed';

interface Session {
  number: number;
  status: SessionStatus;
}

const CourseDetailsScreen = () => {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { courseId, refresh } = params;

  const [course, setCourse] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (courseId) {
      console.log(`Fetching course details for ${courseId}, refresh: ${refresh}`);
      fetchCourseDetails();
    }
  }, [courseId, refresh]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'You must be logged in to view course details');
        router.back();
        return;
      }

      // Replace the courseId param in the URL
      const courseDetailsUrl = API_ROUTES.GET_COURSE_BY_ID.replace(':id', courseId as string);
      const courseProgressUrl = API_ROUTES.GET_COURSE_PROGRESS.replace(':courseId', courseId as string);

      // Fetch course details
      const courseResponse = await fetch(courseDetailsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course details');
      }

      const courseData = await courseResponse.json();
      setCourse(courseData);

      // Fetch course progress
      const progressResponse = await fetch(courseProgressUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Get the user's completed sessions and progress
      let completedSessions: number[] = [];
      let validProgress = 0;
      
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        // Ensure progress is a valid number between 0-100
        validProgress = progressData.progress !== undefined && !isNaN(progressData.progress) 
          ? Math.min(Math.max(0, progressData.progress), 100) 
          : 0;
        
        // Get completed sessions if available
        if (progressData.completedSessions) {
          completedSessions = progressData.completedSessions.map((session: any) => 
            session.sessionNumber || session
          );
        }
        
        console.log(`Course details - progress for ${courseData.title}: ${validProgress}%`);
        console.log(`Completed sessions: ${JSON.stringify(completedSessions)}`);
        setProgress(validProgress);
      } else {
        console.log('Failed to fetch course progress, using 0%');
        setProgress(0);
      }

      // Find the maximum session number from coursedrills
      let maxSession = 0;
      if (courseData.coursedrills && courseData.coursedrills.length > 0) {
        // Calculate the highest session number
        maxSession = Math.max(...courseData.coursedrills.map((drill: any) => drill.session));
      } else {
        // If no coursedrills, determine based on frequency/duration
        if (courseData.frequency === 'daily') {
          maxSession = 14; // 2 weeks
        } else if (courseData.frequency === 'every 2 days') {
          maxSession = 15; // 1 month
        } else if (courseData.frequency === 'weekly') {
          maxSession = 8; // 2 months
        }
      }

      // Generate session data
      const sessionData: Session[] = [];
      
      // Find highest completed session
      const highestCompletedSession = completedSessions.length > 0 
        ? Math.max(...completedSessions) 
        : 0;
      
      for (let i = 1; i <= maxSession; i++) {
        let status: SessionStatus;
        
        if (completedSessions.includes(i)) {
          // Session is in the completed sessions array
          status = 'completed';
        } else if (i <= highestCompletedSession + 1) {
          // Make the next session after highest completed (or first session) available
          status = 'available';
        } else {
          // All other sessions are locked
          status = 'locked';
        }
        
        sessionData.push({
          number: i,
          status: status
        });
      }
      
      setSessions(sessionData);
    } catch (error) {
      console.error('Error fetching course details:', error);
      Alert.alert('Error', (error as Error).message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionPress = (session: Session) => {
    if (session.status === 'locked') {
      Alert.alert('Locked', 'You need to complete previous sessions first.');
      return;
    }

    // Navigate to session details screen
    router.push({
      pathname: '/session-details' as any,
      params: { 
        courseId, 
        sessionNumber: session.number,
        sessionStatus: session.status
      }
    });
  };

  const handleAbandonCourse = () => {
    Alert.alert(
      'Abandon Course', 
      'Are you sure you want to abandon this course? All progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Abandon', style: 'destructive', onPress: confirmAbandonCourse }
      ]
    );
  };

  const confirmAbandonCourse = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'You must be logged in to abandon a course');
        return;
      }

      const abandonUrl = API_ROUTES.ABANDON_COURSE.replace(':courseId', courseId as string);
      const response = await fetch(abandonUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to abandon course');
      }

      Alert.alert(
        'Success', 
        'You have abandoned the course.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error abandoning course:', error);
      Alert.alert('Error', (error as Error).message || 'Failed to abandon course');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading course details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Course Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.courseInfoSection}>
          <Text style={[styles.courseTitle, { color: colors.text }]}>{course?.title}</Text>
          
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${!isNaN(progress) ? Math.min(Math.max(0, progress), 100) : 0}%`, 
                    backgroundColor: colors.primary 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {`${!isNaN(progress) ? Math.round(progress) : 0}% Complete`}
            </Text>
          </View>

          <View style={styles.courseDetailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="fitness-outline" size={16} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {course?.level?.charAt(0).toUpperCase() + course?.level?.slice(1)}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {course?.duration}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.text} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {course?.frequency}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sessionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sessions</Text>
          <Text style={[styles.sectionDescription, { color: colors.text }]}>
            Complete each session to progress through the course.
          </Text>
          
          <View style={styles.sessionsGrid}>
            {sessions.map((session) => (
              <TouchableOpacity
                key={session.number}
                style={[
                  styles.sessionButton,
                  { 
                    backgroundColor: session.status === 'completed' 
                      ? colors.primary 
                      : session.status === 'available'
                        ? colors.card
                        : colors.border
                  }
                ]}
                onPress={() => handleSessionPress(session)}
                disabled={session.status === 'locked'}
              >
                <Text 
                  style={[
                    styles.sessionNumber, 
                    { 
                      color: session.status === 'completed' 
                        ? 'white' 
                        : colors.text 
                    }
                  ]}
                >
                  {session.number}
                </Text>
                {session.status === 'locked' && (
                  <View style={styles.lockIcon}>
                    <Ionicons name="lock-closed" size={12} color={colors.text} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.abandonButton, { backgroundColor: colors.notification }]}
          onPress={handleAbandonCourse}
        >
          <Text style={styles.abandonButtonText}>Abandon Course</Text>
        </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  courseInfoSection: {
    marginBottom: 24,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
  },
  courseDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  sessionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  sessionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  sessionButton: {
    width: 56,
    height: 56,
    margin: 8,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sessionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lockIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  abandonButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  abandonButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CourseDetailsScreen; 