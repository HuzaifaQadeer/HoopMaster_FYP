import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import moment from 'moment';

interface User {
  _id: string;
  displayName: string;
  username: string;
  profilePicture?: string;
}

interface Challenge {
  _id: string;
  title: string;
  description?: string;
}

interface Attempt {
  _id: string;
  videoUrl: string;
  votes: string[];
  userId: User;
  challengeId: Challenge;
  createdAt: string;
  status: string;
}

interface AttemptCardProps {
  attempt: Attempt;
  onPress: () => void;
}

const AttemptCard: React.FC<AttemptCardProps> = ({ attempt, onPress }) => {
  const { colors } = useTheme();
  
  // Format the date as relative time (e.g., "2 hours ago")
  const formattedDate = moment(attempt.createdAt).fromNow();
  
  // Get status color
  const getStatusColor = () => {
    switch (attempt.status.toLowerCase()) {
      case 'approved':
        return '#4CAF50'; // Green
      case 'rejected':
        return '#F44336'; // Red
      case 'pending':
      default:
        return '#FFC107'; // Yellow/Amber
    }
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={{ 
            uri: attempt.userId.profilePicture || 
              "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg" 
          }} 
          style={styles.avatar} 
        />
        <View style={styles.headerInfo}>
          <Text style={[styles.username, { color: colors.text }]}>
            {attempt.userId.displayName || attempt.userId.username}
          </Text>
          <Text style={[styles.timestamp, { color: colors.text }]}>
            {formattedDate}
          </Text>
        </View>
      </View>
      
      {/* Challenge info */}
      <View style={styles.challengeInfo}>
        <Text style={[styles.challengeTitle, { color: colors.text }]}>
          Challenge: {attempt.challengeId.title}
        </Text>
        {attempt.challengeId.description && (
          <Text 
            style={[styles.challengeDescription, { color: colors.text }]}
            numberOfLines={2}
          >
            {attempt.challengeId.description}
          </Text>
        )}
      </View>
      
      {/* Status and votes */}
      <View style={styles.footer}>
        <View 
          style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor() }
          ]}
        >
          <Text style={styles.statusText}>
            {attempt.status.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.votes}>
          <Ionicons name="thumbs-up" size={16} color={colors.text} />
          <Text style={[styles.votesCount, { color: colors.text }]}>
            {attempt.votes.length}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  challengeInfo: {
    marginBottom: 12,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  votes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  votesCount: {
    marginLeft: 4,
    fontSize: 14,
  },
});

export default AttemptCard; 