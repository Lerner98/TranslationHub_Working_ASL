import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../utils/TranslationContext';
import { useRouter } from 'expo-router';
import { useSession } from '../utils/ctx';
import AsyncStorageUtils from '../utils/AsyncStorage';
import Toast from '../components/Toast';
import Constants from '../utils/Constants';
import useThemeStore from '../stores/ThemeStore';

const { ERROR_MESSAGES } = Constants;

/**
 * A screen displayed when a user navigates to an invalid route (404).
 * @returns {JSX.Element} The not found screen component.
 */
const NotFoundScreen = React.memo(() => {
  const { t } = useTranslation();
  const { resetSession } = useSession();
  const { isDarkMode } = useThemeStore();
  const [toastVisible, setToastVisible] = useState(true);
  const router = useRouter();

  const backgroundColor = isDarkMode ? '#222' : Constants.COLORS.BACKGROUND;
  const textColor = isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT;
  const buttonColor = isDarkMode ? '#555' : Constants.COLORS.PRIMARY;

  const errText = typeof t('error') === 'string' ? t('error') : 'Error';
  const notFoundText = typeof t('pageNotFound') === 'string' ? t('pageNotFound') : 'Page Not Found';
  const notFoundDesc =
    typeof t('pageNotFoundDescription') === 'string'
      ? t('pageNotFoundDescription')
      : 'The page you are looking for does not exist.';
  const goHomeText = typeof t('goToHome') === 'string' ? t('goToHome') : 'Go to Home';

  const errorMessage = ERROR_MESSAGES.NOT_FOUND_ERROR(errText, notFoundText);

  useEffect(() => {
    const clearSessionOn404 = async () => {
      try {
        await resetSession();
        await AsyncStorageUtils.removeItem('signed_session_id');
        await AsyncStorageUtils.removeItem('user');
      } catch (err) {
        // Log removed
      }
    };
    clearSessionOn404();
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor }]}
      accessibilityLabel="Page not found screen"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.title, { color: Constants.COLORS.DESTRUCTIVE }]}>{errText}</Text>
      <Text style={[styles.description, { color: textColor }]}>{notFoundDesc}</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={() => router.replace('/(drawer)/(tabs)')}
        accessibilityLabel="Go to home page"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{goHomeText}</Text>
      </TouchableOpacity>

      <Toast message={errorMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
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
  title: {
    fontSize: Constants.FONT_SIZES.TITLE,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: Constants.FONT_SIZES.BODY,
    textAlign: 'center',
    marginBottom: Constants.SPACING.SECTION,
    lineHeight: 24,
  },
  button: {
    paddingVertical: Constants.SPACING.MEDIUM,
    paddingHorizontal: Constants.SPACING.SECTION,
    borderRadius: 10,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
});

export default NotFoundScreen;