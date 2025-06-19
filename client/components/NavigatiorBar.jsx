import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import Constants from '../utils/Constants';

const { ICON_SIZES, STATUS_BAR_HEIGHT } = Constants;

/**
 * A navigation bar component with a back button and title.
 * @param {Object} navigation - The navigation object with a back function.
 * @param {string} title - The title to display.
 * @param {boolean} isDarkMode - Whether dark mode is active.
 * @returns {JSX.Element} The navigation bar component.
 */
const NavigationBar = React.memo(({ navigation, title, isDarkMode }) => {
  const handleBack = () => {
    navigation.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.PRIMARY }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <FontAwesome
          name="arrow-left"
          size={ICON_SIZES.MEDIUM}
          color={isDarkMode ? '#fff' : Constants.COLORS.CARD}
        />
      </TouchableOpacity>
      <Text
        style={[styles.title, { color: isDarkMode ? '#fff' : Constants.COLORS.CARD }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Constants.SPACING.MEDIUM,
    paddingHorizontal: Constants.SPACING.SECTION,
    paddingTop: Constants.SPACING.SECTION + STATUS_BAR_HEIGHT, // Account for status bar
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    marginRight: Constants.SPACING.MEDIUM,
  },
  title: {
    fontSize: Constants.FONT_SIZES.SUBTITLE,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
});

NavigationBar.propTypes = {
  navigation: PropTypes.shape({
    back: PropTypes.func.isRequired,
  }).isRequired,
  title: PropTypes.string.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};

export default NavigationBar;