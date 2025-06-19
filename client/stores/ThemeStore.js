import { create } from 'zustand';
import AsyncStorageUtils from '../utils/AsyncStorage';
import Helpers from '../utils/Helpers';

const useThemeStore = create((set) => ({
  isDarkMode: false,
  isLoading: false,
  error: null,

  initializeTheme: async () => {
    try {
      set({ isLoading: true, error: null });
      const savedTheme = await AsyncStorageUtils.getItem('theme');
      if (savedTheme !== null) {
        set({ isDarkMode: savedTheme === 'dark' });
      } else {
        set({ isDarkMode: false }); // Default to light mode
      }
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = Helpers.handleError(error);
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to initialize theme:', errorMessage);
    }
  },

  toggleTheme: async () => {
    try {
      set((state) => {
        const newTheme = !state.isDarkMode;
        AsyncStorageUtils.setItem('theme', newTheme ? 'dark' : 'light');
        return { isDarkMode: newTheme, error: null };
      });
    } catch (error) {
      const errorMessage = Helpers.handleError(error);
      set({ error: errorMessage });
      console.error('Failed to toggle theme:', errorMessage);
    }
  },
}));

export default useThemeStore;