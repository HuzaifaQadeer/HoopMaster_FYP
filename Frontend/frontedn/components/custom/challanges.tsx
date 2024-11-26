import { View, Text, StyleSheet, Image, ScrollView } from 'react-native'
import React from 'react'

const Challenges = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly challenges</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.challengeCard}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.challengeImage}
          />
          <Text style={styles.challengeTitle}>Three in one All star</Text>
          <Text style={styles.challengeDesc}>Perform a dribble combo, shoot a three then finish hard at the rim</Text>
          <View style={styles.participants}>
            {/* Add participant avatars and names here */}
            <Text style={styles.timer}>Time remaining: 00:04:53</Text>
          </View>
        </View>
        {/* Add more challenge cards */}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  challengeCard: {
    width: 280,
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  challengeImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  challengeDesc: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
  participants: {
    flexDirection: 'row',
    marginTop: 12,
  },
  timer: {
    color: 'white',
    fontSize: 12,
  },
})

export default Challenges