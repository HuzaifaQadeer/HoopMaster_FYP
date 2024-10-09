import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

interface SocialMediaSelectorProps {
  socialMedia: Record<string, string>;
  onSocialMediaChange: (newSocialMedia: Record<string, string>) => void;
}

const socialMediaPlatforms = ['Instagram', 'Facebook', 'YouTube', 'Twitter'];

const SocialMediaSelector: React.FC<SocialMediaSelectorProps> = ({ socialMedia, onSocialMediaChange }) => {
  const [selectedSocialMedia, setSelectedSocialMedia] = useState<string>('');
  const [socialMediaInput, setSocialMediaInput] = useState<string>('');
  const { colors } = useTheme();

  const handleSocialMediaAdd = () => {
    if (selectedSocialMedia && socialMediaInput && !socialMedia[selectedSocialMedia]) {
      const updatedSocialMedia = {
        ...socialMedia,
        [selectedSocialMedia]: socialMediaInput,
      };
      onSocialMediaChange(updatedSocialMedia);
      setSocialMediaInput('');
      setSelectedSocialMedia('');
    }
  };

  const handleSocialMediaRemove = (platform: string) => {
    const updatedSocialMedia = { ...socialMedia };
    delete updatedSocialMedia[platform];
    onSocialMediaChange(updatedSocialMedia);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Facebook':
        return <FontAwesome name="facebook" size={24} color="#1877F2" />;
      case 'Instagram':
        return <FontAwesome name="instagram" size={24} color="#C13584" />;
      case 'YouTube':
        return <FontAwesome name="youtube" size={24} color="#FF0000" />;
      case 'Twitter':
        return <FontAwesome name="twitter" size={24} color="#1DA1F2" />;
      default:
        return <Ionicons name="close-circle" size={24} color={colors.text} />;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Social Media</Text>
      <View style={styles.inputContainer}>
        <Picker
          selectedValue={selectedSocialMedia}
          onValueChange={(itemValue) => setSelectedSocialMedia(itemValue)}
          style={[styles.picker, { color: colors.text }]}
        >
          <Picker.Item label="Select Platform" value="" />
          {socialMediaPlatforms.map((platform) => (
            <Picker.Item key={platform} label={platform} value={platform} />
          ))}
        </Picker>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Link"
          value={socialMediaInput}
          onChangeText={setSocialMediaInput}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleSocialMediaAdd}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.list}>
        {Object.entries(socialMedia).map(([platform]) => (
          <View key={platform} style={styles.item}>
            {getPlatformIcon(platform)}
            <TouchableOpacity onPress={() => handleSocialMediaRemove(platform)}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  picker: {
    flex: 2,
    height: 40,
  },
  input: {
    flex: 2,
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  addButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    marginTop: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
});

export default SocialMediaSelector;