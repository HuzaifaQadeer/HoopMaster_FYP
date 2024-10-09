import React from 'react';
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
  return (
    <View style={styles.drillContainer}>
      <Link href='/drillMenu'>
        <Image source={{ uri: imageUrl }} style={styles.drillImage} />
        <View style={styles.drillInfo}>
          <Text style={[styles.drillName, { color: colors.text }]}>{name}</Text>
        </View>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  drillContainer: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FA8128',
  },
  drillImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  drillInfo: {
    flex: 1,
    marginLeft: 10,
  },
  drillName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default Drill;