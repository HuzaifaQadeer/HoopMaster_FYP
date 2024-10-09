import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SocialIconsProps {
  socials: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
  };
}

const SocialIcons: React.FC<SocialIconsProps> = ({ socials }) => {
  return (
    <View style={styles.socialsContainer}>
      {socials.instagram && (
        <TouchableOpacity style={styles.socialIcon}>
          <Ionicons name="logo-instagram" size={24} color="#E1306C" />
        </TouchableOpacity>
      )}
      {socials.facebook && (
        <TouchableOpacity style={styles.socialIcon}>
          <Ionicons name="logo-facebook" size={24} color="#4267B2" />
        </TouchableOpacity>
      )}
      {socials.youtube && (
        <TouchableOpacity style={styles.socialIcon}>
          <Ionicons name="logo-youtube" size={24} color="#FF0000" />
        </TouchableOpacity>
      )}
      {socials.twitter && (
        <TouchableOpacity style={styles.socialIcon}>
          <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  socialsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  socialIcon: {
    marginHorizontal: 8,
    paddingHorizontal: 20,
  },
});

export default SocialIcons;