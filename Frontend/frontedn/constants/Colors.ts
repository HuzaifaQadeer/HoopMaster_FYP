import { DarkTheme as NavigationDarkTheme, DefaultTheme, Theme } from '@react-navigation/native';

const tintColorLight = '#FFA500';  // Orange
const tintColorDark = '#FFC04D';   // Lighter Orange for dark mode

export const LightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: tintColorLight,
    background: '#FFFFFF',
    text: '#000000',
    border: '#E1E1E1',
  },
};

export const CustomDarkTheme: Theme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: tintColorDark,
    background: '#2C2C2E',
    text: '#FFFFFF',
    border: '#333333',
  },
};

export default {
  light: LightTheme,
  dark: CustomDarkTheme,
};