import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';
import { TranslationProvider, useTranslation } from '../utils/TranslationContext';
import { SessionProvider, useSession } from '../utils/ctx';
import { ThemeProvider, useTheme } from '../utils/ThemeContext';
import Toast from '../components/Toast';
import ErrorBoundaryWrapper from '../components/ErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, StyleSheet } from 'react-native';
import Constants from '../utils/Constants';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

const RootLayoutInner = () => {
  const { isDarkMode = false } = useTheme();
  const { session, isLoading: sessionLoading, error: sessionError, clearError } = useSession();
  const { error: translationError } = useTranslation();
  const [appIsReady, setAppIsReady] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Theme initialization is handled by ThemeProvider
      } catch (err) {
        // Log removed
      } finally {
        setAppIsReady(true);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (appIsReady && !sessionLoading) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, sessionLoading]);

  useEffect(() => {
    if (sessionError || translationError) {
      setToastVisible(true);
    }
  }, [sessionError, translationError]);

  // ✅ REMOVED: Redundant session validation - SessionProvider already handles this
  // No need for duplicate validation in RootLayout

  const theme = isDarkMode ? DarkTheme : DefaultTheme;

  if (!appIsReady || sessionLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <StatusBar
          translucent
          backgroundColor={isDarkMode ? '#000' : Constants.COLORS.BACKGROUND}
          style={isDarkMode ? 'light' : 'dark'}
        />
        <ErrorBoundaryWrapper>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(drawer)" />
          </Stack>
          {(sessionError || translationError) && (
            <Toast
              message={String(sessionError || translationError || 'Unknown error')}
              visible={toastVisible}
              onHide={() => {
                setToastVisible(false);
                clearError();
              }}
              isDarkMode={isDarkMode}
            />
          )}
        </ErrorBoundaryWrapper>
      </SafeAreaView>
    </PaperProvider>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SessionProvider>
            <TranslationProvider>
              <RootLayoutInner />
            </TranslationProvider>
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});