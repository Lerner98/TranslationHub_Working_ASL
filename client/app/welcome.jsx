import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '../stores/ThemeStore';
import Constants from '../utils/Constants';
import { useSession } from '../utils/ctx';
import { useTranslation } from '../utils/TranslationContext';
import AsyncStorageUtils from '../utils/AsyncStorage';
import { FontAwesome } from '@expo/vector-icons';

const { WELCOME } = Constants;

/**
 * The welcome screen providing options to continue as a guest, register, or log in.
 * @returns {JSX.Element} The welcome screen component.
 */
const WelcomeScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { resetSessionButKeepPreferences } = useSession();
  const getThemeStore = () => require('../stores/ThemeStore').default;
  const themeStore = getThemeStore();
  let isDarkMode = false;
  try {
    const storeResult = themeStore();
    isDarkMode = storeResult?.isDarkMode ?? false;
  } catch (err) {
    // Console log removed
  }

  const safeTranslate = useCallback((key, fallback = '') => {
    try {
      const val = t(key);
      return typeof val === 'string' ? val : fallback;
    } catch {
      return fallback;
    }
  }, [t]);

  useEffect(() => {
    const forceResetSession = async () => {
      try {
        await resetSessionButKeepPreferences();
      } catch (err) {
        // Remove console.warn
      }
    };
    forceResetSession();
  }, [resetSessionButKeepPreferences]);

  const continueAsGuest = useCallback(async () => {
    await resetSessionButKeepPreferences();
    router.replace('/(drawer)/(tabs)');
  }, [resetSessionButKeepPreferences, router]);

  return (
    <View
      style={[styles.container, { backgroundColor: isDarkMode ? WELCOME.BACKGROUND_COLOR_DARK : WELCOME.BACKGROUND_COLOR_LIGHT }]}
      accessibilityLabel="Welcome screen"
    >
      <FontAwesome
        name="language"
        size={60}
        color={isDarkMode ? WELCOME.TITLE_COLOR_DARK : WELCOME.TITLE_COLOR_LIGHT}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: isDarkMode ? WELCOME.TITLE_COLOR_DARK : WELCOME.TITLE_COLOR_LIGHT }]}>
        {safeTranslate('welcome', 'TranslationHub')}
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDarkMode ? WELCOME.GUEST_BUTTON_COLOR_DARK : WELCOME.GUEST_BUTTON_COLOR_LIGHT }]}
        onPress={async () => {
          const token = await AsyncStorageUtils.getItem('signed_session_id');
          if (token) {
            Alert.alert(
              safeTranslate('activeSession', 'Session Detected'),
              safeTranslate('guestLimit', 'You are logged in. Continue as guest? This will log you out.'),
              [
                { text: safeTranslate('cancel', 'Cancel'), style: 'cancel' },
                { text: safeTranslate('continue', 'Continue as Guest'), onPress: continueAsGuest }
              ]
            );
          } else {
            continueAsGuest();
          }
        }}
        accessibilityLabel="Continue as guest"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{safeTranslate('continueGuest', 'Continue as Guest')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDarkMode ? WELCOME.REGISTER_BUTTON_COLOR_DARK : WELCOME.REGISTER_BUTTON_COLOR_LIGHT }]}
        onPress={() => router.push('/(auth)/register')}
        accessibilityLabel="Register"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{safeTranslate('register', 'Sign Up')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isDarkMode ? WELCOME.LOGIN_BUTTON_COLOR_DARK : WELCOME.LOGIN_BUTTON_COLOR_LIGHT }]}
        onPress={() => router.push('/(auth)/login')}
        accessibilityLabel="Login"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{safeTranslate('login', 'Login')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Constants.SPACING.SECTION,
  },
  icon: {
    marginBottom: Constants.SPACING.MEDIUM,
  },
  title: {
    fontSize: Constants.FONT_SIZES.TITLE,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.SECTION * 2,
    textAlign: 'center',
  },
  button: {
    width: '80%',
    paddingVertical: Constants.SPACING.MEDIUM,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Constants.SPACING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: '600',
  },
});

export default WelcomeScreen;