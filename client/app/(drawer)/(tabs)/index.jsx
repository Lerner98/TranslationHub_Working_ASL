import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTranslation } from '../../../utils/TranslationContext';
import { useSession } from '../../../utils/ctx';
import useThemeStore from '../../../stores/ThemeStore';
import { useRouter } from 'expo-router';
import Constants from '../../../utils/Constants';
import { FontAwesome } from '@expo/vector-icons';

const HOME = Constants.HOME;

/**
 * The home screen displaying a welcome message and navigation buttons to translation features.
 * @returns {JSX.Element} The home screen component.
 */
const HomeScreen = () => {
  const { t } = useTranslation();
  const { session } = useSession();
  const themeStore = useThemeStore();
  const { isDarkMode = false } = themeStore;
  const router = useRouter();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeTranslate = useCallback((key, fallback = '') => {
    const value = t(key);
    return typeof value === 'string' ? value : fallback;
  }, [t]);

  const welcomeMessage = session
    ? `Hello, ${session.email.split('@')[0]}!`
    : safeTranslate('welcomeGuest', 'Welcome, Guest!');

  const handleTextVoicePress = useCallback(() => {
    if (isMounted.current) router.navigate('/text-voice');
  }, [router]);

  const handleFilePress = useCallback(() => {
    if (isMounted.current) router.navigate('/file');
  }, [router]);

  const handleASLPress = useCallback(() => {
    if (isMounted.current) router.navigate('/asl');
  }, [router]);

  const handleCameraPress = useCallback(() => {
    if (isMounted.current) router.navigate('/camera');
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? HOME.BACKGROUND_COLOR_DARK : HOME.BACKGROUND_COLOR_LIGHT }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroSection}>
          <Text style={[styles.welcomeText, { color: isDarkMode ? HOME.WELCOME_TEXT_COLOR_DARK : HOME.WELCOME_TEXT_COLOR_LIGHT }]}>
            {welcomeMessage}
          </Text>
          <Text style={[styles.descriptionText, { color: isDarkMode ? HOME.DESCRIPTION_TEXT_COLOR_DARK : HOME.DESCRIPTION_TEXT_COLOR_LIGHT }]}>
            {safeTranslate('welcomeMessage', 'Welcome to the app')}
          </Text>
        </View>
        <View style={styles.buttonGrid}>
          <Pressable
            style={({ pressed }) => [
              styles.gridButton,
              { backgroundColor: isDarkMode ? HOME.BUTTON_COLOR_DARK : HOME.BUTTON_COLOR_LIGHT, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleTextVoicePress}
            accessibilityLabel="Navigate to text and voice translation"
            accessibilityRole="button"
          >
            <FontAwesome name="microphone" size={24} color="#FFF" style={styles.gridButtonIcon} />
            <Text style={styles.gridButtonText}>
              {safeTranslate('textVoiceTranslation', 'Text/Voice')}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.gridButton,
              { backgroundColor: isDarkMode ? HOME.BUTTON_COLOR_DARK : HOME.BUTTON_COLOR_LIGHT, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleFilePress}
            accessibilityLabel="Navigate to file translation"
            accessibilityRole="button"
          >
            <FontAwesome name="file-text" size={24} color="#FFF" style={styles.gridButtonIcon} />
            <Text style={styles.gridButtonText}>
              {safeTranslate('fileTranslation', 'File')}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.gridButton,
              { backgroundColor: isDarkMode ? HOME.BUTTON_COLOR_DARK : HOME.BUTTON_COLOR_LIGHT, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleASLPress}
            accessibilityLabel="Navigate to ASL translation"
            accessibilityRole="button"
          >
            <FontAwesome name="sign-language" size={24} color="#FFF" style={styles.gridButtonIcon} />
            <Text style={styles.gridButtonText}>
              {safeTranslate('aslTranslation', 'ASL')}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.gridButton,
              { backgroundColor: isDarkMode ? HOME.BUTTON_COLOR_DARK : HOME.BUTTON_COLOR_LIGHT, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleCameraPress}
            accessibilityLabel="Navigate to camera translation"
            accessibilityRole="button"
          >
            <FontAwesome name="camera" size={24} color="#FFF" style={styles.gridButtonIcon} />
            <Text style={styles.gridButtonText}>
              {safeTranslate('cameraTranslation', 'Camera')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Constants.SPACING.SECTION,
    paddingBottom: 80,
  },
  heroSection: {
    marginBottom: Constants.SPACING.SECTION,
    padding: 20,
    borderRadius: 15,
    backgroundColor: HOME.HERO_BACKGROUND_COLOR,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Constants.SPACING.MEDIUM,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridButton: {
    width: '48%',
    paddingVertical: Constants.SPACING.MEDIUM,
    borderRadius: 12,
    marginBottom: Constants.SPACING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gridButtonIcon: {
    marginBottom: Constants.SPACING.SMALL,
  },
  gridButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen;