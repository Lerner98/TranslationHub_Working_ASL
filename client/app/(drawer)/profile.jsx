import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from '../../utils/TranslationContext';
import { useSession } from '../../utils/ctx';
import { useRouter } from 'expo-router';
import LanguageSearch from '../../components/LanguageSearch';
import Toast from '../../components/Toast';
import AsyncStorageUtils from '../../utils/AsyncStorage';
import Constants from '../../utils/Constants';
import Helpers from '../../utils/Helpers';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

const { PROFILE, ERROR_MESSAGES } = Constants;

/**
 * The profile/settings screen for managing user preferences and settings.
 * @returns {JSX.Element} The profile screen component.
 */

  const ProfileScreen = () => {
  const { t, locale, changeLocale } = useTranslation();
  const { session, preferences, setPreferences } = useSession();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [isDarkModeLocal, setIsDarkModeLocal] = useState(isDarkMode ?? false);
  const [localPreferences, setLocalPreferences] = useState({
    defaultFromLang: preferences?.defaultFromLang || '',
    defaultToLang: preferences?.defaultToLang || '',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [savedTranslations, setSavedTranslations] = useState([]);

  useEffect(() => {
    setIsDarkModeLocal(isDarkMode ?? false);
  }, [isDarkMode]);

  useEffect(() => {
    setSelectedLanguage(locale);
  }, [locale]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');
      try {
        if (session) {
          const savedTextTranslations = (await AsyncStorageUtils.getItem('textTranslations')) || [];
          const savedVoiceTranslations = (await AsyncStorageUtils.getItem('voiceTranslations')) || [];
          setSavedTranslations([...savedTextTranslations, ...savedVoiceTranslations]);

          const savedNotifications = await AsyncStorageUtils.getItem('notificationsEnabled');
          if (savedNotifications !== null) {
            setNotificationsEnabled(savedNotifications === 'true');
          }

          setLocalPreferences({
            defaultFromLang: preferences.defaultFromLang || '',
            defaultToLang: preferences.defaultToLang || '',
          });
        }
      } catch (err) {
        setError(t('error') + ': ' + Helpers.handleError(err));
        setToastVisible(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [session, t]);

  const handleLanguageChange = useCallback(async (language) => {
    try {
      setSelectedLanguage(language);
      if (!session) {
        setError(t('error') + ': ' + ERROR_MESSAGES.PROFILE_LANGUAGE_CHANGE_NOT_LOGGED_IN);
        setToastVisible(true);
        return;
      }
      await changeLocale(language);
    } catch (err) {
      setError(t('error') + ': ' + Helpers.handleError(err));
      setToastVisible(true);
    }
  }, [session, changeLocale, t]);

  const handleSavePreferences = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      if (session) {
        await setPreferences(localPreferences);
        Alert.alert(t('success'), ERROR_MESSAGES.PROFILE_PREFERENCES_SAVED);
      }
    } catch (err) {
      setError(t('error') + ': ' + Helpers.handleError(err));
      setToastVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, [session, localPreferences, setPreferences, t]);

  const handleToggleDarkMode = useCallback(async () => {
    setIsDarkModeLocal((prev) => !prev);
    await toggleTheme();
  }, [toggleTheme]);

  const toggleNotifications = useCallback(async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await AsyncStorageUtils.setItem('notificationsEnabled', newValue.toString());
  }, [notificationsEnabled]);

  const handleClearTranslations = useCallback(async () => {
    Alert.alert(
      t('clearTranslations'),
      t('areYouSure'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await AsyncStorageUtils.removeItem('textTranslations');
              await AsyncStorageUtils.removeItem('voiceTranslations');
              setSavedTranslations([]);
              Alert.alert(t('success'), ERROR_MESSAGES.PROFILE_TRANSLATIONS_CLEARED);
            } catch (err) {
              setError(t('error') + ': ' + Helpers.handleError(err));
              setToastVisible(true);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [t]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { backgroundColor: isDarkModeLocal ? PROFILE.BACKGROUND_COLOR_DARK : PROFILE.BACKGROUND_COLOR_LIGHT }]}>
        <View style={[styles.headerContainer, { backgroundColor: isDarkModeLocal ? PROFILE.BACKGROUND_COLOR_DARK : PROFILE.BACKGROUND_COLOR_LIGHT }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <FontAwesome name="arrow-left" size={24} color={isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT} />
          </Pressable>
          <Text style={[styles.headerText, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>
            {session ? t('profile', { defaultValue: 'Profile' }) : t('settings', { defaultValue: 'Settings' })}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {session && (
            <View style={[styles.section, { backgroundColor: isDarkModeLocal ? PROFILE.SECTION_BACKGROUND_COLOR_DARK : PROFILE.SECTION_BACKGROUND_COLOR_LIGHT }]}>
              <Text style={[styles.sectionTitle, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>{t('profile')}</Text>
              <Text style={[styles.detailText, { color: isDarkModeLocal ? PROFILE.SECONDARY_TEXT_COLOR_DARK : PROFILE.SECONDARY_TEXT_COLOR_LIGHT }]}>{t('email')}</Text>
              <Text style={[styles.detailValue, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>{session.email}</Text>
            </View>
          )}

          <View style={[styles.section, { backgroundColor: isDarkModeLocal ? PROFILE.SECTION_BACKGROUND_COLOR_DARK : PROFILE.SECTION_BACKGROUND_COLOR_LIGHT }]}>
            <Text style={[styles.sectionTitle, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>{t('preferences')}</Text>

            {session && (
              <View style={styles.option}>
                <Text style={[styles.optionText, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>{t('appLanguage')}</Text>
                <View style={styles.languageOptions}>
                  {['en', 'he'].map((lang) => (
                    <Pressable
                      key={lang}
                      style={({ pressed }) => [
                        styles.languageButton,
                        selectedLanguage === lang && styles.selectedLanguageButton,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      onPress={() => handleLanguageChange(lang)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityLabel={`Select ${lang === 'en' ? 'English' : 'Hebrew'} language`}
                      accessibilityRole="button"
                    >
                      <Text style={[
                        styles.languageButtonText,
                        selectedLanguage === lang && styles.selectedLanguageText,
                        { color: isDarkModeLocal ? PROFILE.SECONDARY_TEXT_COLOR_DARK : PROFILE.SECONDARY_TEXT_COLOR_LIGHT },
                        selectedLanguage === lang && { color: PROFILE.SELECTED_TEXT_COLOR },
                      ]}>
                        {lang === 'en' ? 'English' : 'Hebrew'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.option}>
              <Text style={[styles.optionText, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>{t('darkMode')}</Text>
              <Switch
                value={isDarkModeLocal}
                onValueChange={handleToggleDarkMode}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isDarkModeLocal ? '#f5dd4b' : '#f4f3f4'}
                accessibilityLabel="Toggle dark mode"
              />
            </View>

            {session && (
              <>
                <View style={styles.option}>
                  <Text style={[styles.optionText, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>{t('sourceLang')}</Text>
                  <LanguageSearch
                    onSelectLanguage={(lang) => setLocalPreferences({ ...localPreferences, defaultFromLang: lang })}
                    selectedLanguage={localPreferences.defaultFromLang}
                  />
                </View>

                <View style={styles.option}>
                  <Text style={[styles.optionText, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>{t('targetLang')}</Text>
                  <LanguageSearch
                    onSelectLanguage={(lang) => setLocalPreferences({ ...localPreferences, defaultToLang: lang })}
                    selectedLanguage={localPreferences.defaultToLang}
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: isDarkModeLocal ? PROFILE.SAVE_BUTTON_COLOR_DARK : PROFILE.SAVE_BUTTON_COLOR_LIGHT, opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={handleSavePreferences}
                  disabled={isLoading}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Save preferences"
                  accessibilityRole="button"
                >
                  <Text style={styles.saveButtonText}>{t('savePreferences')}</Text>
                </Pressable>
              </>
            )}
          </View>

          {session && (
            <View style={[styles.section, { backgroundColor: isDarkModeLocal ? PROFILE.SECTION_BACKGROUND_COLOR_DARK : PROFILE.SECTION_BACKGROUND_COLOR_LIGHT }]}>
              <Text style={[styles.sectionTitle, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>{t('notifications')}</Text>
              <View style={styles.option}>
                <Text style={[styles.optionText, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>{t('notifications')}</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
                  accessibilityLabel="Toggle notifications"
                />
              </View>
            </View>
          )}

          {session && savedTranslations.length > 0 && (
            <View style={[styles.section, { backgroundColor: isDarkModeLocal ? PROFILE.SECTION_BACKGROUND_COLOR_DARK : PROFILE.SECTION_BACKGROUND_COLOR_LIGHT }]}>
              <Text style={[styles.sectionTitle, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>{t('clearTranslations')}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.clearButton,
                  { backgroundColor: Constants.COLORS.DESTRUCTIVE, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleClearTranslations}
                disabled={isLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Clear translations"
                accessibilityRole="button"
              >
                <Text style={styles.clearButtonText}>{t('clearTranslations')}</Text>
              </Pressable>
            </View>
          )}

          <View style={[styles.section, { backgroundColor: isDarkModeLocal ? PROFILE.SECTION_BACKGROUND_COLOR_DARK : PROFILE.SECTION_BACKGROUND_COLOR_LIGHT }]}>
            <Pressable style={styles.option}>
              <Text style={[styles.optionText, { color: isDarkModeLocal ? PROFILE.TEXT_COLOR_DARK : PROFILE.TEXT_COLOR_LIGHT }]}>{t('about')}</Text>
              <Text style={[styles.optionValue, { color: isDarkModeLocal ? PROFILE.SECONDARY_TEXT_COLOR_DARK : PROFILE.SECONDARY_TEXT_COLOR_LIGHT }]}>{t('comingSoon')}</Text>
            </Pressable>
          </View>
        </ScrollView>

        {isLoading && (
          <ActivityIndicator
            size="large"
            color={isDarkModeLocal ? '#fff' : Constants.COLORS.PRIMARY}
            style={styles.loading}
            accessibilityLabel="Loading profile settings"
          />
        )}
        <Toast message={error} visible={toastVisible} onHide={() => setToastVisible(false)} />
      </View>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Constants.SPACING.MEDIUM,
    paddingVertical: Constants.SPACING.LARGE,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 24,
  },
  scrollContent: {
    padding: Constants.SPACING.SECTION,
    paddingBottom: Constants.SPACING.SECTION * 2,
  },
  section: {
    borderRadius: 12,
    padding: Constants.SPACING.MEDIUM,
    marginBottom: Constants.SPACING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
  },
  detailText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Constants.SPACING.SMALL,
  },
  detailValue: {
    fontSize: 16,
    marginBottom: Constants.SPACING.MEDIUM,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Constants.SPACING.SMALL,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionValue: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  languageOptions: {
    flexDirection: 'row',
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: PROFILE.BORDER_COLOR,
  },
  selectedLanguageButton: {
    borderColor: PROFILE.SELECTED_BUTTON_BORDER_COLOR,
    backgroundColor: PROFILE.SELECTED_BUTTON_COLOR,
  },
  languageButtonText: {
    fontSize: 14,
  },
  selectedLanguageText: {
    color: PROFILE.SELECTED_TEXT_COLOR,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: Constants.SPACING.MEDIUM,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Constants.SPACING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: Constants.SPACING.MEDIUM,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Constants.SPACING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: Constants.COLORS.DESTRUCTIVE,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    marginBottom: Constants.SPACING.LARGE,
  },
});

export default ProfileScreen;