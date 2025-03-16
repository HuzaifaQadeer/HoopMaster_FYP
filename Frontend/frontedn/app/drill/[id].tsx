import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { API_ROUTES } from '@/config/config';

interface DrillDetail {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  difficulty: string;
  instructions: string;
  type: string;
}

export default function DrillPage() {
  const params = useLocalSearchParams();
  const id = params.id;
  const router = useRouter();
  const { colors } = useTheme();
  const [drill, setDrill] = useState<DrillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('Drill ID from params:', id);
  console.log('All params:', JSON.stringify(params));

  const handleRecordPress = useCallback(() => {
    router.push({
      pathname: '/videoRecordScreen',
      params: {
        drillType: drill?.type || 'basic_dribble',
        drillId: drill?._id || id,
        drillName: drill?.title || 'Basketball Drill'
      }
    });
  }, [router, drill, id]);

  useEffect(() => {
    console.log('Fetching drill with ID:', id);
    fetchDrillDetails();
  }, [id]);

  const fetchDrillDetails = async () => {
    try {
      const url = `${API_ROUTES.GET_DRILL_BY_ID}/${id}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch drill details: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received drill data:', JSON.stringify(data));
      setDrill(data);
    } catch (error) {
      console.error('Error fetching drill details:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !drill) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {error || 'Failed to load drill details'}
        </Text>
      </View>
    );
  }

  // Convert instructions string into steps array
  const steps = drill.instructions.split('\n').filter(step => step.trim());

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: drill.title || 'Drill Details',
          headerTintColor: colors.text,
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
      <View style={styles.contentContainer}>
        <ScrollView style={styles.scrollContainer}>
          <Text style={[styles.drillName, { color: colors.text }]}>{drill.title}</Text>
          
          <Text style={[styles.description, { color: colors.text }]}>
            {drill.description}
          </Text>
          
          <Text style={[styles.stepsTitle, { color: colors.text }]}>Steps</Text>
          
          {steps.map((step, index) => (
            <View key={index} style={[styles.stepContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
            </View>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={[styles.recordButton, { backgroundColor: colors.primary }]}
          onPress={handleRecordPress}
          activeOpacity={0.7}
        >
          <Text style={styles.recordButtonText}>Record</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 80, // Add padding to prevent content from being hidden behind the button
    paddingTop: 40, // Add extra padding at the top to prevent overlap with header
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  drillName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10, // Add some margin to the title itself
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stepContainer: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  stepText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 