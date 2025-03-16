import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { API_ROUTES } from '@/config/config';
import { useAuth } from '@/context/AuthContext';

interface ProfilePictureProps {
  userId: string;
  size?: number;
  style?: any;
}

const DEFAULT_PROFILE_PICTURE = "https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg";

export default function ProfilePicture({ userId, size = 40, style }: ProfilePictureProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const token = await getToken();
        const pictureUrl = API_ROUTES.GET_USER_PROFILE_PICTURE.replace(':id', userId);
        const response = await fetch(pictureUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          if (response.status !== 404) {
            console.error('Failed to fetch profile picture:', response.status);
          }
          setImageUri(DEFAULT_PROFILE_PICTURE);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('image')) {
          console.warn('Response is not an image:', contentType);
          setImageUri(DEFAULT_PROFILE_PICTURE);
          return;
        }

        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setImageUri(reader.result as string);
        };
      } catch (error) {
        console.error('Error fetching profile picture:', error);
        setImageUri(DEFAULT_PROFILE_PICTURE);
      }
    };

    if (userId) {
      fetchProfilePicture();
    } else {
      setImageUri(DEFAULT_PROFILE_PICTURE);
    }
  }, [userId]);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {imageUri ? (
        <ExpoImage
          source={{ uri: imageUri }}
          style={[styles.image, { width: size, height: size }]}
          contentFit="cover"
          transition={1000}
          onError={() => setImageUri(DEFAULT_PROFILE_PICTURE)}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, backgroundColor: '#FFA500' }]}>
          <Ionicons name="person" size={size * 0.5} color="white" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 1000,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 1000,
  },
  placeholder: {
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 