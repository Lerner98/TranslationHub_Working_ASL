import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import PropTypes from 'prop-types';
import { useTranslation } from '../utils/TranslationContext';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/ThemeContext';
import Toast from './Toast';
import Constants from '../utils/Constants';

const { ERROR_MESSAGES } = Constants;

/**
 * A wrapper component for ErrorBoundary to provide context and hooks.
 * @param {React.ReactNode} children - The child components to wrap.
 * @returns {JSX.Element} The wrapped ErrorBoundary component.
 */

const ErrorBoundaryWrapper = ({ children }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  return (
    <ErrorBoundary key="error-boundary" t={t} router={router} isDarkMode={isDarkMode}>
      {children}
    </ErrorBoundary>
  );
};

ErrorBoundaryWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * An error boundary component to catch and handle runtime errors.
 * @param {Function} t - Translation function from TranslationContext.
 * @param {Object} router - Router object from expo-router.
 * @param {boolean} isDarkMode - Whether dark mode is active.
 * @param {React.ReactNode} children - The child components to wrap.
 * @returns {JSX.Element} The child components or a fallback UI on error.
 */
class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null,
    fadeAnim: new Animated.Value(0),
    toastVisible: false,
  };

  static propTypes = {
    t: PropTypes.func.isRequired,
    router: PropTypes.shape({
      replace: PropTypes.func.isRequired,
    }).isRequired,
    isDarkMode: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ toastVisible: true });
    this.sendErrorReport(error, errorInfo);
  }

  async sendErrorReport(error, errorInfo) {
    try {
      await fetch('http://localhost:3001/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error?.message || ERROR_MESSAGES.ERROR_BOUNDARY_UNKNOWN_ERROR,
          stack: errorInfo?.componentStack || ERROR_MESSAGES.ERROR_BOUNDARY_NO_STACK,
          time: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Log removed
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.hasError && !prevState.hasError) {
      Animated.timing(this.state.fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, toastVisible: false });
    try {
      this.props.router.replace('/(drawer)/(tabs)');
    } catch (e) {
      // Log removed
    }
  };

  render() {
    const { t, isDarkMode } = this.props;
    const { hasError, error, toastVisible, fadeAnim } = this.state;

    if (hasError) {
      const fallbackErrorText = typeof t('error') === 'string' ? t('error') : 'Error';
      const fallbackMessage = typeof t('somethingWentWrong') === 'string' ? t('somethingWentWrong') : 'Something went wrong.';
      const fallbackGoHome = typeof t('goToHome') === 'string' ? t('goToHome') : 'Go to Home';

      const errorMessage = error?.message || fallbackMessage;

      return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={[styles.title, { color: Constants.COLORS.DESTRUCTIVE }]}>{fallbackErrorText}</Text>
            <Text style={[styles.message, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>
              {fallbackMessage}
            </Text>
            <Text style={[styles.description, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: isDarkMode ? '#555' : Constants.COLORS.PRIMARY }]}
              onPress={this.handleRetry}
              accessibilityLabel="Retry from error"
            >
              <Text style={styles.buttonText}>{fallbackGoHome}</Text>
            </TouchableOpacity>
          </Animated.View>

          <Toast
            message={errorMessage}
            visible={toastVisible}
            onHide={() => this.setState({ toastVisible: false })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Constants.SPACING.SECTION,
  },
  title: {
    fontSize: Constants.FONT_SIZES.TITLE,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: Constants.FONT_SIZES.SUBTITLE,
    fontWeight: '600',
    marginBottom: Constants.SPACING.MEDIUM,
    textAlign: 'center',
  },
  description: {
    fontSize: Constants.FONT_SIZES.BODY,
    textAlign: 'center',
    marginBottom: Constants.SPACING.SECTION,
    lineHeight: 24,
  },
  button: {
    paddingVertical: Constants.SPACING.MEDIUM,
    paddingHorizontal: Constants.SPACING.SECTION,
    borderRadius: 10,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
});

export default ErrorBoundaryWrapper;