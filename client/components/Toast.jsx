import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import PropTypes from 'prop-types';
import Constants from '../utils/Constants';

const { ERROR_MESSAGES } = Constants;

const Toast = ({ message, visible, onHide, isDarkMode = false }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  const safeMessage = useMemo(() => {
    try {
      if (!message) return '';
      if (typeof message === 'string') return message;
      if (message instanceof Error && message.message) return message.message;
      if (React.isValidElement(message)) return ERROR_MESSAGES.TOAST_INVALID_MESSAGE_REACT;
      if (Array.isArray(message)) return ERROR_MESSAGES.TOAST_INVALID_MESSAGE_ARRAY;
      return JSON.stringify(message);
    } catch {
      return ERROR_MESSAGES.TOAST_UNRENDERABLE_MESSAGE;
    }
  }, [message]);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onHide();
        });
      }, Constants.TOAST_DURATION);

      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, onHide]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.messageContainer}>
        <Text style={[styles.messageText, { color: isDarkMode ? '#FFF' : Constants.COLORS.CARD }]}>
          {typeof safeMessage === 'string' ? safeMessage : String(safeMessage)}
        </Text>
      </View>
    </Animated.View>
  );
};

Toast.propTypes = {
  message: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Error),
    PropTypes.any,
  ]).isRequired,
  visible: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  messageContainer: {
    backgroundColor: Constants.COLORS.DESTRUCTIVE,
    padding: Constants.SPACING.MEDIUM,
    borderRadius: 10,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  messageText: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Toast;
