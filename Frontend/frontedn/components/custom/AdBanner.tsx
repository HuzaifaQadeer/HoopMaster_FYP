import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';

interface AdBannerProps {
  onClose?: () => void;
  type?: 'course' | 'challenge';
}

const AdBanner: React.FC<AdBannerProps> = ({ onClose, type = 'course' }) => {
  const { colors } = useTheme();

  const handleUpgradeClick = () => {
    if (onClose) onClose();
    router.push('/premium-upgrade' as any);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.adContent}>
            <Image 
              source={require('../../assets/images/premium-ad.jpg')} 
              style={styles.adImage}
              resizeMode="contain"
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
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
                  onPress={handleUpgradeClick}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.continueButton]}
                  onPress={onClose}
                >
                  <Text style={styles.continueButtonText}>Continue with Free Version</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={[styles.footer, { backgroundColor: colors.border }]}>
            <Text style={styles.adLabel}>Advertisement</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  adContent: {
    padding: 20,
    alignItems: 'center',
  },
  adImage: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 20,
    borderRadius: 8,
  },
  adTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  adTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  adDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  upgradeButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  continueButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  adLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
});

export default AdBanner; 