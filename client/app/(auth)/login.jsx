import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from '../../utils/TranslationContext';
import { useSession } from '../../utils/ctx';
import Toast from '../../components/Toast';
import { useRouter } from 'expo-router';
import Constants from '../../utils/Constants';
import { useTheme } from '../../utils/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorageUtils from '../../utils/AsyncStorage';

const { FORM, SCREEN, ICON, ERROR_MESSAGES, COLORS } = Constants;

/**
 * The login screen for user authentication.
 * @returns {JSX.Element} The login screen component.
 */
const LoginScreen = () => {
  const { t } = useTranslation();
  const { signIn, isAuthLoading, error: sessionError, clearError } = useSession();
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (sessionError && isMounted) {
      setError(sessionError);
      setToastVisible(true);
    }
  }, [sessionError]);

  const handleLogin = useCallback(async () => {
    setError('');

    if (!email || !password) {
      if (isMounted) {
        setError(t('error') + ': ' + ERROR_MESSAGES.LOGIN_EMAIL_PASSWORD_REQUIRED);
        setToastVisible(true);
      }
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) { // Reverted to older version's regex validation
      if (isMounted) {
        setError(t('error') + ': ' + ERROR_MESSAGES.LOGIN_INVALID_EMAIL);
        setToastVisible(true);
      }
      return;
    }
    if (password.length < 6) {
      if (isMounted) {
        setError(t('error') + ': ' + ERROR_MESSAGES.LOGIN_PASSWORD_MIN_LENGTH);
        setToastVisible(true);
      }
      return;
    }

    try {
      await signIn(email, password);
      if (isMounted) {
        router.replace('/(drawer)/(tabs)');
      }
    } catch (err) {
      if (isMounted) {
        setError(t('error') + ': ' + err.message);
        setToastVisible(true);
      }
    }
  }, [email, password, t, signIn, router, isMounted]);

  const goBack = useCallback(() => {
    if (isMounted) {
      router.replace('/welcome');
    }
  }, [router, isMounted]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { backgroundColor: isDarkMode ? SCREEN.BACKGROUND_COLOR_DARK : SCREEN.BACKGROUND_COLOR_LIGHT }]}>
        <View style={styles.headerContainer}>
          <Pressable
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <FontAwesome name="arrow-left" size={24} color={isDarkMode ? ICON.COLOR_DARK : ICON.COLOR_LIGHT} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.formContainer, { backgroundColor: isDarkMode ? FORM.BACKGROUND_COLOR_DARK : FORM.BACKGROUND_COLOR_LIGHT }]}>
            <Text style={[styles.title, { color: isDarkMode ? FORM.TITLE_COLOR_DARK : FORM.TITLE_COLOR_LIGHT }]}>{t('login')}</Text>

            {isAuthLoading && (
              <ActivityIndicator
                size="large"
                color={isDarkMode ? '#FFF' : Constants.COLORS.PRIMARY}
                style={styles.loading}
                accessibilityLabel="Logging in"
              />
            )}

            <Text style={[styles.label, { color: isDarkMode ? FORM.LABEL_COLOR_DARK : FORM.LABEL_COLOR_LIGHT }]}>{t('email')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? FORM.INPUT_BACKGROUND_COLOR_DARK : FORM.INPUT_BACKGROUND_COLOR_LIGHT,
                  color: isDarkMode ? FORM.INPUT_TEXT_COLOR_DARK : FORM.INPUT_TEXT_COLOR_LIGHT,
                  borderColor: FORM.INPUT_BORDER_COLOR,
                  borderWidth: FORM.INPUT_BORDER_WIDTH,
                  borderRadius: FORM.INPUT_BORDER_RADIUS,
                },
              ]}
              placeholder={t('email')}
              placeholderTextColor={isDarkMode ? FORM.INPUT_PLACEHOLDER_COLOR_DARK : FORM.INPUT_PLACEHOLDER_COLOR_LIGHT}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isAuthLoading}
              accessibilityLabel="Email input"
            />

            <Text style={[styles.label, { color: isDarkMode ? FORM.LABEL_COLOR_DARK : FORM.LABEL_COLOR_LIGHT }]}>{t('password')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDarkMode ? FORM.INPUT_BACKGROUND_COLOR_DARK : FORM.INPUT_BACKGROUND_COLOR_LIGHT,
                    color: isDarkMode ? FORM.INPUT_TEXT_COLOR_DARK : FORM.INPUT_TEXT_COLOR_LIGHT,
                    borderColor: FORM.INPUT_BORDER_COLOR,
                    borderWidth: FORM.INPUT_BORDER_WIDTH,
                    borderRadius: FORM.INPUT_BORDER_RADIUS,
                  },
                ]}
                placeholder={t('password')}
                placeholderTextColor={isDarkMode ? FORM.INPUT_PLACEHOLDER_COLOR_DARK : FORM.INPUT_PLACEHOLDER_COLOR_LIGHT}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry={!showPassword}
                editable={!isAuthLoading}
                accessibilityLabel="Password input"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.toggleButton}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                accessibilityRole="button"
              >
                <FontAwesome
                  name={showPassword ? "eye-slash" : "eye"}
                  size={20}
                  color={isDarkMode ? ICON.COLOR_DARK : ICON.COLOR_LIGHT}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={isAuthLoading}
              style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}
              accessibilityLabel="Login button"
              accessibilityRole="button"
            >
              <Text style={styles.buttonLabel}>{t('login')}</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/register')}
              disabled={isAuthLoading}
              style={({ pressed }) => [styles.switchButton, { opacity: pressed ? 0.8 : 1, backgroundColor: FORM.BUTTON_BACKGROUND_COLOR }]}
              accessibilityLabel="Go to register screen"
              accessibilityRole="button"
            >
              <Text style={styles.switchText}>{t('register')}</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                const token = await AsyncStorageUtils.getItem('signed_session_id');
                if (!token) {
                  Alert.alert(
                    'Not Logged In',
                    'You are not logged in. Please log in or use "Continue as Guest" from the welcome screen.',
                    [{ text: 'OK' }]
                  );
                } else {
                  router.push('/(drawer)/(tabs)');
                }
              }}
              disabled={isAuthLoading}
              style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.8 : 1 }]}
              accessibilityLabel="Go to home screen"
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>{t('goToHome')}</Text>
            </Pressable>
          </View>
        </ScrollView>

        {(error || sessionError) && typeof (error || sessionError) === 'string' && (
          <Toast
            message={(error || sessionError)?.toString?.() || ''}
            visible={toastVisible}
            onHide={() => {
              setToastVisible(false);
              clearError(); // Clear sessionError when toast is dismissed
              setError(''); // Clear local error
            }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formContainer: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 16,
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  loading: {
    marginBottom: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: Constants.COLORS.PRIMARY,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  switchButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  switchText: {
    fontSize: 16,
    fontWeight: '500',
    color: Constants.COLORS.PRIMARY,
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: Constants.COLORS.DESTRUCTIVE,
    alignItems: 'center',
    marginVertical: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
});

export default LoginScreen;