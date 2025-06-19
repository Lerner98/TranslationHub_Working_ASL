import React, { useState, useEffect, useCallback, useMemo, forwardRef, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, Platform } from 'react-native';
import { IconButton, ActivityIndicator } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTranslation } from '../../../utils/TranslationContext';
import { useSession } from '../../../utils/ctx';
import useTranslationStore from '../../../stores/TranslationStore';
import TranslationService from '../../../services/TranslationService';
import LanguageSearch from '../../../components/LanguageSearch';
import Toast from '../../../components/Toast';
import Constants from '../../../utils/Constants';
import Helpers from '../../../utils/Helpers';
import useThemeStore from '../../../stores/ThemeStore';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Destructure ERROR_MESSAGES from Constants to use the new error message constants
const { ERROR_MESSAGES } = Constants;

/**
 * A memoized TextInput component for efficient rendering.
 * @param {Object} props - The props for the TextInput.
 * @param {string} props.value - The value of the TextInput.
 * @param {function} props.onChangeText - The function to call on text change.
 * @param {Object} props.style - The style for the TextInput.
 * @param {string} props.placeholder - The placeholder text.
 * @param {string} props.placeholderTextColor - The placeholder text color.
 * @param {boolean} props.multiline - Whether the TextInput is multiline.
 * @param {number} props.numberOfLines - The number of lines for multiline TextInput.
 * @param {string} props.keyboardType - The keyboard type.
 * @param {string} props.autoCapitalize - The autoCapitalization setting.
 * @param {boolean} props.autoCorrect - Whether to enable autoCorrect.
 * @param {string} props.textAlign - The text alignment.
 * @param {string} props.accessibilityLabel - The accessibility label.
 * @param {React.Ref} ref - The ref for the TextInput.
 * @returns {JSX.Element} The memoized TextInput component.
 */
const MemoizedTextInput = forwardRef(({ value, onChangeText, style, placeholder, placeholderTextColor, multiline, numberOfLines, keyboardType, autoCapitalize, autoCorrect, textAlign, accessibilityLabel }, ref) => (
  <TextInput
    ref={ref}
    style={style}
    placeholder={placeholder}
    placeholderTextColor={placeholderTextColor}
    value={value}
    onChangeText={onChangeText}
    multiline={multiline}
    numberOfLines={numberOfLines}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
    autoCorrect={autoCorrect}
    textAlign={textAlign}
    accessibilityLabel={accessibilityLabel}
  />
));

// Separate component for the text/voice input and translation UI
/**
 * A memoized component for handling text and voice translation input.
 * @param {Object} props - The props for the component.
 * @param {function} props.t - The translation function.
 * @param {boolean} props.isDarkMode - Whether dark mode is enabled.
 * @param {Object} props.session - The user session object.
 * @param {string} props.sourceLang - The source language code.
 * @param {function} props.setSourceLang - Function to set the source language.
 * @param {string} props.targetLang - The target language code.
 * @param {function} props.setTargetLang - Function to set the target language.
 * @param {function} props.onAddTextTranslation - Function to add a text translation.
 * @param {function} props.onAddVoiceTranslation - Function to add a voice translation.
 * @param {function} props.getGuestTranslationCount - Function to get the guest translation count.
 * @returns {JSX.Element} The text/voice translation input component.
 */
const TextVoiceInput = React.memo(({ t, isDarkMode, session, sourceLang, setSourceLang, targetLang, setTargetLang, onAddTextTranslation, onAddVoiceTranslation, getGuestTranslationCount }) => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translatedOriginalText, setTranslatedOriginalText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [translationSaved, setTranslationSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundObject, setSoundObject] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [translationData, setTranslationData] = useState(null);
  const textInputRef = React.useRef(null);
  const router = useRouter();
  const setTranslationStore = useTranslationStore.setState;
  const { signOut } = useSession();
  const API_URL = Constants.API_URL;

  useEffect(() => {
    setToastVisible(false);
  }, [error]);

  useEffect(() => {
    const checkAndRequestAudioPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const alreadyGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
          if (alreadyGranted) {
            setHasPermission(true);
            return;
          }

          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'TranslationHub needs access to your microphone to record audio.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setHasPermission(true);
          } else {
            setError(t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_PERMISSION_NOT_GRANTED);
            setToastVisible(true);
            setHasPermission(false);
          }
        } else {
          const { status } = await Audio.getPermissionsAsync();
          if (status === 'granted') {
            setHasPermission(true);
            return;
          }

          const { status: newStatus } = await Audio.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            setError(t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_PERMISSION_NOT_GRANTED);
            setToastVisible(true);
            setHasPermission(false);
          } else {
            setHasPermission(true);
          }
        }
      } catch (err) {
        setError(t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_PERMISSION_FAILED(err.message));
        setToastVisible(true);
        setHasPermission(false);
      }
    };
    checkAndRequestAudioPermission();

    return () => {
      if (soundObject) {
        soundObject.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [t]);

  const handleTextChange = useCallback((text) => {
    setInputText(text);
    setError('');
  }, []);

  const handleTranslate = async (textToTranslate = inputText, isVoice = false) => {
    setError('');
    setIsLoading(true);
    setTranslationSaved(false);
    setTranslationData(null);

    if (!textToTranslate.trim()) {
      setError(t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_TEXT_REQUIRED);
      setIsLoading(false);
      return;
    }
    if (!sourceLang || !targetLang) {
      setError(t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_LANGUAGES_REQUIRED);
      setIsLoading(false);
      return;
    }

    const totalCount = await getGuestTranslationCount('total');
    if (!session && totalCount >= Constants.GUEST_TRANSLATION_LIMIT) {
      setError(t('guestLimit'));
      setIsLoading(false);
      return;
    }

    try {
      const token = session?.signed_session_id || '';
      const { translatedText: result, detectedLang } = await TranslationService.translateText(
        textToTranslate,
        targetLang,
        sourceLang,
        token
      );
      if (!result) {
        throw new Error('Translation failed');
      }
      setTranslatedText(result);
      setTranslatedOriginalText(textToTranslate);

      const translation = {
        id: Date.now().toString(),
        fromLang: detectedLang,
        toLang: targetLang,
        original_text: textToTranslate,
        translated_text: result,
        created_at: new Date().toISOString(),
        type: isVoice ? 'voice' : 'text',
      };
      setTranslationData(translation);

      if (!session) {
        setTranslationStore((state) => {
          let updatedGuestTranslations = [...state.guestTranslations, translation];
          if (updatedGuestTranslations.length > 5) {
            updatedGuestTranslations = updatedGuestTranslations.slice(-5);
          }
          AsyncStorage.setItem('guestTranslations', JSON.stringify(updatedGuestTranslations));
          return { guestTranslations: updatedGuestTranslations };
        });
      }
    } catch (err) {
      const errorMessage = Helpers.handleError(err);
      if (errorMessage.includes('Invalid or expired session') && session) {
        await signOut();
        setError(t('error') + ': Your session has expired. Please log in again.');
        setToastVisible(true);
      } else {
        setError(t('error') + ': ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleHear = async () => {
    if (translatedText) {
      if (!session || !session.signed_session_id) {
        Alert.alert(
          t('error'),
          t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_NO_TEXT_TO_HEAR,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Log In',
              onPress: () => router.push('/(auth)/login'),
            },
          ]
        );
        return;
      }

      setIsSpeaking(true);
      try {
        const audioData = await TranslationService.textToSpeech(
          translatedText,
          targetLang,
          session?.signed_session_id
        );
        const audioUri = `${FileSystem.documentDirectory}speech-${Date.now()}.mp3`;
        await FileSystem.writeAsStringAsync(audioUri, Buffer.from(audioData).toString('base64'), {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        setSoundObject(sound);
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsSpeaking(false);
            FileSystem.deleteAsync(audioUri);
            setSoundObject(null);
          }
        });
      } catch (err) {
        const errorMessage = Helpers.handleError(err);
        if (errorMessage.includes('Invalid or expired session') && session) {
          await signOut();
          setError(t('error') + ': Your session has expired. Please log in again.');
          setToastVisible(true);
        } else {
          setError(t('error') + ': ' + errorMessage);
        }
        setIsSpeaking(false);
      }
    } else {
      Alert.alert(t('error'), t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_NO_TEXT_TO_HEAR);
    }
  };

  const handleSave = async () => {
    if (!translatedText || !translationData) {
      Alert.alert(t('error'), t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_NO_TEXT_TO_SAVE);
      return;
    }

    if (isSaving) {
      console.log('Save operation already in progress, ignoring additional clicks');
      return;
    }

    if (!session) {
      const totalCount = await getGuestTranslationCount('total');
      if (totalCount >= Constants.GUEST_TRANSLATION_LIMIT) {
        Alert.alert(t('error'), t('guestLimit'));
        return;
      }
    }

    setIsSaving(true);
    try {
      if (session) {
        // For logged-in users, save to the server
        await onAddTextTranslation(translationData, false, session?.signed_session_id);
      } else {
        // For guest users, save to guestTranslations in the store and AsyncStorage
        // Ensure we don't duplicate by checking if the translation already exists in recent history
        setTranslationStore((state) => {
          const isDuplicate = state.guestTranslations.some(
            (item) =>
              item.original_text === translationData.original_text &&
              item.translated_text === translationData.translated_text &&
              item.type === translationData.type
          );
          
          if (isDuplicate) {
            // If the translation is already in recent history, do not add it again
            return state;
          }

          const updatedGuestTranslations = [...state.guestTranslations, translationData];
          AsyncStorage.setItem('guestTranslations', JSON.stringify(updatedGuestTranslations));
          return { guestTranslations: updatedGuestTranslations };
        });

        // Increment guest translation count
        await useTranslationStore.getState().incrementGuestTranslationCount('text');
      }

      setTranslationSaved(true);
      Alert.alert(t('success'), t('saveSuccess'));
    } catch (err) {
      console.error('Failed to save translation:', err);
      const errorMessage = Helpers.handleError(err);
      if (errorMessage.includes('Invalid or expired session') && session) {
        await signOut();
        setError(t('error') + ': Your session has expired. Please log in again.');
        setToastVisible(true);
      } else {
        setError(t('error') + ': ' + errorMessage);
        setToastVisible(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startRecording = async () => {
    setError('');
    setTranslationSaved(false);

    if (!session || !session.signed_session_id) {
      console.log('User not logged in, redirecting to login');
      Alert.alert(
        t('error'),
        t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_NO_TEXT_TO_HEAR,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Log In',
            onPress: () => router.push('/(auth)/login'),
          },
        ]
      );
      return;
    }

    if (!hasPermission) {
      console.log('Audio permission not granted');
      Alert.alert(
        t('error'),
        t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_PERMISSION_NOT_GRANTED,
        [{ text: 'OK' }]
      );
      return;
    }
    if (!sourceLang || !targetLang) {
      console.log('Source or target language not selected');
      setError(t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_LANGUAGES_REQUIRED);
      setToastVisible(true);
      return;
    }

    if (recording) {
      console.log('Cleaning up existing recording before starting a new one...');
      try {
        await recording.stopAndUnloadAsync();
      } catch (err) {
        console.error('Failed to clean up existing recording:', err);
      }
      setRecording(null);
    }

    try {
      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        allowsRecordingAndroid: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      console.log('Audio mode set successfully');

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: 2, // MediaRecorder.OutputFormat.MPEG_4
          audioEncoder: 3, // MediaRecorder.AudioEncoder.AAC
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: 'high',
          outputFormat: 'aac',
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      console.log('Attempting to create recording with options:', recordingOptions);
      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      console.log('Recording created:', newRecording);
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_RECORDING_FAILED(err.message));
      if (err.message.includes('start failed')) {
        setError(t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_RECORDING_FAILED_EMULATOR);
      } else if (err.message.includes('Only one Recording object')) {
        setError(t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_RECORDING_CONFLICT);
      }
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (cleanupErr) {
          console.error('Failed to clean up recording after error:', cleanupErr);
        }
      }
      setRecording(null);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      console.log('No recording to stop');
      setIsRecording(false);
      setIsLoading(false);
      return;
    }

    setIsRecording(false);
    setIsLoading(true);
    setError('');

    try {
      console.log('Stopping recording...');
      await recording.stopAndUnloadAsync();
      const status = await recording.getStatusAsync();
      console.log('Recording status:', status);

      if (!status || status.durationMillis < 1000) {
        setError(t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_RECORDING_TOO_SHORT);
        setToastVisible(true);
        setRecording(null);
        setIsLoading(false);
        return;
      }

      const uri = recording.getURI();
      if (!uri || !uri.startsWith('file://')) {
        setError(t('error') + ': ' + Constants.ERROR_MESSAGES.TRANSLATION_INVALID_AUDIO_PATH);
        setToastVisible(true);
        setRecording(null);
        setIsLoading(false);
        return;
      }

      console.log('Preparing FormData for upload...');
      const formData = new FormData();
      formData.append('audio', {
        uri: uri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      });
      formData.append('sourceLang', sourceLang);

      console.log('Uploading file to server...');
      const response = await fetch(`${API_URL}/speech-to-text`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.signed_session_id}`,
        },
        body: formData,
      });

      const text = await response.text();
      console.log('Raw response:', text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonErr) {
        console.error('❌ Failed to parse response as JSON');
        throw new Error('Server returned non-JSON response. Raw response: ' + text);
      }

      console.log('Upload response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to transcribe audio');
      }

      const transcribedText = result.text;
      console.log('Transcribed text:', transcribedText);

      if (!transcribedText) {
        throw new Error('Speech-to-text failed');
      }

      setInputText(transcribedText);
      await handleTranslate(transcribedText, true);
    } catch (err) {
      console.error('Failed to stop recording or transcribe:', err);
      const errorMessage = Helpers.handleError(err);
      if (errorMessage.includes('Invalid or expired session') && session) {
        await signOut();
        setError(t('error') + ': Your session has expired. Please log in again.');
        setToastVisible(true);
      } else {
        setError(t('error') + ': ' + errorMessage);
      }
    } finally {
      setRecording(null);
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} pointerEvents="box-none">
        <View style={styles.content}>
          <View style={styles.languageContainer}>
            <View style={styles.languageSection}>
              <Text style={[styles.label, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('sourceLang')}</Text>
              <LanguageSearch
                onSelectLanguage={(lang) => {
                  setSourceLang(lang);
                  setError('');
                }}
                selectedLanguage={sourceLang}
              />
            </View>
            <View style={styles.languageSection}>
              <Text style={[styles.label, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('targetLang')}</Text>
              <LanguageSearch
                onSelectLanguage={(lang) => {
                  setTargetLang(lang);
                  setError('');
                }}
                selectedLanguage={targetLang}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('original')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? Constants.INPUT.BACKGROUND_COLOR_DARK : Constants.COLORS.CARD }]}>
              <MemoizedTextInput
                ref={textInputRef}
                value={inputText}
                onChangeText={handleTextChange}
                style={[styles.input, { backgroundColor: isDarkMode ? Constants.INPUT.BACKGROUND_COLOR_DARK : Constants.COLORS.CARD, color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}
                placeholder={t('original')}
                placeholderTextColor={isDarkMode ? Constants.INPUT.PLACEHOLDER_COLOR_DARK : Constants.INPUT.PLACEHOLDER_COLOR_LIGHT}
                multiline
                numberOfLines={4}
                keyboardType="default"
                autoCapitalize="sentences"
                autoCorrect={false}
                textAlign="auto"
                accessibilityLabel="Enter text to translate"
              />
              <IconButton
                icon={isRecording ? 'microphone-off' : 'microphone'}
                size={24}
                onPress={isRecording ? stopRecording : startRecording}
                onPressIn={() => console.log('Microphone button press in', { isLoading })}
                onPressOut={() => console.log('Microphone button press out', { isLoading })}
                style={styles.microphoneButton}
                iconColor={isRecording ? Constants.COLORS.DESTRUCTIVE : (isDarkMode ? Constants.INPUT.MICROPHONE_COLOR_DARK : Constants.COLORS.PRIMARY)}
                disabled={isLoading}
                accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              setError('');
              handleTranslate(inputText, false);
            }}
            disabled={isLoading || isRecording}
            style={[styles.translateButton, { backgroundColor: isDarkMode ? Constants.BUTTON.BACKGROUND_COLOR_DARK : Constants.COLORS.PRIMARY }]}
          >
            <Text style={styles.translateButtonLabel}>{t('translate')}</Text>
          </TouchableOpacity>

          {error ? (
            <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>{error}</Text>
          ) : null}
          {isLoading ? (
            <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} style={styles.loading} />
          ) : null}

          {translatedText ? (
            <View style={[styles.resultContainer, { backgroundColor: isDarkMode ? Constants.INPUT.BACKGROUND_COLOR_DARK : Constants.COLORS.CARD }]}>
              <Text style={[styles.resultLabel, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('original')}</Text>
              <Text style={[styles.original, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>{translatedOriginalText}</Text>
              <Text style={[styles.resultLabel, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>{t('translated')}</Text>
              <Text style={[styles.translated, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>{translatedText}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setError('');
                    handleHear();
                  }}
                  disabled={isLoading || isSpeaking}
                  style={[styles.actionButton, { backgroundColor: isDarkMode ? Constants.BUTTON.BACKGROUND_COLOR_DARK : Constants.COLORS.PRIMARY }]}
                >
                  <FontAwesome name="volume-up" size={20} color={Constants.COLORS.CARD} style={styles.actionIcon} />
                  <Text style={styles.actionButtonText}>{t('hear')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setError('');
                    handleSave();
                  }}
                  disabled={translationSaved || isLoading || isSaving}
                  style={[styles.actionButton, { backgroundColor: isDarkMode ? Constants.BUTTON.BACKGROUND_COLOR_DARK : Constants.COLORS.PRIMARY }]}
                >
                  <FontAwesome name="save" size={20} color={Constants.COLORS.CARD} style={styles.actionIcon} />
                  <Text style={styles.actionButtonText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
              {translationSaved ? (
                <Text style={[styles.savedMessage, { color: Constants.COLORS.SUCCESS }]}>{t('saveSuccess')}</Text>
              ) : null}
            </View>
          ) : null}

          <Toast
            message={error}
            visible={toastVisible}
            onHide={() => {
              setToastVisible(false);
              setError('');
            }}
            style={styles.toast}
          />
        </View>
      </ScrollView>
    </View>
  );
});

/**
 * The screen for text and voice translation, including recent translations.
 * @returns {JSX.Element} The text/voice translation screen component.
 */
const TextVoiceTranslationScreen = () => {
  const { t, locale } = useTranslation();
  const { session } = useSession();
  const { recentTextTranslations, recentVoiceTranslations, guestTranslations, addTextTranslation, addVoiceTranslation, getGuestTranslationCount } = useTranslationStore();
  const { isDarkMode } = useThemeStore();
  const [sourceLang, setSourceLang] = useState(session?.preferences?.defaultFromLang || '');
  const [targetLang, setTargetLang] = useState(session?.preferences?.defaultToLang || '');
  const router = useRouter();

  // Separate recent translations based on session state
  const recentTranslations = useMemo(() => {
    if (session) {
      // For logged-in users, use recentTextTranslations and recentVoiceTranslations
      return [...recentTextTranslations, ...recentVoiceTranslations].slice(-5);
    } else {
      // For guests, use guestTranslations filtered for text and voice types
      const guestRecent = guestTranslations.filter(item => item.type === 'text' || item.type === 'voice');
      return guestRecent.slice(-5);
    }
  }, [session, recentTextTranslations, recentVoiceTranslations, guestTranslations]);

  useEffect(() => {
    console.log("TOKEN:", session?.signed_session_id);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? Constants.SCREEN.BACKGROUND_COLOR_DARK : Constants.COLORS.BACKGROUND }]}>
      <FlatList
        data={recentTranslations}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <TextVoiceInput
              t={t}
              isDarkMode={isDarkMode}
              session={session}
              sourceLang={sourceLang}
              setSourceLang={setSourceLang}
              targetLang={targetLang}
              setTargetLang={setTargetLang}
              onAddTextTranslation={addTextTranslation}
              onAddVoiceTranslation={addVoiceTranslation}
              getGuestTranslationCount={getGuestTranslationCount}
            />
            {(recentTranslations.length > 0) && (
              <View style={styles.historyContainer}>
                <Text style={[styles.historyTitle, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>
                  {t('recentHistory')}
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.translationItem, { backgroundColor: isDarkMode ? Constants.INPUT.BACKGROUND_COLOR_DARK : Constants.COLORS.CARD }]}>
            <Text style={[styles.translationText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
              {t('original')}: {item.original_text}
            </Text>
            <Text style={[styles.translationText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
              {t('translated')}: {item.translated_text}
            </Text>
            <Text style={[styles.translationText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
              {t('createdAt')}: {Helpers.formatDate(item.created_at, locale)}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.scrollContent}
        extraData={isDarkMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Constants.SPACING.SECTION * 2,
  },
  content: {
    padding: Constants.SPACING.SECTION,
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Constants.SPACING.SECTION,
  },
  languageSection: {
    flex: 1,
    marginHorizontal: Constants.SPACING.SMALL,
  },
  label: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: Constants.SPACING.SECTION,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    padding: Constants.SPACING.LARGE,
    borderRadius: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: Constants.FONT_SIZES.BODY,
  },
  microphoneButton: {
    marginRight: Constants.SPACING.MEDIUM,
    padding: 10,
  },
  translateButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: Constants.SPACING.SECTION,
    alignItems: 'center',
  },
  translateButtonLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
  error: {
    color: Constants.COLORS.DESTRUCTIVE,
    fontSize: Constants.FONT_SIZES.SECONDARY,
    marginBottom: Constants.SPACING.LARGE,
    textAlign: 'center',
  },
  loading: {
    marginVertical: Constants.SPACING.SECTION,
  },
  resultContainer: {
    marginTop: Constants.SPACING.SECTION,
    padding: Constants.SPACING.SECTION,
    borderRadius: 12,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  resultLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  original: {
    fontSize: Constants.FONT_SIZES.BODY,
    marginBottom: Constants.SPACING.LARGE,
    lineHeight: 24,
  },
  translated: {
    fontSize: Constants.FONT_SIZES.BODY,
    marginBottom: Constants.SPACING.LARGE,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Constants.SPACING.MEDIUM,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 140,
    elevation: 3,
  },
  actionIcon: {
    marginRight: Constants.SPACING.MEDIUM,
  },
  actionButtonText: {
    color: Constants.COLORS.CARD,
    fontSize: Constants.FONT_SIZES.SECONDARY,
    fontWeight: '600',
  },
  savedMessage: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    color: Constants.COLORS.SUCCESS,
    marginTop: Constants.SPACING.MEDIUM,
    textAlign: 'center',
  },
  historyContainer: {
    marginTop: Constants.SPACING.SECTION,
  },
  historyTitle: {
    fontSize: Constants.FONT_SIZES.SUBTITLE,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  translationItem: {
    padding: Constants.SPACING.LARGE,
    borderRadius: 12,
    marginBottom: Constants.SPACING.MEDIUM,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  translationText: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    marginBottom: Constants.SPACING.SMALL,
    lineHeight: 20,
  },
});

export default TextVoiceTranslationScreen;