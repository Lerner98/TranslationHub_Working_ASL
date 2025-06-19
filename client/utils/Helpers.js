import Constants from './Constants';
import * as FileSystem from 'expo-file-system';

const DEFAULT_CONSTANTS = {
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25 MB
  SUPPORTED_FILE_TYPES: [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

const Helpers = {
  /**
   * Format a date to a readable string based on the locale.
   * @param {string} dateString - The date string to format (e.g., ISO 8601 format).
   * @param {string} locale - The locale to use for formatting (e.g., 'en-US', 'he').
   * @param {Object} [options] - Optional formatting options for toLocaleString.
   * @param {string} [options.year='numeric'] - Year format.
   * @param {string} [options.month='short'] - Month format.
   * @param {string} [options.day='numeric'] - Day format.
   * @param {string} [options.hour='2-digit'] - Hour format.
   * @param {string} [options.minute='2-digit'] - Minute format.
   * @returns {string} The formatted date string (e.g., 'Jan 1, 2024, 14:30').
   */
  formatDate: (dateString, locale, options = {}) => {
    const date = new Date(dateString);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleString(locale, { ...defaultOptions, ...options });
  },

  /**
   * Handle API errors and return a user-friendly message.
   * @param {Object} error - The error object from an API request (e.g., from axios).
   * @param {Object} [error.response] - The server response, if available.
   * @param {Object} [error.request] - The request object, if the error is network-related.
   * @param {string} [error.message] - The error message, if available.
   * @returns {string} A user-friendly error message.
   */
  handleError: (error) => {
    if (error?.response) {
      return error.response.data?.error || 'An error occurred while processing your request.';
    }
    if (error?.request) {
      return 'Network error: Please check your internet connection and try again.';
    }
    return error?.message || 'An unexpected error occurred.';
  },

  /**
   * Convert a file to a Base64 string.
   * @param {string} uri - The URI of the file to convert.
   * @returns {Promise<string>} A promise that resolves to the Base64 string.
   * @throws {Error} If the file cannot be read or converted to Base64.
   */
  fileToBase64: async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const maxFileSize = Constants.MAX_FILE_SIZE || DEFAULT_CONSTANTS.MAX_FILE_SIZE;
      if (fileInfo.size > maxFileSize) {
        throw new Error(`File size exceeds the limit of ${maxFileSize / (1024 * 1024)} MB.`);
      }
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      throw new Error('Failed to convert file to Base64: ' + (error?.message || 'Unknown error'));
    }
  },

  /**
   * Validate a file's type and size.
   * @param {Object} file - The file object to validate.
   * @param {string} file.type - The MIME type of the file.
   * @param {number} file.size - The size of the file in bytes.
   * @returns {string|null} An error message if validation fails, or null if the file is valid.
   */
  validateFile: (file) => {
    const supportedFileTypes = Constants.SUPPORTED_FILE_TYPES || DEFAULT_CONSTANTS.SUPPORTED_FILE_TYPES;
    if (!supportedFileTypes.includes(file.type)) {
      return 'Unsupported file type. Please upload a .txt, .docx, or .pdf file.';
    }
    const maxFileSize = Constants.MAX_FILE_SIZE || DEFAULT_CONSTANTS.MAX_FILE_SIZE;
    if (file.size > maxFileSize) {
      return `File size exceeds the limit of ${maxFileSize / (1024 * 1024)} MB.`;
    }
    return null;
  },
};

export default Helpers;