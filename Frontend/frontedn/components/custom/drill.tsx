import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Link, useRouter} from 'expo-router';
import { useTheme } from '@react-navigation/native';

interface DrillProps {
  name: string;
  description: string;
  imageUrl: string;
  difficulty: string;
}

const Drill: React.FC<DrillProps> = ({ name, imageUrl }) => {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = (error: any) => {
    console.error('Image loading error:', error?.nativeEvent?.error || 'Unknown error');
    setImageError(true);
  };

  return (
    <Link href='/drillMenu' style={styles.drillContainer}>
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
    </Link>
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