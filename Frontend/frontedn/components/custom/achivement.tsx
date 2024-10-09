import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AchievementProps {
  title: string;
  rank: number;
}
 
const Achievement: React.FC<AchievementProps> = ({ title, rank }) => {
  const { colors } = useTheme();

  const getBadgeIcon = (): 'medal-outline' | undefined => {
    if (rank <= 3) return 'medal-outline';
    return undefined;
  };

  const getBadgeColor = () => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return colors.text;
  };

  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const badgeIcon = getBadgeIcon();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, { color: colors.text }]}>{getOrdinal(rank)}</Text>
        {badgeIcon && (
          <MaterialCommunityIcons
            name={badgeIcon}
            size={24}
            color={getBadgeColor()}
            style={styles.badgeIcon}
          />
        )}
      </View>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    borderRadius: 8,
    padding: 10,
    justifyContent: 'space-between',
    marginRight: 10,
  },
  rankContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  badgeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Achievement;