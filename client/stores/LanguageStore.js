import { create } from 'zustand';
import TranslationService from '../services/TranslationService';
import Helpers from '../utils/Helpers';
import Constants from '../utils/Constants';

const { ERROR_MESSAGES } = Constants;

const useLanguageStore = create((set, get) => ({
  languages: [],
  isLoading: false,
  error: null,

  /**
   * Fetch all languages from the translation service.
   * @returns {Promise<void>} A promise that resolves when languages are fetched.
   */
  fetchLanguages: async () => {
    if (get().languages.length > 0) {
      return;
    }
    await get().filterLanguages('');
  },

  /**
   * Filter languages based on a query.
   * @param {string} query - The search query to filter languages.
   * @returns {Promise<void>} A promise that resolves when languages are filtered.
   */
  filterLanguages: async (query) => {
    try {
      set({ isLoading: true, error: null });
      const languages = await TranslationService.searchLanguages(query);
      set({ languages, isLoading: false, error: null });
    } catch (error) {
      const errorMessage = Helpers.handleError(error);
      set({ error: ERROR_MESSAGES.LANGUAGE_FETCH_FAILED(errorMessage), isLoading: false });
    }
  },
}));

export default useLanguageStore;