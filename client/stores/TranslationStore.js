import { create } from 'zustand';
import { debounce } from 'lodash';
import AsyncStorageUtils from '../utils/AsyncStorage';
import ApiService from '../services/ApiService';
import Constants from '../utils/Constants';
import Helpers from '../utils/Helpers';

const { STORAGE_KEYS, API_ENDPOINTS } = Constants;

const saveGuestTranslations = debounce(async (translations) => {
  await AsyncStorageUtils.setItem(STORAGE_KEYS.GUEST_TRANSLATIONS, translations);
}, 300);

const useTranslationStore = create((set, get) => ({
  recentTextTranslations: [],
  recentVoiceTranslations: [],
  savedTextTranslations: [],
  savedVoiceTranslations: [],
  guestTranslations: [],
  isLoading: false,
  error: null,

  /**
   * Fetch translations for a logged-in user.
   * @param {Object} user - The user object with signed_session_id.
   * @returns {Promise<void>} A promise that resolves when translations are fetched.
   * @throws {Error} If fetching fails.
   */
  fetchTranslations: async (user) => {
    try {
      set({ isLoading: true, error: null });

      const [textRes, voiceRes] = await Promise.all([
        ApiService.get(API_ENDPOINTS.TRANSLATIONS_TEXT, user.signed_session_id),
        ApiService.get(API_ENDPOINTS.TRANSLATIONS_VOICE, user.signed_session_id),
      ]);

      if (!textRes.success || !voiceRes.success) {
        throw new Error(textRes.error || voiceRes.error);
      }

      set({
        savedTextTranslations: textRes.data,
        savedVoiceTranslations: voiceRes.data,
        recentTextTranslations: textRes.data.slice(-5),
        recentVoiceTranslations: voiceRes.data.slice(-5),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const msg = Helpers.handleError(err);
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  /**
   * Clear all translations for a logged-in user.
   * @param {Object} user - The user object with signed_session_id.
   * @returns {Promise<void>} A promise that resolves when translations are cleared.
   * @throws {Error} If clearing fails.
   */
  clearTranslations: async (user) => {
    try {
      set({ isLoading: true, error: null });
      const response = await ApiService.delete('/translations', user.signed_session_id);
      if (!response.success) throw new Error(response.error);

      set({
        savedTextTranslations: [],
        savedVoiceTranslations: [],
        recentTextTranslations: [],
        recentVoiceTranslations: [],
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const msg = Helpers.handleError(err);
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  /**
   * Clear all guest translations.
   * @returns {Promise<void>} A promise that resolves when guest translations are cleared.
   * @throws {Error} If clearing fails.
   */
  clearGuestTranslations: async () => {
    try {
      set({ isLoading: true, error: null });
      await AsyncStorageUtils.removeItem(STORAGE_KEYS.GUEST_TRANSLATIONS);
      set({ guestTranslations: [], isLoading: false, error: null });
    } catch (err) {
      const msg = Helpers.handleError(err);
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  /**
   * Add a text translation for a logged-in user or guest.
   * @param {Object} translation - The translation object to add.
   * @param {boolean} isGuest - Whether the user is a guest.
   * @param {string} sessionId - The session ID for logged-in users.
   * @returns {Promise<void>} A promise that resolves when the translation is added.
   * @throws {Error} If adding fails.
   */
  addTextTranslation: async (translation, isGuest, sessionId) => {
    if (isGuest) {
      const updated = [...get().guestTranslations, { ...translation, type: 'text' }];
      set({ guestTranslations: updated });
      await saveGuestTranslations(updated);
    } else {
      try {
        set({ isLoading: true, error: null });
        const res = await ApiService.post(API_ENDPOINTS.TRANSLATIONS_TEXT, translation, sessionId);
        if (!res.success) throw new Error(res.error);

        const fetch = await ApiService.get(API_ENDPOINTS.TRANSLATIONS_TEXT, sessionId);
        if (!fetch.success) throw new Error(fetch.error);

        set({
          recentTextTranslations: fetch.data.slice(-5),
          savedTextTranslations: fetch.data,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const msg = Helpers.handleError(err);
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    }
  },

  /**
   * Add a voice translation for a logged-in user or guest.
   * @param {Object} translation - The translation object to add.
   * @param {boolean} isGuest - Whether the user is a guest.
   * @param {string} sessionId - The session ID for logged-in users.
   * @returns {Promise<void>} A promise that resolves when the translation is added.
   * @throws {Error} If adding fails.
   */
  addVoiceTranslation: async (translation, isGuest, sessionId) => {
    if (isGuest) {
      const updated = [...get().guestTranslations, { ...translation, type: 'voice' }];
      set({ guestTranslations: updated });
      await saveGuestTranslations(updated);
    } else {
      try {
        set({ isLoading: true, error: null });
        const res = await ApiService.post(API_ENDPOINTS.TRANSLATIONS_VOICE, translation, sessionId);
        if (!res.success) throw new Error(res.error);

        const fetch = await ApiService.get(API_ENDPOINTS.TRANSLATIONS_VOICE, sessionId);
        if (!fetch.success) throw new Error(fetch.error);

        set({
          recentVoiceTranslations: fetch.data.slice(-5),
          savedVoiceTranslations: fetch.data,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const msg = Helpers.handleError(err);
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    }
  },

  /**
   * Increment the guest translation count for a specific type.
   * @param {string} type - The type of translation ('text' or 'voice').
   * @returns {Promise<void>} A promise that resolves when the count is incremented.
   */
  incrementGuestTranslationCount: async (type) => {
    try {
      const key = type === 'text' ? STORAGE_KEYS.GUEST_TEXT_COUNT : STORAGE_KEYS.GUEST_VOICE_COUNT;
      const current = parseInt(await AsyncStorageUtils.getItem(key) || '0', 10);
      await AsyncStorageUtils.setItem(key, (current + 1).toString());
    } catch (err) {
      const msg = `Failed to increment ${type} count: ${err.message}`;
      set({ error: msg });
    }
  },

  /**
   * Get the guest translation count, either total or by type.
   * @param {string} type - The type of count ('total', 'text', or 'voice').
   * @returns {Promise<number>} The number of translations.
   */
  getGuestTranslationCount: async (type) => {
    if (type === 'total') {
      try {
        const guest = await AsyncStorageUtils.getItem(STORAGE_KEYS.GUEST_TRANSLATIONS);
        return guest?.length || 0;
      } catch {
        return 0;
      }
    }

    try {
      const key = type === 'text' ? STORAGE_KEYS.GUEST_TEXT_COUNT : STORAGE_KEYS.GUEST_VOICE_COUNT;
      const count = await AsyncStorageUtils.getItem(key);
      return parseInt(count || '0', 10);
    } catch {
      return 0;
    }
  },

  /**
   * Remove a single translation for a logged-in user or guest.
   * @param {string} translationId - The ID of the translation to remove.
   * @param {string} type - The type of translation ('text' or 'voice').
   * @param {boolean} isGuest - Whether the user is a guest.
   * @param {string} [sessionId] - The session ID for logged-in users.
   * @returns {Promise<void>} A promise that resolves when the translation is removed.
   * @throws {Error} If removal fails.
   */
  removeTranslation: async (translationId, type, isGuest, sessionId) => {
    try {
      set({ isLoading: true, error: null });

      if (isGuest) {
        const updated = get().guestTranslations.filter(
          (t) => t.id !== translationId && t.type === type
        );
        set({ guestTranslations: updated });
        await saveGuestTranslations(updated);
      } else {
        const endpoint = type === 'text' ? API_ENDPOINTS.TRANSLATIONS_TEXT : API_ENDPOINTS.TRANSLATIONS_VOICE;
        const res = await ApiService.delete(`${endpoint}/${translationId}`, sessionId);
        if (!res.success) throw new Error(res.error);

        const fetch = await ApiService.get(endpoint, sessionId);
        if (!fetch.success) throw new Error(fetch.error);

        if (type === 'text') {
          set({
            recentTextTranslations: fetch.data.slice(-5),
            savedTextTranslations: fetch.data,
            isLoading: false,
            error: null,
          });
        } else {
          set({
            recentVoiceTranslations: fetch.data.slice(-5),
            savedVoiceTranslations: fetch.data,
            isLoading: false,
            error: null,
          });
        }
      }
    } catch (err) {
      const msg = Helpers.handleError(err);
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },
}));

export default useTranslationStore;