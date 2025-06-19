import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable, FlatList, Image, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '../../../utils/TranslationContext';
import { useSession } from '../../../utils/ctx';
import useTranslationStore from '../../../stores/TranslationStore';
import TranslationService from '../../../services/TranslationService';
import LanguageSearch from '../../../components/LanguageSearch';
import Toast from '../../../components/Toast';
import Constants from '../../../utils/Constants';
import Helpers from '../../../utils/Helpers';
import { useTheme } from '../../../utils/ThemeContext';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

const { INPUT, BUTTON, CAMERA, ERROR_MESSAGES, COLORS, FONT_SIZES, SPACING } = Constants;

/**
 * The camera translation screen for capturing or selecting an image, extracting text, and translating it.
 * @returns {JSX.Element} The camera translation screen component.
 */
const CameraTranslationScreen = () => {
  const { t, locale } = useTranslation();
  const { session } = useSession();
  const { addTextTranslation } = useTranslationStore();
  const { isDarkMode } = useTheme();
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  
  // ✅ SIMPLE INITIALIZATION - Just like text-voice screen
  const [sourceLang, setSourceLang] = useState(session?.preferences?.defaultFromLang || '');
  const [targetLang, setTargetLang] = useState(session?.preferences?.defaultToLang || '');
  
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState('');
  const [languageError, setLanguageError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [translationSaved, setTranslationSaved] = useState(false);
  const [translationData, setTranslationData] = useState(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  // Permission checking useEffect
  useEffect(() => {
    const checkPermissions = async () => {
      if (!permission) return;
      if (!permission.granted) {
        const { status } = await requestPermission();
        setHasCameraPermission(status === 'granted');
        if (status !== 'granted') {
          setError(t('error') + ': ' + ERROR_MESSAGES.CAMERA_PERMISSION_NOT_GRANTED);
          setToastVisible(true);
        }
      } else {
        setHasCameraPermission(true);
      }

      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(galleryPermission.status === 'granted');
      if (galleryPermission.status !== 'granted') {
        setError(t('error') + ': ' + ERROR_MESSAGES.CAMERA_GALLERY_PERMISSION_NOT_GRANTED);
        setToastVisible(true);
      }
    };
    checkPermissions();
  }, [permission, requestPermission, t]);

  // Simple language handlers
  const handleSourceLanguageSelect = useCallback((lang) => {
    setSourceLang(lang);
    setError('');
    setLanguageError('');
  }, []);

  const handleTargetLanguageSelect = useCallback((lang) => {
    setTargetLang(lang);
    setError('');
    setLanguageError('');
  }, []);

  const startCamera = useCallback(() => {
    setError('');
    setLanguageError('');

    if (!session) {
      Alert.alert(
        t('error'),
        'You must be logged in to use Camera Translation. Please log in.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    if (hasCameraPermission !== true) {
      setError(t('error') + ': ' + ERROR_MESSAGES.CAMERA_PERMISSION_NOT_GRANTED);
      setToastVisible(true);
      return;
    }
    
    if (!sourceLang || !targetLang) {
      setError(t('error') + ': ' + ERROR_MESSAGES.CAMERA_LANGUAGES_REQUIRED);
      setToastVisible(true);
      return;
    }

    setIsTranslating(true);
  }, [hasCameraPermission, sourceLang, targetLang, session, router, t]);

  const goBackToMain = useCallback(() => {
    setIsTranslating(false);
    setError('');
    setLanguageError('');
  }, []);

  const capturePhoto = useCallback(async () => {
    try {
      const camera = cameraRef.current;
      if (camera) {
        const photo = await camera.takePictureAsync({ quality: 0.5 });
        setCapturedPhotoUri(photo.uri);
        setIsTranslating(false);
        await processCapturedPhoto(photo.uri, sourceLang, targetLang);
      } else {
        setError(t('error') + ': ' + ERROR_MESSAGES.CAMERA_NOT_AVAILABLE);
        setToastVisible(true);
        setIsTranslating(false);
      }
    } catch (err) {
      setError(t('error') + ': ' + ERROR_MESSAGES.CAMERA_CAPTURE_FAILED);
      setToastVisible(true);
      setIsTranslating(false);
    }
  }, [t, sourceLang, targetLang]);

  const selectPhotoFromGallery = useCallback(async () => {
    try {
      if (!session) {
        Alert.alert(
          t('error'),
          ERROR_MESSAGES.CAMERA_NOT_LOGGED_IN,
          [
            { text: t('cancel'), style: 'cancel' },
            { text: t('login'), onPress: () => router.push('/(auth)/login') },
          ]
        );
        return;
      }

      if (hasGalleryPermission !== true) {
        const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (galleryPermission.status !== 'granted') {
          setError(t('error') + ': ' + ERROR_MESSAGES.CAMERA_GALLERY_PERMISSION_NOT_GRANTED);
          setToastVisible(true);
          return;
        }
        setHasGalleryPermission(true);
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
      });

      if (!result.canceled) {
        const photoUri = result.assets[0].uri;
        setCapturedPhotoUri(photoUri);
        setIsTranslating(false);
        await processCapturedPhoto(photoUri, sourceLang, targetLang);
      }
    } catch (err) {
      setError(t('error') + ': ' + ERROR_MESSAGES.CAMERA_GALLERY_FAILED);
      setToastVisible(true);
      setIsTranslating(false);
    }
  }, [hasGalleryPermission, session, router, t, sourceLang, targetLang]);

  const processCapturedPhoto = useCallback(async (uri, freshSourceLang, freshTargetLang) => {
    setIsProcessing(true);
    setError('');
    setLanguageError('');

    if (!freshTargetLang || freshTargetLang.trim() === '') {
      setError(t('error') + ': Target language is required. Please select a target language.');
      setToastVisible(true);
      setIsProcessing(false);
      return;
    }

    try {
      const imageBase64 = await Helpers.fileToBase64(uri);
      const extractedTextResponse = await TranslationService.recognizeTextFromImage(imageBase64, session?.signed_session_id);

      if (!extractedTextResponse || !extractedTextResponse.text) {
        setOriginalText('');
        setTranslatedText('');
        setError(t('error') + ': ' + ERROR_MESSAGES.CAMERA_NO_TEXT_DETECTED);
        setToastVisible(true);
        return;
      }

      let extractedText = extractedTextResponse.text;
      extractedText = extractedText
        .replace(/^(The text says?:?\s*["\"]?|Text in the image:?\s*["\"]?)/i, '')
        .replace(/["\"]$/, '')
        .replace(/^["\"]/, '')
        .trim();

      const detectResponse = await TranslationService.detectLanguage(extractedText, session?.signed_session_id);
      const detectedLang = detectResponse.detectedLang;

      let translatedText;
      let finalSourceLang = freshSourceLang;

      if (!freshSourceLang || freshSourceLang === 'auto' || freshSourceLang.trim() === '') {
        finalSourceLang = detectedLang;
      } else if (finalSourceLang !== detectedLang) {
        setLanguageError(`The text appears to be in ${detectedLang}, but the source language was set to ${finalSourceLang}. Translation will proceed with detected language.`);
        finalSourceLang = detectedLang;
      }

      if (detectedLang === freshTargetLang) {
        setOriginalText(extractedText);
        setTranslatedText(extractedText);
      } else {
        const translationResponse = await TranslationService.translateText(
          extractedText,
          freshTargetLang,
          finalSourceLang,
          session?.signed_session_id
        );
        translatedText = translationResponse.translatedText;
        setOriginalText(extractedText);
        setTranslatedText(translatedText);
      }

      setTranslationData({
        id: Date.now().toString(),
        fromLang: finalSourceLang,
        toLang: freshTargetLang,
        original_text: extractedText,
        translated_text: translatedText || extractedText,
        created_at: new Date().toISOString(),
        type: 'camera',
        imageUri: uri,
      });
    } catch (err) {
      let errorMessage = t('error') + ': ' + ERROR_MESSAGES.CAMERA_PROCESS_FAILED;
      if (err.message) {
        if (err.message.includes('Network error')) {
          errorMessage = t('error') + ': ' + ERROR_MESSAGES.CAMERA_NETWORK_ERROR;
        } else if (err.message.includes('No text detected')) {
          errorMessage = t('error') + ': ' + ERROR_MESSAGES.CAMERA_NO_TEXT_DETECTED;
        } else {
          errorMessage = t('error') + ': ' + ERROR_MESSAGES.CAMERA_PROCESS_FAILED + ` (${err.message})`;
        }
      }
      setError(errorMessage);
      setToastVisible(true);
    } finally {
      setIsProcessing(false);
    }
  }, [session, t]);

  const handleSaveTranslation = useCallback(async () => {
    if (!translationData) {
      Alert.alert(t('error'), t('error') + ': No translation to save');
      return;
    }

    try {
      await addTextTranslation(translationData, false, session?.signed_session_id);
      setTranslationSaved(true);
      Alert.alert(t('success'), t('saveSuccess'));
    } catch (err) {
      setError(t('error') + ': ' + ERROR_MESSAGES.CAMERA_SAVE_FAILED);
      setToastVisible(true);
    }
  }, [translationData, session, addTextTranslation, t]);

  const handleDeleteTranslation = useCallback(() => {
    setOriginalText('');
    setTranslatedText('');
    setTranslationSaved(false);
    setTranslationData(null);
    setCapturedPhotoUri(null);
    setError('');
    setLanguageError('');
  }, []);

  const handleCameraTap = useCallback(async (event) => {
    if (cameraRef.current) {
      try {
        const { locationX, locationY } = event.nativeEvent;
        const focusPoint = {
          x: locationX / event.nativeEvent.layoutMeasurement.width,
          y: locationY / event.nativeEvent.layoutMeasurement.height,
        };
        await cameraRef.current.focus(focusPoint);
      } catch (err) {
        // Focus error handling
      }
    }
  }, []);

  const renderCameraScreen = useCallback(() => (
    <View style={styles.cameraOverlay}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing="back"
        onPress={handleCameraTap}
      />
      <View style={styles.languageOverlay}>
        <View style={styles.languageContainer}>
          <View style={styles.languageSection}>
            <Text style={[styles.label, { color: INPUT.TEXT_COLOR_DARK }]}>{t('sourceLang')}</Text>
            <View style={styles.languageInputWrapper}>
              <LanguageSearch
                onSelectLanguage={handleSourceLanguageSelect}
                selectedLanguage={sourceLang}
              />
            </View>
          </View>
          <View style={styles.languageSection}>
            <Text style={[styles.label, { color: INPUT.TEXT_COLOR_DARK }]}>{t('targetLang')}</Text>
            <View style={styles.languageInputWrapper}>
              <LanguageSearch
                onSelectLanguage={handleTargetLanguageSelect}
                selectedLanguage={targetLang}
              />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.cameraControls}>
        <TouchableOpacity
          onPress={selectPhotoFromGallery}
          style={[styles.galleryButton, { backgroundColor: CAMERA.BUTTON_COLOR }]}
          accessibilityLabel="Select photo from gallery"
          accessibilityRole="button"
        >
          <FontAwesome name="image" size={24} color={COLORS.CARD} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={capturePhoto}
          style={[styles.captureButton, { backgroundColor: CAMERA.BUTTON_COLOR }]}
          accessibilityLabel="Capture photo and translate"
          accessibilityRole="button"
        >
          <FontAwesome name="camera" size={24} color={COLORS.CARD} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goBackToMain}
          style={[styles.backButton, { backgroundColor: CAMERA.BUTTON_COLOR }]}
          accessibilityLabel="Go back to main camera page"
          accessibilityRole="button"
        >
          <FontAwesome name="arrow-right" size={24} color={COLORS.CARD} />
        </TouchableOpacity>
      </View>
      {error ? <Text style={[styles.error, { color: COLORS.DESTRUCTIVE }]}>{error}</Text> : null}
    </View>
  ), [capturePhoto, selectPhotoFromGallery, goBackToMain, handleCameraTap, handleSourceLanguageSelect, handleTargetLanguageSelect, sourceLang, targetLang, error, t]);

  const renderContent = useCallback(() => (
    <View style={styles.content}>
      <View style={styles.languageContainer}>
        <View style={styles.languageSection}>
          <Text style={[styles.label, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : INPUT.TEXT_COLOR_LIGHT }]}>{t('sourceLang')}</Text>
          <View style={styles.languageInputWrapper}>
            <LanguageSearch
              onSelectLanguage={handleSourceLanguageSelect}
              selectedLanguage={sourceLang}
            />
          </View>
        </View>
        <View style={styles.languageSection}>
          <Text style={[styles.label, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : INPUT.TEXT_COLOR_LIGHT }]}>{t('targetLang')}</Text>
          <View style={styles.languageInputWrapper}>
            <LanguageSearch
              onSelectLanguage={handleTargetLanguageSelect}
              selectedLanguage={targetLang}
            />
          </View>
        </View>
      </View>
      <View style={styles.imageContainer}>
        {capturedPhotoUri ? (
          <Image
            source={{ uri: capturedPhotoUri }}
            style={styles.capturedImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: isDarkMode ? CAMERA.PLACEHOLDER_COLOR_DARK : CAMERA.PLACEHOLDER_COLOR_LIGHT }]}>
            <Text style={[styles.placeholderText, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : COLORS.SECONDARY_TEXT }]}>Camera Preview Will Appear Here</Text>
            <Text style={[styles.noteText, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : COLORS.SECONDARY_TEXT }]}>
              Note: Camera translation uses OpenAI's vision for text recognition.
            </Text>
          </View>
        )}
      </View>
      {isProcessing ? (
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : COLORS.PRIMARY} style={styles.loading} accessibilityLabel="Processing image" />
      ) : (
        <Pressable
          onPress={startCamera}
          style={({ pressed }) => [
            styles.cameraButton,
            { backgroundColor: isDarkMode ? BUTTON.BACKGROUND_COLOR_DARK : COLORS.PRIMARY, opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          accessibilityLabel="Open camera preview"
          accessibilityRole="button"
        >
          <Text style={styles.cameraButtonLabel}>{t('camera')}</Text>
        </Pressable>
      )}
      {error ? <Text style={[styles.error, { color: COLORS.DESTRUCTIVE }]}>{error}</Text> : null}
      {(originalText || translatedText) && !isTranslating && !isProcessing ? (
        <View style={[styles.resultContainer, { backgroundColor: isDarkMode ? INPUT.BACKGROUND_COLOR_DARK : INPUT.BACKGROUND_COLOR_LIGHT }]}>
          {languageError ? (
            <Text style={[styles.languageError, { color: COLORS.DESTRUCTIVE }]}>{languageError}</Text>
          ) : null}
          <Text style={[styles.resultLabel, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : INPUT.TEXT_COLOR_LIGHT }]}>{t('original')}</Text>
          <Text style={[styles.original, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : COLORS.SECONDARY_TEXT }]}>{originalText}</Text>
          <Text style={[styles.resultLabel, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : INPUT.TEXT_COLOR_LIGHT }]}>{t('translated')}</Text>
          <Text style={[styles.translated, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : COLORS.SECONDARY_TEXT }]}>{translatedText}</Text>
          <View style={styles.actionButtons}>
            <Pressable
              onPress={handleSaveTranslation}
              disabled={translationSaved || isProcessing}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: isDarkMode ? CAMERA.SAVE_BUTTON_COLOR_DARK : CAMERA.SAVE_BUTTON_COLOR_LIGHT, opacity: pressed ? 0.7 : 1 },
              ]}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              accessibilityLabel="Save translation"
              accessibilityRole="button"
            >
              <FontAwesome name="save" size={20} color={COLORS.CARD} style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>{t('save')}</Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteTranslation}
              style={({ pressed }) => [
                styles.deleteButton,
                { backgroundColor: isDarkMode ? CAMERA.DELETE_BUTTON_COLOR_DARK : CAMERA.DELETE_BUTTON_COLOR_LIGHT, opacity: pressed ? 0.7 : 1 },
              ]}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              accessibilityLabel="Delete translation"
              accessibilityRole="button"
            >
              <FontAwesome name="trash" size={20} color={COLORS.CARD} style={styles.actionIcon} />
              <Text style={styles.deleteButtonLabel}>{t('deleteTranslation')}</Text>
            </Pressable>
          </View>
          {translationSaved ? (
            <Text style={[styles.savedMessage, { color: COLORS.SUCCESS }]}>{t('saveSuccess')}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  ), [isDarkMode, handleSourceLanguageSelect, handleTargetLanguageSelect, sourceLang, targetLang, capturedPhotoUri, isProcessing, startCamera, error, originalText, translatedText, isTranslating, languageError, handleSaveTranslation, translationSaved, handleDeleteTranslation, t]);

  if (hasCameraPermission === null || hasGalleryPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? CAMERA.BACKGROUND_COLOR_DARK : COLORS.BACKGROUND }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={isDarkMode ? '#fff' : COLORS.PRIMARY} accessibilityLabel="Loading permissions" />
          <Text style={[styles.loadingText, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : COLORS.SECONDARY_TEXT }]}>{t('loading')}</Text>
        </View>
      </View>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? CAMERA.BACKGROUND_COLOR_DARK : COLORS.BACKGROUND }]}>
        <View style={styles.content}>
          <Text style={[styles.error, { color: COLORS.DESTRUCTIVE }]}>{t('error')}: Camera permission not granted</Text>
          <Pressable
            onPress={async () => {
              const { status } = await requestPermission();
              setHasCameraPermission(status === 'granted');
            }}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: isDarkMode ? BUTTON.BACKGROUND_COLOR_DARK : COLORS.PRIMARY, opacity: pressed ? 0.7 : 1 },
            ]}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            accessibilityLabel="Retry camera permission"
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonLabel}>Retry Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? CAMERA.BACKGROUND_COLOR_DARK : COLORS.BACKGROUND }]}>
      {isTranslating ? renderCameraScreen() : (
        <FlatList
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          data={[{ key: 'content' }]}
          renderItem={() => renderContent()}
          ListFooterComponent={
            <Toast
              message={typeof error === 'string' ? error : 'Unknown error'}
              visible={toastVisible}
              onHide={() => setToastVisible(false)}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.SECTION * 2,
  },
  content: {
    alignItems: 'center',
    padding: SPACING.SECTION,
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.SECTION,
  },
  languageSection: {
    flex: 1,
    marginHorizontal: SPACING.SMALL,
    alignItems: 'center',
  },
  languageInputWrapper: {
    width: 150,
  },
  label: {
    fontSize: FONT_SIZES.BODY,
    fontWeight: 'bold',
    marginBottom: SPACING.MEDIUM,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 400,
    marginBottom: SPACING.SECTION,
    position: 'relative',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    fontSize: FONT_SIZES.BODY,
    textAlign: 'center',
    fontWeight: '600',
  },
  noteText: {
    fontSize: FONT_SIZES.SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.MEDIUM,
  },
  cameraOverlay: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  languageOverlay: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: SPACING.SECTION,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureButton: {
    borderRadius: 50,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CAMERA.BUTTON_COLOR,
  },
  galleryButton: {
    borderRadius: 50,
    padding: 15,
    backgroundColor: CAMERA.BUTTON_COLOR,
  },
  backButton: {
    borderRadius: 50,
    padding: 15,
    backgroundColor: CAMERA.BUTTON_COLOR,
  },
  cameraButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: SPACING.MEDIUM,
  },
  cameraButtonLabel: {
    fontSize: FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: COLORS.CARD,
  },
  error: {
    fontSize: FONT_SIZES.SECONDARY,
    marginTop: SPACING.MEDIUM,
    marginBottom: SPACING.SECTION,
    textAlign: 'center',
    color: COLORS.DESTRUCTIVE,
  },
  languageError: {
    fontSize: FONT_SIZES.SECONDARY,
    marginBottom: SPACING.MEDIUM,
    textAlign: 'center',
    color: COLORS.DESTRUCTIVE,
  },
  loading: {
    marginVertical: SPACING.MEDIUM,
  },
  loadingText: {
    marginTop: SPACING.MEDIUM,
    fontSize: FONT_SIZES.BODY,
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: SPACING.SECTION,
    padding: SPACING.SECTION,
    borderRadius: 12,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  resultLabel: {
    fontSize: FONT_SIZES.BODY,
    fontWeight: 'bold',
    marginBottom: SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  original: {
    fontSize: FONT_SIZES.BODY,
    marginBottom: SPACING.LARGE,
    lineHeight: 24,
  },
  translated: {
    fontSize: FONT_SIZES.BODY,
    marginBottom: SPACING.LARGE,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.MEDIUM,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionIcon: {
    marginRight: SPACING.SMALL,
  },
  actionButtonText: {
    color: COLORS.CARD,
    fontSize: FONT_SIZES.SECONDARY,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  deleteButtonLabel: {
    color: COLORS.CARD,
    fontSize: FONT_SIZES.SECONDARY,
  },
  savedMessage: {
    fontSize: FONT_SIZES.SECONDARY,
    color: COLORS.SUCCESS,
    marginTop: SPACING.MEDIUM,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: SPACING.MEDIUM,
  },
  retryButtonLabel: {
    fontSize: FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: COLORS.CARD,
  },
});

export default CameraTranslationScreen;