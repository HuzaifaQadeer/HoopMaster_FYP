import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

const Header = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: colors.border }]}>
      <Text style={[styles.headerText, { color: colors.primary }]}>HoopMaster</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Header;