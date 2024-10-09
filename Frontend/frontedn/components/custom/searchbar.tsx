import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  onSearch: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState('');

  const handleSearch = (text: string) => {
    setSearchText(text);
    onSearch(text);
  };

  return (
    <View style={[styles.searchBar, { backgroundColor: colors.border }]}>
      <Ionicons name="search" size={20} color={colors.text} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Search"
        placeholderTextColor={colors.text}
        value={searchText}
        onChangeText={handleSearch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
});

export default SearchBar;