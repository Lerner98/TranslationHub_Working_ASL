import axios from 'axios';
import Constants from '../utils/Constants'; //  Import your custom config file
import AsyncStorageUtils from '../utils/AsyncStorage';

const API_URL = Constants.API_URL; //  Use your hardcoded IP 

console.log('[ApiService] API_URL:', API_URL);

class ApiService {
  static instance;
  axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      timeout: Constants.API_TIMEOUT,
    });

    // Interceptor for handling unauthorized errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          await AsyncStorageUtils.removeItem('user');
          await AsyncStorageUtils.removeItem('signed_session_id');
          await AsyncStorageUtils.removeItem('preferences');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the singleton instance of ApiService.
   * @returns {ApiService} The singleton instance.
   */
  static getInstance() {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Make a GET request to the API.
   * @param {string} url - The API endpoint URL.
   * @param {string|null} token - The Bearer token for authentication (optional).
   * @param {Object} [config={}] - Additional axios configuration (optional).
   * @param {Object} [config.headers] - Custom headers for the request.
   * @returns {Promise<Object>} The API response with { success, data } or { success, error }.
   */
  async get(url, token = null, config = {}) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await this.axiosInstance.get(url, {
        ...config,
        headers,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Make a POST request to the API.
   * @param {string} url - The API endpoint URL.
   * @param {Object|FormData} data - The request payload (JSON or FormData).
   * @param {string|null} token - The Bearer token for authentication (optional).
   * @param {Object} [config={}] - Additional axios configuration (optional).
   * @param {Object} [config.headers] - Custom headers for the request.
   * @returns {Promise<Object>} The API response with { success, data } or { success, error }.
   */
  async post(url, data, token = null, config = {}) {
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;

      const headers = {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(isFormData
          ? {} // Let axios set Content-Type for FormData
          : { 'Content-Type': 'application/json' }),
        ...config.headers,
      };

      const response = await this.axiosInstance.post(url, data, {
        ...config,
        headers,
      });

      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Make a DELETE request to the API.
   * @param {string} url - The API endpoint URL.
   * @param {string|null} token - The Bearer token for authentication (optional).
   * @param {Object} [config={}] - Additional axios configuration (optional).
   * @param {Object} [config.headers] - Custom headers for the request.
   * @returns {Promise<Object>} The API response with { success, data } or { success, error }.
   */
  async delete(url, token = null, config = {}) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await this.axiosInstance.delete(url, {
        ...config,
        headers,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle API request errors and format them consistently.
   * @param {Object} error - The error object from axios.
   * @returns {Object} The formatted error with { success: false, error }.
   */
  handleError(error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error || Constants.ERROR_MESSAGES.API_REQUEST_FAILED,
      };
    } else if (error.request) {
      return {
        success: false,
        error: Constants.ERROR_MESSAGES.API_NETWORK_ERROR,
      };
    } else {
      return {
        success: false,
        error: error.message || Constants.ERROR_MESSAGES.API_REQUEST_SETUP_ERROR,
      };
    }
  }
}

export default ApiService.getInstance();