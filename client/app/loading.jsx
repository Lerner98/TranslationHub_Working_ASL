import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from '../utils/TranslationContext';
import useThemeStore from '../stores/ThemeStore';
import Constants from '../utils/Constants';

const { FALLBACK_TEXT } = Constants;

/**
 * A loading screen component displaying an activity indicator and text.
 * @returns {JSX.Element} The loading screen component.
 */
const LoadingScreen = React.memo(() => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();

  const backgroundColor = isDarkMode ? '#222' : Constants.COLORS.BACKGROUND;
  const indicatorColor = isDarkMode ? '#fff' : Constants.COLORS.PRIMARY;
  const textColor = isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT;

  const translated = t('loading');
  const loadingText = typeof translated === 'string' ? translated : FALLBACK_TEXT.LOADING;

  return (
    <View
      style={[styles.container, { backgroundColor }]}
      accessibilityLabel="Loading screen"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <ActivityIndicator size="large" color={indicatorColor} />
      <Text style={[styles.loadingText, { color: textColor }]}>{loadingText}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Constants.SPACING.SECTION,
  },
  loadingText: {
    marginTop: Constants.SPACING.MEDIUM,
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

export default LoadingScreen;