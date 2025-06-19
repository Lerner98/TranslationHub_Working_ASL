import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useSession } from '../../utils/ctx';
import { useTheme } from '../../utils/ThemeContext'; // Updated to useTheme
import Constants from '../../utils/Constants';
import Toast from '../../components/Toast';

const { COLORS } = Constants;

/**
 * The layout component for the authentication navigation group.
 * @returns {JSX.Element} The authentication stack navigation layout.
 */
export default function AuthLayout() {
  const { session, isLoading, isAuthLoading, error: sessionError, signOut, clearError } = useSession();
  const { isDarkMode } = useTheme(); // Updated to useTheme
  const [toastVisible, setToastVisible] = useState(false);
  const router = useRouter();

  /**
   * Reset the app session by signing out and redirecting to the welcome screen.
   * @returns {Promise<void>} A promise that resolves when the session is reset.
   */
  const resetAppSession = async () => {
    await signOut();
    router.replace('/welcome');
  };

  useEffect(() => {
    if (sessionError) {
      setToastVisible(true);
    }
  }, [sessionError]);

  useEffect(() => {
    if (!isLoading && !isAuthLoading && session) {
      const hasValidToken = !!session?.signed_session_id;
      const isCorrupted = !hasValidToken;
  
      if (isCorrupted) {
        resetAppSession();
      }
    }
  }, [session, isLoading, isAuthLoading]);

  if (isLoading || isAuthLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#222' : (Constants.COLORS?.BACKGROUND || DEFAULT_CONSTANTS.COLORS.BACKGROUND) }]}
        accessibilityLabel="Loading authentication"
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
      >
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : (Constants.COLORS?.PRIMARY || DEFAULT_CONSTANTS.COLORS.PRIMARY)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
      {sessionError && (
        <Toast
          message={sessionError}
          visible={toastVisible}
          onHide={() => {
            setToastVisible(false);
            clearError(); // Clear sessionError to allow Stack to remain mounted
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});