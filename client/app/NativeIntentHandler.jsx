import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorageUtils from '../utils/AsyncStorage';
import { useSession } from '../utils/ctx';
import Constants from '../utils/Constants';

const { ROUTES } = Constants;

/**
 * A handler for deep links and URL intents, navigating to appropriate screens.
 * @returns {null} This component does not render UI.
 */
export default function NativeIntentHandler() {
  const router = useRouter();
  const { clearSession } = useSession(); // this must exist in your ctx

  useEffect(() => {
    /**
     * Reset the user session by clearing AsyncStorage and context.
     * @returns {Promise<void>} A promise that resolves when the session is cleared.
     */
    const resetSession = async () => {
      await AsyncStorageUtils.removeItem('signed_session_id');
      await AsyncStorageUtils.removeItem('user');
      clearSession?.(); // optional safety
    };

    /**
     * Navigate to a specific screen based on the deep link path and query parameters.
     * @param {string} path - The path extracted from the deep link.
     * @param {Object} queryParams - The query parameters from the deep link.
     * @returns {Promise<void>} A promise that resolves when navigation is complete.
     */
    const deepLinkToTab = async (path, queryParams) => {
      if (path === 'login' || path === 'register') {
        await resetSession(); // force guest mode
      }

      switch (path) {
        case 'login':
          router.push(ROUTES.LOGIN);
          break;
        case 'register':
          router.push(ROUTES.REGISTER);
          break;
        case 'translate':
          if (queryParams?.text) {
            router.push({
              pathname: ROUTES.TEXT_VOICE,
              params: { text: queryParams.text },
            });
          } else {
            router.push(ROUTES.TEXT_VOICE);
          }
          break;
        default:
          router.push(ROUTES.MAIN);
          break;
      }
    };

    /**
     * Handle an incoming deep link URL and navigate accordingly.
     * @param {Object} event - The deep link event object.
     * @param {string} event.url - The URL to handle.
     * @returns {void}
     */
    const handleUrl = ({ url }) => {
      try {
        const { path, queryParams } = Linking.parse(url);
        if (path) {
          deepLinkToTab(path, queryParams);
        }
      } catch (err) {
        router.push(ROUTES.MAIN);
      }
    };

    Linking.getInitialURL()
      .then((url) => {
        if (url) handleUrl({ url });
      })
      .catch((err) => {
        // Log removed
      });

    const subscription = Linking.addEventListener('url', handleUrl);

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, [router]);

  return null;
}