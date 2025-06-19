import * as FileSystem from 'expo-file-system';
import ApiService from './ApiService';
import Constants from '../utils/Constants';

const { API_ENDPOINTS, ERROR_MESSAGES } = Constants;

const FileService = {
  /**
   * Extract text from a file (PDF/DOCX) by sending it as Base64.
   * @param {string} uri - The URI of the file to extract text from.
   * @param {string|null} signedSessionId - The session ID for authentication (optional).
   * @returns {Promise<string>} The extracted text.
   * @throws {Error} If extraction fails.
   */
  extractText: async (uri, signedSessionId = null) => {
    try {
      const base64Content = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await ApiService.post(
        API_ENDPOINTS.EXTRACT_TEXT,
        { uri: base64Content },
        signedSessionId
      );

      if (response.success && response.data?.text) {
        return response.data.text;
      }
      throw new Error(response.error || ERROR_MESSAGES.EXTRACT_TEXT_FAILED);
    } catch (err) {
      throw new Error(err.message || ERROR_MESSAGES.FILE_EXTRACTION_FAILED);
    }
  },

  /**
   * Generate a downloadable Word document (DOCX) from text.
   * @param {string} text - The text to convert into a Word document.
   * @param {string} signedSessionId - The session ID for authentication.
   * @returns {Promise<ArrayBuffer>} The generated Word document as an ArrayBuffer.
   * @throws {Error} If generation fails.
   */
  generateDocx: async (text, signedSessionId) => {
    try {
      const response = await ApiService.post(
        API_ENDPOINTS.GENERATE_DOCX,
        { text },
        signedSessionId,
        { responseType: 'arraybuffer' }
      );

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || ERROR_MESSAGES.GENERATE_DOCX_FAILED);
    } catch (err) {
      throw new Error(err.message || ERROR_MESSAGES.DOCUMENT_GENERATION_FAILED);
    }
  },
};

export default FileService;