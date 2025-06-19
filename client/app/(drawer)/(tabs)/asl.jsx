import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from '../../../utils/TranslationContext';
import { useSession } from '../../../utils/ctx';
import useTranslationStore from '../../../stores/TranslationStore';
import Toast from '../../../components/Toast';
import Constants from '../../../utils/Constants';
import useThemeStore from '../../../stores/ThemeStore';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

// Simple configuration
const RECONNECT_INTERVAL = 3000;
const SNAPSHOT_INTERVAL = 3000; // 3 seconds between snapshots

const getSafeMessage = (msg) => {
  if (typeof msg === 'string') return msg;
  if (msg instanceof Error && msg.message) return msg.message;
  if (React.isValidElement(msg)) return '[Invalid React Element]';
  try {
    return JSON.stringify(msg);
  } catch {
    return '[Unrenderable error object]';
  }
};

const { WEBSOCKET_URL, GUEST_TRANSLATION_LIMIT, COLORS, FONT_SIZES, SPACING } = Constants;

const ASLTranslationScreen = () => {
  const { t } = useTranslation();
  const { session } = useSession();
  const { addTextTranslation, incrementGuestTranslationCount, getGuestTranslationCount } = useTranslationStore();
  const { isDarkMode } = useThemeStore();
  const [translatedText, setTranslatedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const lastGestureRef = useRef(null);
  const gestureCountRef = useRef({});
  const snapshotIntervalRef = useRef(null);
  const cameraRef = useRef(null);
  const router = useRouter();

  // Camera permissions and device
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    try {
      wsRef.current = new WebSocket(WEBSOCKET_URL);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setWsConnected(true);
        setError('');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📥 Received from server:', data);
          
          if (data.error) {
            console.error('Server error:', data.error);
            setError(data.error);
            setToastVisible(true);
            return;
          }
          
          if (data.hand_detected && data.gesture && data.gesture !== 'None' && data.gesture !== 'Unknown') {
            const newGesture = data.gesture;
            const newConfidence = data.confidence;
            
            console.log('📥 Gesture detected:', newGesture, 'confidence:', newConfidence);
            
            // More lenient gesture stabilization
            if (newConfidence > 0.4) {
              gestureCountRef.current[newGesture] = (gestureCountRef.current[newGesture] || 0) + 1;
              
              if (gestureCountRef.current[newGesture] >= 2 && lastGestureRef.current !== newGesture) {
                setTranslatedText(newGesture);
                setConfidence(newConfidence);
                lastGestureRef.current = newGesture;
                
                // Reset counter for other gestures
                Object.keys(gestureCountRef.current).forEach(key => {
                  if (key !== newGesture) {
                    gestureCountRef.current[key] = 0;
                  }
                });
                
                saveTranslation(newGesture);
              }
            }
          }
          
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setWsConnected(false);
        
        if (isStreaming) {
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            initializeWebSocket();
          }, RECONNECT_INTERVAL);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
        setError('WebSocket connection failed. Check server connection.');
        setToastVisible(true);
      };
      
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      setError('Failed to initialize connection');
      setToastVisible(true);
    }
  }, [isStreaming]);

  // Save translation to store
  const saveTranslation = useCallback(async (gestureText) => {
    try {
      await addTextTranslation({
        id: Date.now().toString(),
        fromLang: 'asl',
        toLang: 'en',
        original_text: 'ASL Gesture',
        translated_text: gestureText,
        created_at: new Date().toISOString(),
        type: 'asl',
      }, !session, session?.signed_session_id);

      if (!session) await incrementGuestTranslationCount('asl');
    } catch (err) {
      console.error('Error saving translation:', err);
    }
  }, [addTextTranslation, incrementGuestTranslationCount, session]);

  // Simple snapshot capture using expo-file-system
  const captureSnapshot = useCallback(async () => {
    if (!cameraRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      console.log('📸 Taking snapshot...');
      
      // Take snapshot
      const snapshot = await cameraRef.current.takeSnapshot({
        quality: 50,
        skipMetadata: true,
      });

      console.log('📸 Snapshot taken:', snapshot.path);

      // Fix file path for expo-file-system (add file:// scheme if missing)
      const filePath = snapshot.path.startsWith('file://') ? snapshot.path : `file://${snapshot.path}`;
      
      // Read file as base64 using expo-file-system
      const base64 = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('📦 Base64 converted, length:', base64.length);

      const frameData = {
        frame: `data:image/jpeg;base64,${base64}`,
        timestamp: Date.now()
      };
      
      console.log('📤 Sending to server...');
      wsRef.current.send(JSON.stringify(frameData));
      
    } catch (err) {
      console.error('Error capturing snapshot:', err);
    }
  }, []);

  // Start streaming
  const startStreaming = useCallback(async () => {
    setError('');
    
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        setError(t('error') + ': Camera permission not granted.');
        setToastVisible(true);
        return;
      }
    }

    if (!session) {
      const aslCount = await getGuestTranslationCount('asl');
      if (aslCount >= GUEST_TRANSLATION_LIMIT) {
        setError(t('guestLimit'));
        setToastVisible(true);
        return;
      }
    }

    console.log('🚀 Starting ASL streaming...');
    setIsStreaming(true);
    setTranslatedText('');
    setConfidence(0);
    gestureCountRef.current = {};
    lastGestureRef.current = null;
    
    // Initialize WebSocket
    if (!wsConnected) {
      initializeWebSocket();
    }
    
    // Start periodic snapshots
    snapshotIntervalRef.current = setInterval(captureSnapshot, SNAPSHOT_INTERVAL);
    
  }, [hasPermission, requestPermission, session, getGuestTranslationCount, wsConnected, initializeWebSocket, captureSnapshot, t]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    console.log('🛑 Stopping ASL streaming...');
    setIsStreaming(false);
    
    // Clear snapshot interval
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setWsConnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  const handleDeleteTranslation = () => {
    setTranslatedText('');
    setConfidence(0);
  };

  // Permission loading state
  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={isDarkMode ? '#fff' : Constants.COLORS.PRIMARY} />
          <Text style={[styles.loadingText, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
            {t('loading')} Camera Permissions...
          </Text>
        </View>
      </View>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
        <View style={styles.content}>
          <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>
            {t('error')}: Camera permission denied
          </Text>
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: isDarkMode ? '#555' : Constants.COLORS.PRIMARY, opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityLabel="Request camera permission"
          >
            <Text style={styles.retryButtonLabel}>Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Device unavailable state
  if (device == null) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
        <View style={styles.content}>
          <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>
            {t('error')}: Front camera not available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#222' : Constants.COLORS.BACKGROUND }]}>
      <View style={styles.content}>
        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={isStreaming}
            photo={true}
            video={false}
            enableHighQualityPhotos={false}
            enablePortraitEffectsMatteDelivery={false}
            enableDepthData={false}
          />
          
          {/* Connection Status Indicator */}
          <View style={[styles.statusIndicator, { backgroundColor: wsConnected ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.statusText}>
              {wsConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </Text>
          </View>

          {/* Streaming Indicator */}
          {isStreaming && (
            <View style={[styles.streamingIndicator, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.statusText}>🎥 Processing</Text>
            </View>
          )}
        </View>

        {/* Control Button */}
        <Pressable
          onPress={isStreaming ? stopStreaming : startStreaming}
          style={({ pressed }) => [
            isStreaming ? styles.stopButton : styles.startButton,
            { 
              backgroundColor: isStreaming ? Constants.COLORS.DESTRUCTIVE : (isDarkMode ? '#555' : Constants.COLORS.PRIMARY), 
              opacity: pressed ? 0.7 : 1 
            },
          ]}
          accessibilityLabel={isStreaming ? 'Stop ASL recognition' : 'Start ASL recognition'}
        >
          <Text style={isStreaming ? styles.stopButtonLabel : styles.startButtonLabel}>
            {isStreaming ? t('stopCamera') : t('startCamera')}
          </Text>
        </Pressable>

        {/* Error Display */}
        {error ? <Text style={[styles.error, { color: Constants.COLORS.DESTRUCTIVE }]}>{error}</Text> : null}

        {/* Translation Results */}
        {translatedText ? (
          <View style={[styles.resultContainer, { backgroundColor: isDarkMode ? '#333' : Constants.COLORS.CARD }]}>
            <Text style={[styles.resultLabel, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>
              {t('translated')}
            </Text>
            <Text style={[styles.translated, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
              {translatedText}
            </Text>
            <Text style={[styles.confidence, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT }]}>
              Confidence: {(confidence * 100).toFixed(1)}%
            </Text>
            <Pressable
              onPress={handleDeleteTranslation}
              style={({ pressed }) => [
                styles.deleteButton,
                { backgroundColor: Constants.COLORS.DESTRUCTIVE, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityLabel="Delete translation"
            >
              <Text style={styles.deleteButtonLabel}>{t('deleteTranslation')}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      
      <Toast
        message={getSafeMessage(error)}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Constants.SPACING.SECTION,
  },
  cameraContainer: {
    position: 'relative',
    width: '100%',
    height: 350,
    marginBottom: Constants.SPACING.SECTION,
  },
  camera: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  statusIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streamingIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  error: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    marginTop: Constants.SPACING.MEDIUM,
    marginBottom: Constants.SPACING.SECTION,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: Constants.SPACING.MEDIUM,
    fontSize: Constants.FONT_SIZES.BODY,
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: Constants.SPACING.SECTION,
    padding: Constants.SPACING.SECTION,
    borderRadius: 12,
    shadowColor: Constants.COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  resultLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    marginBottom: Constants.SPACING.MEDIUM,
    letterSpacing: 0.5,
  },
  translated: {
    fontSize: Constants.FONT_SIZES.SUBTITLE,
    marginBottom: Constants.SPACING.MEDIUM,
    lineHeight: 24,
    fontWeight: 'bold',
  },
  confidence: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    marginBottom: Constants.SPACING.LARGE,
    fontStyle: 'italic',
  },
  startButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: Constants.SPACING.MEDIUM,
  },
  startButtonLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
  stopButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: Constants.SPACING.MEDIUM,
  },
  stopButtonLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButtonLabel: {
    fontSize: Constants.FONT_SIZES.SECONDARY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: Constants.SPACING.MEDIUM,
  },
  retryButtonLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
    fontWeight: 'bold',
    color: Constants.COLORS.CARD,
  },
});

export default ASLTranslationScreen;