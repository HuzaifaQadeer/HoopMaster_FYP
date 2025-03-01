import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface DrillProps {
  name: string;
  description: string;
  imageUrl: string;
  difficulty: string;
  onPress?: () => void; 
}

const Drill: React.FC<DrillProps> = ({ name, imageUrl, onPress }) => {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = (error: any) => {
    console.error('Image loading error:', error?.nativeEvent?.error || 'Unknown error');
    setImageError(true);
  };

  const handlePress = () => {
    console.log('Drill pressed:', name);
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      style={styles.drillContainer}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        {!imageError ? (
          <Image 
            source={{ 
              uri: imageUrl,
              cache: 'force-cache',
            }} 
            style={styles.drillImage}
            resizeMode="cover"
            onError={handleImageError}
          />
        ) : (
          <View style={[styles.drillImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>🏀</Text>
          </View>
        )}
        <View style={styles.drillInfo}>
          <Text style={[styles.drillName, { color: colors.text }]}>{name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  drillContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FA8128',
  },
  contentContainer: {
    flexDirection: 'row',
  },
  drillImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  drillInfo: {
    flex: 1,
    marginLeft: 10,
  },
  drillName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e1e1e1',
  },
  placeholderText: {
    fontSize: 24,
  },
});

export default Drill;