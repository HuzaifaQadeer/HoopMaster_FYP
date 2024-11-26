import { Tabs } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';


// ... in your navigator component

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: { backgroundColor: theme.colors.background },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
      }}
    >
      
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false, // This will hide the header
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="drillMenu"
        options={{
          title: 'Basic Drill',
          headerShown: true,
          tabBarButton: () => null,  // This removes the tab bar icon
          tabBarStyle: { display: 'none' },  // This hides the entire tab bar on this screen
        }}
      />
      <Tabs.Screen
        name="videoRecordScreen"
        options={{
          title: 'Record',
          headerShown: false,
          tabBarButton: () => null,  // This removes the tab bar icon
          tabBarStyle: { display: 'none' },  // This hides the entire tab bar on this screen
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="video"
        options={{
          title: 'Video',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="videocam" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="editprofile"
        options={{
          title: 'Edit Profile',
          headerShown: false,
          tabBarButton: () => null,  // This removes the tab bar icon
          tabBarStyle: { display: 'none' },  // This hides the entire tab bar on this screen
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{
          title: 'Setup Profile',
          headerShown: false,
          tabBarButton: () => null,  // This removes the tab bar icon
          tabBarStyle: { display: 'none' },  // This hides the entire tab bar on this screen
        }}
      />
    </Tabs>
  );
}