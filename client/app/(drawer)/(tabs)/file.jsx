import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTranslation } from '../../../utils/TranslationContext';
import { useSession } from '../../../utils/ctx';
import useTranslationStore from '../../../stores/TranslationStore';
import TranslationService from '../../../services/TranslationService';
import FileService from '../../../services/FileService';
import LanguageSearch from '../../../components/LanguageSearch';
import Toast from '../../../components/Toast';
import Constants from '../../../utils/Constants';
import Helpers from '../../../utils/Helpers';
import { useTheme } from '../../../utils/ThemeContext';
import { useRouter } from 'expo-router';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

const { INPUT, BUTTON, FILE, ERROR_MESSAGES } = Constants;

/**
 * The screen for translating files by uploading, translating, and downloading the result.
 * @returns {JSX.Element} The file translation screen component.
 */
const FileTranslationScreen = () => {
  const { t } = useTranslation();
  const { session } = useSession();
  const { addTextTranslation } = useTranslationStore();
  const { isDarkMode } = useTheme();
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState(session?.preferences?.defaultToLang || '');
  const [translatedFileUri, setTranslatedFileUri] = useState(null);
  const [fileFormat, setFileFormat] = useState('');
  const router = useRouter();

  const safeTranslate = useCallback((key, fallback = '') => {
    try {
      const value = t(key);
      if (typeof value === 'string') return value;
      if (typeof value === 'object') return fallback;
      return String(value);
    } catch (err) {
      return fallback;
    }
  }, [t]);

  const pickDocument = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      if (!session) {
        Alert.alert(
          safeTranslate('error', 'Error'),
          `${safeTranslate('error', 'Error')}: ${ERROR_MESSAGES.FILE_NOT_LOGGED_IN}`,
          [
            { text: safeTranslate('cancel', 'Cancel'), style: 'cancel' },
            { text: safeTranslate('login', 'Log In'), onPress: () => router.push('/(auth)/login') },
          ]
        );
        setIsLoading(false);
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({ type: Constants.SUPPORTED_FILE_TYPES });
      if (!result.assets || result.assets.length === 0) {
        setError(`${safeTranslate('error', 'Error')}: ${ERROR_MESSAGES.FILE_NO_FILE_SELECTED}`);
        setToastVisible(true);
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];
      const validationError = Helpers.validateFile({ type: file.mimeType, size: file.size });
      if (validationError) {
        setError(`${safeTranslate('error', 'Error')}: ${validationError}`);
        setToastVisible(true);
        setIsLoading(false);
        return;
      }

      setFileName(file.name);
      const ext = file.name.split('.').pop().toLowerCase();

      const fileContent = await FileService.extractText(file.uri, session.signed_session_id);
      const translated = await TranslationService.translateFile(fileContent, targetLang, session.signed_session_id);

      await addTextTranslation({
        id: Date.now().toString(),
        fromLang: 'auto',
        toLang: targetLang,
        original_text: fileContent,
        translated_text: translated,
        created_at: new Date().toISOString(),
        type: 'file',
      }, false, session.signed_session_id);

      let path = '';
      let mimeType = 'text/plain';

      if (ext === 'docx') {
        const buffer = await FileService.generateDocx(translated, session.signed_session_id);
        path = `${FileSystem.documentDirectory}translated_${Date.now()}.docx`;
        await FileSystem.writeAsStringAsync(path, Buffer.from(buffer).toString('base64'), {
          encoding: FileSystem.EncodingType.Base64,
        });
        setFileFormat('docx');
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else {
        path = `${FileSystem.documentDirectory}translated_${Date.now()}.txt`;
        await FileSystem.writeAsStringAsync(path, translated, { encoding: FileSystem.EncodingType.UTF8 });
        setFileFormat('txt');
      }

      setTranslatedFileUri(path);
    } catch (err) {
      setError(`${safeTranslate('error', 'Error')}: ${Helpers.handleError(err)}`);
      setToastVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, [session, targetLang, addTextTranslation, router, safeTranslate]);

  const downloadTranslatedFile = useCallback(async () => {
    if (translatedFileUri) {
      try {
        const mime =
          fileFormat === 'docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'text/plain';

        await Sharing.shareAsync(translatedFileUri, {
          mimeType: mime,
          dialogTitle: safeTranslate('download', 'Download Translated File'),
        });
      } catch (err) {
        setError(`${safeTranslate('error', 'Error')}: ${ERROR_MESSAGES.FILE_DOWNLOAD_FAILED}`);
        setToastVisible(true);
      }
    } else {
      setError(`${safeTranslate('error', 'Error')}: ${ERROR_MESSAGES.FILE_NO_TRANSLATED_FILE}`);
      setToastVisible(true);
    }
  }, [translatedFileUri, fileFormat, safeTranslate]);

  const renderContent = useCallback(() => (
    <View style={styles.content}>
      <Text style={[styles.label, { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : INPUT.TEXT_COLOR_LIGHT }]}>
        {safeTranslate('targetLang', 'Target Language')}
      </Text>
      <LanguageSearch onSelectLanguage={setTargetLang} selectedLanguage={targetLang} />
      <Pressable
        onPress={pickDocument}
        disabled={isLoading || !targetLang}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: isDarkMode ? BUTTON.BACKGROUND_COLOR_DARK : Constants.COLORS.PRIMARY,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        accessibilityLabel="Pick document to translate"
        accessibilityRole="button"
      >
        <Text style={styles.buttonLabel}>
          {safeTranslate('pickDocument', 'Pick Document')}
        </Text>
      </Pressable>

      {error ? (
        <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>
          {error}
        </Text>
      ) : null}

      {isLoading && (
        <ActivityIndicator
          size="large"
          color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY}
          style={styles.loading}
          accessibilityLabel="Translating file"
        />
      )}

      {fileName ? (
        <View
          style={[
            styles.fileContainer,
            { backgroundColor: isDarkMode ? INPUT.BACKGROUND_COLOR_DARK : INPUT.BACKGROUND_COLOR_LIGHT },
          ]}
        >
          <Text
            style={[
              styles.fileLabel,
              { color: isDarkMode ? INPUT.TEXT_COLOR_DARK : INPUT.TEXT_COLOR_LIGHT },
            ]}
          >
            {safeTranslate('selectedFile', 'Selected File')}:
          </Text>
          <Text
            style={[
              styles.fileName,
              {
                color: isDarkMode ? INPUT.TEXT_COLOR_DARK : Constants.COLORS.SECONDARY_TEXT,
              },
            ]}
          >
            {fileName}
          </Text>
        </View>
      ) : null}

      {translatedFileUri && (
        <Pressable
          onPress={downloadTranslatedFile}
          style={({ pressed }) => [
            styles.downloadButton,
            {
              backgroundColor: isDarkMode ? BUTTON.BACKGROUND_COLOR_DARK : Constants.COLORS.SUCCESS,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityLabel="Download translated file"
          accessibilityRole="button"
        >
          <Text style={styles.downloadButtonLabel}>
            {safeTranslate('download', 'Download Translated File')}
          </Text>
        </Pressable>
      )}
    </View>
  ), [isDarkMode, targetLang, pickDocument, isLoading, fileName, translatedFileUri, downloadTranslatedFile, safeTranslate, error]);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? FILE.BACKGROUND_COLOR_DARK : Constants.COLORS.BACKGROUND }]}>
      <FlatList
        data={[1]}
        keyExtractor={(item) => item.toString()}
        renderItem={() => renderContent()}
        contentContainerStyle={styles.scrollContent}
      />
      <Toast
        message={typeof error === 'string' ? error : error?.message || 'Unknown error'}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Constants.SPACING.SECTION,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  error: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    marginTop: Constants.SPACING.MEDIUM,
    marginBottom: Constants.SPACING.SECTION,
    textAlign: 'center',
    color: Constants.COLORS.DESTRUCTIVE,
  },
  loading: {
    marginVertical: Constants.SPACING.SECTION,
  },
  fileContainer: {
    marginTop: Constants.SPACING.SECTION,
    padding: Constants.SPACING.LARGE,
    borderRadius: 12,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fileLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  fileName: {
    fontSize: Constants.FONT_SIZES.BODY,
    lineHeight: 24,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: Constants.SPACING.MEDIUM,
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
  downloadButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: Constants.SPACING.MEDIUM,
    alignItems: 'center',
  },
  downloadButtonLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
});

export default FileTranslationScreen;