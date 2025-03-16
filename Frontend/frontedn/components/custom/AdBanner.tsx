import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';

interface AdBannerProps {
  onClose?: () => void;
  type?: 'course' | 'challenge';
}

const AdBanner: React.FC<AdBannerProps> = ({ onClose, type = 'course' }) => {
  const { colors } = useTheme();

  const handleUpgradeClick = () => {
    router.push('/premium-upgrade' as any);
  };

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>
      
      <View style={styles.adContent}>
        <Image 
          source={require('../../assets/images/premium-ad.png')} 
          style={styles.adImage}
          defaultSource={require('../../assets/images/placeholder.png')}
        />
        <View style={styles.adTextContainer}>
          <Text style={[styles.adTitle, { color: colors.text }]}>
            {type === 'course' ? 'Unlock Premium Courses' : 'Challenge Without Limits'}
          </Text>
          <Text style={[styles.adDescription, { color: colors.text }]}>
            {type === 'course' 
              ? 'Get access to all premium courses and train like a pro!' 
              : 'Participate in unlimited challenges and improve your skills!'}
          </Text>
          <TouchableOpacity 
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={handleUpgradeClick}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={[styles.footer, { backgroundColor: colors.card }]}>
        <Text style={styles.adLabel}>Advertisement</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adContent: {
    flexDirection: 'row',
    padding: 15,
  },
  adImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  adTextContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  adTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  upgradeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    padding: 5,
    backgroundColor: '#f5f5f5',
  },
  adLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
  },
});

export default AdBanner; 