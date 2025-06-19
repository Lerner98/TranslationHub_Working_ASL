import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Pressable } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from '../../utils/TranslationContext';
import { useSession } from '../../utils/ctx';
import useTranslationStore from '../../stores/TranslationStore';
import Toast from '../../components/Toast';
import { useRouter } from 'expo-router';
import Constants from '../../utils/Constants';
import Helpers from '../../utils/Helpers';
import { useTheme } from '../../utils/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import ApiService from '../../services/ApiService'; // Reintroduce ApiService

const { INPUT, SAVES, ERROR_MESSAGES } = Constants;

/**
 * A component that renders a single translation item with a delete button.
 * @param {Object} props - The component props.
 * @param {Object} props.item - The translation item data.
 * @param {boolean} props.isDarkMode - Whether dark mode is enabled.
 * @param {Function} props.onDelete - Callback to delete the translation.
 * @param {Function} props.t - Translation function.
 * @param {string} props.locale - The current locale.
 * @returns {JSX.Element} The translation item component.
 */
const TranslationItem = React.memo(({ item, isDarkMode, onDelete, t, locale }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const onDeletePress = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    onDelete(item.id, () => setIsDeleting(false));
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'text':
        return 'font';
      case 'voice':
        return 'microphone';
      case 'camera':
        return 'camera';
      case 'file':
        return 'file';
      default:
        return 'question';
    }
  };

  return (
    <View style={[styles.translationItem, { backgroundColor: isDarkMode ? INPUT.BACKGROUND_COLOR_DARK : INPUT.BACKGROUND_COLOR_LIGHT }]}>
      <View style={[styles.translationContent]}>
        <View style={styles.typeIconContainer}>
          <FontAwesome name={getTypeIcon()} size={20} color={isDarkMode ? INPUT.TEXT_COLOR_DARK : Constants.COLORS.SECONDARY_TEXT} />
        </View>
        <Text style={[styles.translationText, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : Constants.COLORS.SECONDARY_TEXT }]}> 
          {t('original', { defaultValue: 'Original Text' })}: {item.original_text}
        </Text>
        <Text style={[styles.translationText, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : Constants.COLORS.SECONDARY_TEXT }]}> 
          {t('translated', { defaultValue: 'Translated Text' })}: {item.translated_text}
        </Text>
        <Text style={[styles.translationText, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : Constants.COLORS.SECONDARY_TEXT }]}> 
          {t('createdAt', { defaultValue: 'Created At' })}: {Helpers.formatDate(item.created_at, locale)}
        </Text>
      </View>
      <Pressable
        onPress={onDeletePress}
        style={({ pressed }) => [styles.deleteButtonWrapper, { opacity: pressed ? 0.7 : 1 }]}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        accessibilityLabel="Delete translation"
        accessibilityRole="button"
      >
        <FontAwesome name="trash" size={24} color={Constants.COLORS.DESTRUCTIVE} />
      </Pressable>
    </View>
  );
});

/**
 * The saves screen displaying a list of saved translations with options to delete or clear all.
 * @returns {JSX.Element} The saves screen component.
 */
const SavesScreen = () => {
  const { t, locale } = useTranslation();
  const { session } = useSession();
  const {
    savedTextTranslations,
    guestTranslations,
    fetchTranslations,
    clearTranslations,
    clearGuestTranslations,
    isLoading,
    error,
  } = useTranslationStore();
  const setTranslationStore = useTranslationStore.setState;
  const { isDarkMode } = useTheme();
  const [toastVisible, setToastVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const loadTranslations = async () => {
      if (session && isMounted) {
        try {
          await fetchTranslations(session);
        } catch (err) {
          if (isMounted) {
            setTranslationStore({ error: t('error') + ': ' + Helpers.handleError(err) });
            setToastVisible(true);
          }
        }
      }
    };
    loadTranslations();
    return () => { isMounted = false; };
  }, [session, fetchTranslations, setTranslationStore, t]);

  const handleDeleteTranslation = useCallback((id, onComplete) => {
    console.log('handleDeleteTranslation called with id:', id);
    Alert.alert(
      t('deleteTranslation', { defaultValue: 'Delete Translation' }),
      t('areYouSure', { defaultValue: 'Are you sure?' }),
      [
        { 
          text: t('cancel', { defaultValue: 'Cancel' }), 
          style: 'cancel',
          onPress: () => {
            console.log('Delete cancelled for id:', id);
            onComplete();
          }
        },
        {
          text: t('delete', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: async () => {
            console.log('Delete confirmed for id:', id);
            try {
              if (session) {
                const translation = savedTextTranslations.find((item) => item.id === id);
                if (translation) {
                  console.log('Deleting translation from server for id:', id);
                  console.log('Session token:', session.signed_session_id);
                  const response = await ApiService.delete(`/translations/delete/${id}`, session.signed_session_id, { timeout: 10000 });
                  if (!response.success) {
                    throw new Error(response.error || ERROR_MESSAGES.SAVES_DELETE_SERVER_FAILED);
                  }
                  console.log('Server deletion successful');
                  setTranslationStore((state) => ({
                    savedTextTranslations: state.savedTextTranslations.filter((item) => item.id !== id),
                  }));
                  await fetchTranslations(session);
                  console.log('Translations refetched after deletion');
                } else {
                  console.log('Translation not found in savedTextTranslations:', id);
                }
              } else {
                console.log('Deleting translation for guest user with id:', id);
                const updatedTranslations = guestTranslations.filter((item) => item.id !== id);
                setTranslationStore({ guestTranslations: updatedTranslations });
                await AsyncStorage.setItem('guestTranslations', JSON.stringify(updatedTranslations));
                console.log('Guest translations updated in AsyncStorage');
              }
            } catch (err) {
              console.error('Deletion error:', err.message);
              setTranslationStore({ error: t('error') + ': ' + Helpers.handleError(err) });
              setToastVisible(true);
            } finally {
              onComplete();
            }
          },
        },
      ]
    );
  }, [session, savedTextTranslations, guestTranslations, fetchTranslations, setTranslationStore, t]);

  const handleClearTranslations = useCallback(async () => {
    Alert.alert(
      t('clearTranslations', { defaultValue: 'Clear Translations' }),
      t('areYouSure', { defaultValue: 'Are you sure?' }),
      [
        { text: t('cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('clear', { defaultValue: 'Clear' }),
          style: 'destructive',
          onPress: async () => {
            try {
              if (session) {
                await clearTranslations(session);
                setTranslationStore({ savedTextTranslations: [] });
                await fetchTranslations(session);
              } else {
                await clearGuestTranslations();
                setTranslationStore({ guestTranslations: [] });
                await AsyncStorage.setItem('guestTranslations', JSON.stringify([]));
              }
            } catch (err) {
              setTranslationStore({ error: t('error') + ': ' + Helpers.handleError(err) });
              setToastVisible(true);
            }
          },
        },
      ]
    );
  }, [session, clearTranslations, clearGuestTranslations, fetchTranslations, setTranslationStore, t]);

  const translations = session ? savedTextTranslations : guestTranslations.filter(item => item.type === 'text');

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? SAVES.BACKGROUND_COLOR_DARK : Constants.COLORS.BACKGROUND }]}>
      {isLoading && (
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} style={styles.loading} accessibilityLabel="Loading translations" />
      )}
      <FlatList
        data={translations}
        renderItem={({ item }) => (
          <TranslationItem item={item} isDarkMode={isDarkMode} onDelete={handleDeleteTranslation} t={t} locale={locale} />
        )}
        keyExtractor={(item, index) => `${item.id || index}`}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <FontAwesome name="chevron-left" size={24} color={isDarkMode ? INPUT.TEXT_COLOR_DARK : INPUT.TEXT_COLOR_LIGHT} />
              </Pressable>
              <Text style={[styles.title, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : INPUT.TEXT_COLOR_LIGHT }]}>
                {t('saves', { defaultValue: 'Saved Translations' })}
              </Text>
              <View style={styles.placeholder} />
            </View>
            {translations.length > 0 && (
              <Pressable
                onPress={handleClearTranslations}
                style={({ pressed }) => [
                  styles.clearButton,
                  { backgroundColor: Constants.COLORS.DESTRUCTIVE, opacity: pressed ? 0.7 : 1 },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Clear all translations"
                accessibilityRole="button"
              >
                <Text style={styles.clearButtonLabel}>{t('clearTranslations', { defaultValue: 'Clear Translations' })}</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading && (
            <Text style={[styles.noTranslations, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : Constants.COLORS.SECONDARY_TEXT }]}> 
              {t('noTranslations', { defaultValue: 'No saved translations found.' })}
            </Text>
          )
        }
        contentContainerStyle={styles.scrollContent}
      />
      {error && typeof error === 'string' && (
        <Toast message={error} visible={toastVisible} onHide={() => setToastVisible(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Constants.SPACING.SECTION,
    paddingBottom: Constants.SPACING.SECTION * 2,
  },
  header: {
    marginBottom: Constants.SPACING.SECTION,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Constants.SPACING.LARGE,
  },
  backButton: {
    padding: Constants.SPACING.SMALL,
  },
  title: {
    fontSize: Constants.FONT_SIZES.TITLE,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 24,
  },
  clearButton: {
    width: '80%',
    paddingVertical: Constants.SPACING.MEDIUM,
    paddingHorizontal: Constants.SPACING.LARGE,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: Constants.COLORS.DESTRUCTIVE,
  },
  clearButtonLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
  translationItem: {
    flexDirection: 'row',
    padding: Constants.SPACING.LARGE,
    borderRadius: 12,
    marginBottom: Constants.SPACING.MEDIUM,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  translationContent: {
    flex: 1,
  },
  typeIconContainer: {
    marginBottom: Constants.SPACING.SMALL,
  },
  translationText: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    marginBottom: Constants.SPACING.SMALL,
    lineHeight: 20,
  },
  deleteButtonWrapper: {
    padding: Constants.SPACING.SMALL,
  },
  noTranslations: {
    fontSize: Constants.FONT_SIZES.BODY,
    textAlign: 'center',
    marginTop: Constants.SPACING.SECTION,
  },
  loading: {
    marginVertical: Constants.SPACING.SECTION,
  },
});

export default SavesScreen;