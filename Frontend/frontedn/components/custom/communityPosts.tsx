import { View, Text, StyleSheet, Image } from 'react-native'
import React from 'react'

const CommunityPosts = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's top posts</Text>
      <View style={styles.post}>
        <View style={styles.postHeader}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.avatar}
          />
          <View>
            <Text style={styles.userName}>Kriston Watshon</Text>
            <Text style={styles.timeStamp}>08:39 am</Text>
          </View>
        </View>
        <Text style={styles.postText}>
          Hit this new move in game, I had been practicing, what do y'll think?
        </Text>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.postImage}
        />
      </View>
      {/* Add more posts */}
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
  post: {
    marginBottom: 24,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeStamp: {
    fontSize: 12,
    color: '#666',
  },
  postText: {
    fontSize: 14,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
})

export default CommunityPosts
