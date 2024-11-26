import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Header from '../../components/custom/header';

// Dummy data for challenges
const challenges = [
  {
    id: '1',
    title: 'Three in one All star',
    description: 'Perform a dribble combo, shoot a three then finish hard at the rim',
    timeRemaining: '04:53',
    participants: [
      { id: '1', name: 'You', score: '0' },
      { id: '2', name: 'David', score: '921' },
      { id: '3', name: 'William', score: '899' },
      { id: '4', name: 'Cody', score: '880' },
    ]
  },
  {
    id: '2',
    title: 'Side step to glory',
    description: 'Bring the ball from the three point line, do a side step inside the paint area',
    timeRemaining: '12:30',
    participants: [
      { id: '1', name: 'You', score: '0' },
      { id: '2', name: 'Mike', score: '850' },
      { id: '3', name: 'John', score: '820' },
    ]
  }
];

// Dummy data for social posts
const posts = [
  {
    id: '1',
    author: 'Kriston Watshon',
    time: '08:39 am',
    content: 'Hit this new move in game, I had been practicing, what do y\'ll think?',
    profilePic: "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg"
  },
  {
    id: '2',
    author: 'Mike Johnson',
    time: '10:15 am',
    content: 'Just finished an intense training session. Working on my crossover!',
    profilePic: "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg"
  },
  {
    id: '3',
    author: 'Sarah Williams',
    time: '11:45 am',
    content: 'Anyone up for a pickup game at the downtown court this evening?',
    profilePic: "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg"
  }
];

// Add this interface before the ChallengeCard component
interface Challenge {
  id: string;
  title: string;
  description: string;
  timeRemaining: string;
  participants: {
    id: string;
    name: string;
    score: string;
  }[];
}

// Add this interface with the other interfaces
interface Post {
  id: string;
  author: string;
  time: string;
  content: string;
  profilePic: string;
}

const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.challengeCard, { backgroundColor: '#FF6B00' }]}>
      <Text style={styles.challengeTitle}>{challenge.title}</Text>
      <Text style={styles.challengeDescription}>{challenge.description}</Text>
      <View style={styles.participantsContainer}>
        {challenge.participants.map((participant, index) => (
          <View key={participant.id} style={styles.participantRow}>
            <Text style={styles.participantName}>{participant.name}</Text>
            <Text style={styles.participantScore}>{participant.score}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.timeRemaining}>Time remaining: {challenge.timeRemaining}</Text>
    </View>
  );
};

const SocialPost = ({ post }: { post: Post }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.postCard, { backgroundColor: colors.background }]}>
      <View style={styles.postHeader}>
        <Image source={{ uri: post.profilePic }} style={styles.profilePic} />
        <View>
          <Text style={[styles.authorName, { color: colors.text }]}>{post.author}</Text>
          <Text style={styles.postTime}>{post.time}</Text>
        </View>
      </View>
      <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>
    </View>
  );
};

const CommunityPage = () => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.headerContainer}>
        <Header />
      </View>
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly challenges</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.challengesScroll}
        >
          {challenges.map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </ScrollView>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's top posts</Text>
        {posts.map(post => (
          <SocialPost key={post.id} post={post} />
        ))}
      </ScrollView>
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
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  challengesScroll: {
    marginBottom: 24,
  },
  challengeCard: {
    width: 300,
    padding: 16,
    borderRadius: 16,
    marginRight: 16,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    color: 'white',
    marginBottom: 16,
  },
  participantsContainer: {
    marginBottom: 16,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  participantName: {
    color: 'white',
  },
  participantScore: {
    color: 'white',
    fontWeight: 'bold',
  },
  timeRemaining: {
    color: 'white',
    fontSize: 12,
  },
  postCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    marginBottom: 12,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
});

export default CommunityPage;