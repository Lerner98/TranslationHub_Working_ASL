import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import PropTypes from 'prop-types';
import { useTranslation } from '../utils/TranslationContext';
import { useSession } from '../utils/ctx';
import useLanguageStore from '../stores/LanguageStore';
import Constants from '../utils/Constants';
import useThemeStore from '../stores/ThemeStore';
import { useFocusEffect } from 'expo-router';

const { DROPDOWN } = Constants;

/**
 * A searchable dropdown component for selecting languages.
 * @param {Function} onSelectLanguage - Callback to handle language selection.
 * @param {string} [selectedLanguage] - The currently selected language code.
 * @returns {JSX.Element} The language search component.
 */
const LanguageSearch = ({ onSelectLanguage, selectedLanguage }) => {
  const { t } = useTranslation();
  const { session } = useSession();
  const { languages, fetchLanguages, isLoading, error } = useLanguageStore();
  const { isDarkMode } = useThemeStore();

  const [displayValue, setDisplayValue] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedLanguageName, setSelectedLanguageName] = useState('');

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (error) {
      return;
    }
    if (languages.length > 0) {
      if (selectedLanguage) {
        const selectedLang = languages.find((lang) => lang.code === selectedLanguage);
        if (selectedLang) {
          setSelectedLanguageName(selectedLang.name);
          setDisplayValue(selectedLang.name);
        }
      }
    }
  }, [languages, error, selectedLanguage]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setIsDropdownOpen(false);
        setDisplayValue(selectedLanguageName);
      };
    }, [selectedLanguageName])
  );

  const handleSearchChange = (text) => {
    setDisplayValue(text);
    if (text) {
      setIsDropdownOpen(true);
      const normalized = text.toLowerCase();
      const filtered = languages
        .filter((lang) => lang.name.toLowerCase().startsWith(normalized))
        .slice(0, 8);
      setFilteredLanguages(filtered);
    } else {
      setIsDropdownOpen(false);
      setFilteredLanguages([]);
    }
  };

  const handleSelectLanguage = (lang) => {
    setDisplayValue(lang.name);
    setSelectedLanguageName(lang.name);
    setFilteredLanguages(languages.slice(0, 8));
    onSelectLanguage(lang.code);
    setIsDropdownOpen(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    setDisplayValue('');
    setFilteredLanguages([]);
  };

  const handleBackdropPress = () => {
    setIsDropdownOpen(false);
    setDisplayValue(selectedLanguageName);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? '#333' : Constants.COLORS.CARD,
              color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT,
            },
          ]}
          placeholder={t('searchLanguages')}
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          value={displayValue}
          onChangeText={handleSearchChange}
          onFocus={handleFocus}
          accessibilityLabel="Search languages"
        />
      </View>

      {error ? (
        <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>{error}</Text>
      ) : isLoading ? (
        <ActivityIndicator
          size="small"
          color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY}
          style={styles.loading}
        />
      ) : isDropdownOpen ? (
        <>
          <TouchableOpacity
            style={styles.backdrop}
            onPress={handleBackdropPress}
            accessibilityLabel="Close dropdown"
          />
          <View style={styles.dropdownContainer}>
            {filteredLanguages.length === 0 ? (
              <Text
                style={[
                  styles.noResults,
                  {
                    color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT,
                  },
                ]}
              >
                {t('noLanguagesFound')}
              </Text>
            ) : (
              <FlatList
                data={filteredLanguages}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.item,
                      {
                        backgroundColor: isDarkMode ? '#444' : Constants.COLORS.CARD,
                      },
                    ]}
                    onPress={() => handleSelectLanguage(item)}
                    accessibilityLabel={`Select language ${item.name}`}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        {
                          color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT,
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                style={styles.list}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Constants.SPACING.MEDIUM,
    zIndex: 9998, // Ensure the entire component is above other elements
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: Constants.SPACING.MEDIUM,
    borderRadius: 10,
    fontSize: Constants.FONT_SIZES.BODY,
    marginBottom: Constants.SPACING.MEDIUM,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backdrop: {
    position: 'absolute',
    top: -1000, // Extend beyond the component to cover the entire screen
    bottom: -1000,
    left: -1000,
    right: -1000,
    zIndex: 9997, // Below the dropdown but above other elements
    elevation: 9997,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999, // High zIndex to ensure dropdown is above everything
  },
  list: {
    maxHeight: DROPDOWN.MAX_HEIGHT,
    borderRadius: 8,
    backgroundColor: Constants.COLORS.CARD,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 9999, // High elevation for Android
  },
  item: {
    padding: Constants.SPACING.MEDIUM,
    borderBottomWidth: DROPDOWN.BORDER_WIDTH,
    borderBottomColor: DROPDOWN.BORDER_COLOR,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: Constants.FONT_SIZES.BODY,
  },
  error: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    textAlign: 'center',
    marginBottom: Constants.SPACING.MEDIUM,
  },
  noResults: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    textAlign: 'center',
    marginBottom: Constants.SPACING.MEDIUM,
  },
  loading: {
    marginBottom: Constants.SPACING.MEDIUM,
  },
});

LanguageSearch.propTypes = {
  onSelectLanguage: PropTypes.func.isRequired,
  selectedLanguage: PropTypes.string,
};

export default LanguageSearch;