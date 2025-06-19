import ApiService from '../services/ApiService';
import Constants from '../utils/Constants';

const { API_ENDPOINTS, ERROR_MESSAGES } = Constants;

const TranslationService = {
  /**
   * Translate text to a target language.
   * @param {string} text - The text to translate.
   * @param {string} targetLang - The target language code.
   * @param {string} [sourceLang='auto'] - The source language code (default: auto-detect).
   * @param {string} signedSessionId - The session ID for authentication.
   * @returns {Promise<Object>} The translation result with translatedText and detectedLang.
   * @throws {Error} If translation fails.
   */
  translateText: async (text, targetLang, sourceLang = 'auto', signedSessionId) => {
    const response = await ApiService.post(
      API_ENDPOINTS.TRANSLATE,
      { text, targetLang, sourceLang },
      signedSessionId
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || ERROR_MESSAGES.TRANSLATION_TEXT_FAILED);
  },

  /**
   * Detect the language of a given text.
   * @param {string} text - The text to analyze.
   * @param {string} signedSessionId - The session ID for authentication.
   * @returns {Promise<Object>} The detected language with detectedLang property.
   * @throws {Error} If detection fails.
   */
  detectLanguage: async (text, signedSessionId) => {
    const response = await ApiService.post(
      API_ENDPOINTS.TRANSLATE,
      { text, targetLang: 'en', sourceLang: 'auto' },
      signedSessionId
    );
    if (response.success && response.data?.detectedLang) {
      return { detectedLang: response.data.detectedLang };
    }
    throw new Error(response.error || ERROR_MESSAGES.TRANSLATION_DETECT_FAILED);
  },

  /**
   * Transliterate text between languages.
   * @param {string} text - The text to transliterate.
   * @param {string} sourceLang - The source language code.
   * @param {string} targetLang - The target language code.
   * @param {string} signedSessionId - The session ID for authentication.
   * @returns {Promise<string>} The transliterated text.
   * @throws {Error} If transliteration fails.
   */
  transliterateText: async (text, sourceLang, targetLang, signedSessionId) => {
    const response = await ApiService.post(
      API_ENDPOINTS.TRANSLITERATE,
      { text, sourceLang, targetLang },
      signedSessionId
    );
    if (response.success && response.translatedText) {
      return response.translatedText;
    }
    throw new Error(response.error || ERROR_MESSAGES.TRANSLITERATE_TEXT_FAILED);
  },

  /**
   * Translate the content of a file.
   * @param {string} fileContent - The content of the file to translate.
   * @param {string} targetLang - The target language code.
   * @param {string} signedSessionId - The session ID for authentication.
   * @returns {Promise<string>} The translated text.
   * @throws {Error} If translation fails.
   */
  translateFile: async (fileContent, targetLang, signedSessionId) => {
    const response = await ApiService.post(
      API_ENDPOINTS.TRANSLATE,
      { text: fileContent, targetLang, sourceLang: 'auto' },
      signedSessionId
    );
    if (response.success && response.data?.translatedText) {
      return response.data.translatedText;
    }
    throw new Error(response.error || ERROR_MESSAGES.TRANSLATION_FILE_FAILED);
  },

  /**
   * Convert audio to text (speech-to-text).
   * @param {string} audioUri - The URI of the audio file.
   * @param {string} sourceLang - The source language code.
   * @param {string} signedSessionId - The session ID for authentication.
   * @returns {Promise<string>} The transcribed text.
   * @throws {Error} If transcription fails.
   */
  speechToText: async (audioUri, sourceLang, signedSessionId) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    });
    formData.append('sourceLang', sourceLang);

    const response = await ApiService.uploadForm(API_ENDPOINTS.SPEECH_TO_TEXT, formData, signedSessionId);
    if (response.success && response.data) {
      return response.data.text || '';
    }
    throw new Error(response.error || ERROR_MESSAGES.SPEECH_TO_TEXT_FAILED);
  },

  /**
   * Convert text to audio (text-to-speech).
   * @param {string} text - The text to convert.
   * @param {string} language - The language code for the speech.
   * @param {string} signedSessionId - The session ID for authentication.
   * @returns {Promise<ArrayBuffer>} The audio data as an ArrayBuffer.
   * @throws {Error} If speech generation fails.
   */
  textToSpeech: async (text, language, signedSessionId) => {
    const response = await ApiService.post(
      API_ENDPOINTS.TEXT_TO_SPEECH,
      { text, language },
      signedSessionId,
      { responseType: 'arraybuffer' }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || ERROR_MESSAGES.TEXT_TO_SPEECH_FAILED);
  },

  /**
   * Recognize text from an image (OCR).
   * @param {string} imageBase64 - The Base64-encoded image.
   * @param {string} signedSessionId - The session ID for authentication.
   * @returns {Promise<Object>} The recognized text data.
   * @throws {Error} If recognition fails.
   */
  recognizeTextFromImage: async (imageBase64, signedSessionId) => {
    const response = await ApiService.post(
      API_ENDPOINTS.RECOGNIZE_TEXT,
      { imageBase64 },
      signedSessionId
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || ERROR_MESSAGES.RECOGNIZE_TEXT_FAILED);
  },

  /**
   * Recognize ASL gestures from an image.
   * @param {string} imageBase64 - The Base64-encoded image.
   * @param {string} signedSessionId - The session ID for authentication.
   * @returns {Promise<string>} The recognized ASL text.
   * @throws {Error} If recognition fails.
   */
  recognizeASL: async (imageBase64, signedSessionId) => {
    const response = await ApiService.post(
      API_ENDPOINTS.RECOGNIZE_ASL,
      { imageBase64 },
      signedSessionId
    );
    if (response.success && response.data?.text) {
      return response.data.text;
    }
    throw new Error(response.error || ERROR_MESSAGES.RECOGNIZE_ASL_FAILED);
  },

  /**
   * Search for supported languages.
   * @param {string} [query='*'] - The search query to filter languages.
   * @returns {Promise<Object[]>} The list of supported languages.
   * @throws {Error} If the search fails.
   */
  searchLanguages: async (query = '*') => {
    const url = `${API_ENDPOINTS.LANGUAGES}?query=${encodeURIComponent(query)}`;
    const response = await ApiService.get(url, null);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || ERROR_MESSAGES.SEARCH_LANGUAGES_FAILED);
  },
};

export default TranslationService;