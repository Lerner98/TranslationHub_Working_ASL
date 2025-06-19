import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from './Constants';

const { ERROR_MESSAGES } = Constants;

const isSerializable = (value) => {
  if (value === null || value === undefined) return true;
  const type = typeof value;
  return (
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    (Array.isArray(value) && value.every(isSerializable)) ||
    (type === 'object' && Object.values(value).every(isSerializable))
  );
};

const AsyncStorageUtils = {
  /**
   * Get an item from AsyncStorage and optionally parse it as JSON.
   * @param {string} key - The key to retrieve.
   * @param {boolean} [parse=true] - Whether to parse the value as JSON.
   * @returns {Promise<any>} The stored value, parsed if possible.
   * @throws {Error} If retrieval fails.
   */
  getItem: async (key, parse = true) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;

      if (!parse) return value;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      throw new Error(ERROR_MESSAGES.ASYNC_STORAGE_GET_ITEM(key, error.message));
    }
  },

  /**
   * Set an item in AsyncStorage with safe serialization.
   * @param {string} key - The key to set.
   * @param {any} value - The value to store (must be serializable).
   * @returns {Promise<void>} A promise that resolves when the value is stored.
   * @throws {Error} If the value is not serializable or storage fails.
   */
  setItem: async (key, value) => {
    try {
      if (!isSerializable(value)) {
        throw new Error(ERROR_MESSAGES.ASYNC_STORAGE_NOT_SERIALIZABLE(key));
      }

      const serialized = JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
    } catch (error) {
      throw new Error(ERROR_MESSAGES.ASYNC_STORAGE_SET_ITEM(key, error.message));
    }
  },

  /**
   * Remove an item from AsyncStorage.
   * @param {string} key - The key to remove.
   * @returns {Promise<void>} A promise that resolves when the item is removed.
   * @throws {Error} If removal fails.
   */
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      throw new Error(ERROR_MESSAGES.ASYNC_STORAGE_REMOVE_ITEM(key, error.message));
    }
  },

  /**
   * Clear all data from AsyncStorage.
   * @returns {Promise<void>} A promise that resolves when all data is cleared.
   * @throws {Error} If clearing fails.
   */
  clear: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      throw new Error(ERROR_MESSAGES.ASYNC_STORAGE_CLEAR(error.message));
    }
  },

  /**
   * Get all keys stored in AsyncStorage.
   * @returns {Promise<string[]>} A promise that resolves to an array of keys.
   * @throws {Error} If retrieval fails.
   */
  getAllKeys: async () => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      throw new Error(ERROR_MESSAGES.ASYNC_STORAGE_GET_ALL_KEYS(error.message));
    }
  },
};

export default AsyncStorageUtils;