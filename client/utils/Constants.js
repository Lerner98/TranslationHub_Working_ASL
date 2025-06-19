const Constants = {
  // 🔌 WebSocket URL for ASL Translation
  WEBSOCKET_URL: 'ws://192.168.1.26:8000/asl-ws',
  // 🌐 API Base URL
  API_URL: 'http://192.168.1.26:3000', // Hardcoded to the working URL

  // ⚙️ API Configuration
  API_TIMEOUT: 10000, // API request timeout in milliseconds (10 seconds)
  TOAST_DURATION: 3000, // Toast visibility duration in milliseconds (3 seconds)

  // 📁 Upload Settings
  MAX_FILE_SIZE: 25 * 1024 * 1024, // Maximum file size for uploads in bytes (25 MB)
  SUPPORTED_FILE_TYPES: [
    'text/plain', // Plain text files
    'application/pdf', // PDF documents
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Microsoft Word documents (.docx)
  ], // MIME types allowed for file uploads

  // 👤 Guest Access Limits
  GUEST_TRANSLATION_LIMIT: 10, // Maximum number of translations allowed for guest users

  // 🎨 Color Palette
  COLORS: {
    PRIMARY: '#007AFF', // Primary action color (e.g., buttons, links)
    DESTRUCTIVE: '#FF3B30', // Destructive action color (e.g., delete buttons)
    SUCCESS: '#28a745', // Success indicator color (e.g., success messages)
    WARNING: '#FFC107', // Warning indicator color (e.g., alerts)
    ACCENT: '#FF9500', // Accent color for highlights (e.g., active states)
    DISABLED: '#B0B0B0', // Disabled state color (e.g., buttons)
    BACKGROUND: '#f5f5f5', // Default background color for screens
    CARD: '#fff', // Background color for cards and modals
    TEXT: '#333', // Primary text color
    SECONDARY_TEXT: '#666', // Secondary text color (e.g., subtitles, captions)
    SHADOW: '#000', // Shadow color for elevation effects
  },

  // 🔠 Typography
  FONT_SIZES: {
    TITLE: 28, // Font size for titles (in pixels)
    SUBTITLE: 20, // Font size for subtitles (in pixels)
    BODY: 16, // Font size for body text (in pixels)
    SECONDARY: 14, // Font size for secondary text (in pixels)
    SMALL: 12, // Font size for small text (in pixels)
  },

  // 📏 Spacing
  SPACING: {
    SMALL: 5, // Small spacing for tight layouts (in pixels)
    MEDIUM: 10, // Medium spacing for standard layouts (in pixels)
    LARGE: 15, // Large spacing for prominent layouts (in pixels)
    SECTION: 20, // Section spacing for major layout sections (in pixels)
  },

  // 📱 Icon Sizes
  ICON_SIZES: {
    SMALL: 16, // Small icons (e.g., inline)
    MEDIUM: 24, // Medium icons (e.g., buttons)
    LARGE: 32, // Large icons (e.g., headers)
  },

  // 📱 Status Bar
  STATUS_BAR_HEIGHT: 20, // Default status bar height for padding

  // 📜 Dropdown Configuration
  DROPDOWN: {
    MAX_HEIGHT: 200, // Maximum height for dropdown lists
    BORDER_WIDTH: 1, // Border width for dropdown items
    BORDER_COLOR: '#eee', // Border color for dropdown items
  },

  // 📜 Drawer Configuration
  DRAWER: {
    WIDTH_MULTIPLIER: 0.8, // Multiplier for drawer width based on screen width
    BORDER_WIDTH: 1, // Drawer border width
    BORDER_COLOR_LIGHT: '#ccc', // Drawer border color in light mode
    BORDER_COLOR_DARK: '#555', // Drawer border color in dark mode
  },

  // 📜 Tab Bar Configuration
  TAB_BAR: {
    HEIGHT: 60, // Tab bar height
    BORDER_WIDTH: 1, // Tab bar border width
    PADDING_VERTICAL: 5, // Tab bar vertical padding
    BACKGROUND_COLOR_LIGHT: '#FFFFFF', // Tab bar background color in light mode
    BACKGROUND_COLOR_DARK: '#1E1E1E', // Tab bar background color in dark mode
    BORDER_COLOR_LIGHT: '#E0E0E0', // Tab bar border color in light mode
    BORDER_COLOR_DARK: '#333333', // Tab bar border color in dark mode
    ACTIVE_TINT_COLOR_LIGHT: '#1976D2', // Active tab tint color in light mode
    ACTIVE_TINT_COLOR_DARK: '#1E88E5', // Active tab tint color in dark mode
    INACTIVE_TINT_COLOR_LIGHT: '#757575', // Inactive tab tint color in light mode
    INACTIVE_TINT_COLOR_DARK: '#B0B0B0', // Inactive tab tint color in dark mode
  },

  // 📜 Scene Container Configuration
  SCENE_CONTAINER: {
    BACKGROUND_COLOR_LIGHT: '#F5F5F5', // Scene container background color in light mode
    BACKGROUND_COLOR_DARK: '#121212', // Scene container background color in dark mode
  },

  // 📜 Header Configuration
  HEADER: {
    BACKGROUND_COLOR_LIGHT: '#F5F5F5', // Header background color in light mode
    BACKGROUND_COLOR_DARK: '#121212', // Header background color in dark mode
    TEXT_COLOR_LIGHT: '#212121', // Header text color in light mode
    TEXT_COLOR_DARK: '#E0E0E0', // Header text color in dark mode
    ICON_COLOR_LIGHT: '#212121', // Header icon color in light mode
    ICON_COLOR_DARK: '#E0E0E0', // Header icon color in dark mode
  },

  // 📜 Screen Configuration
  SCREEN: {
    BACKGROUND_COLOR_LIGHT: '#F0F2F5', // Screen background color in light mode
    BACKGROUND_COLOR_DARK: '#222', // Screen background color in dark mode
  },

  // 📜 Form Configuration
  FORM: {
    BACKGROUND_COLOR_LIGHT: '#FFF', // Form background color in light mode
    BACKGROUND_COLOR_DARK: '#2C2C2E', // Form background color in dark mode
    INPUT_BACKGROUND_COLOR_LIGHT: '#F5F5F5', // Input background color in light mode
    INPUT_BACKGROUND_COLOR_DARK: '#3A3A3C', // Input background color in dark mode
    INPUT_BORDER_COLOR: '#ccc', // Input border color
    INPUT_BORDER_WIDTH: 1, // Input border width
    INPUT_BORDER_RADIUS: 8, // Input border radius
    INPUT_TEXT_COLOR_LIGHT: '#333', // Input text color in light mode
    INPUT_TEXT_COLOR_DARK: '#FFF', // Input text color in dark mode
    INPUT_PLACEHOLDER_COLOR_LIGHT: '#999', // Input placeholder color in light mode
    INPUT_PLACEHOLDER_COLOR_DARK: '#888', // Input placeholder color in dark mode
    TITLE_COLOR_LIGHT: '#333', // Title color in light mode
    TITLE_COLOR_DARK: '#FFF', // Title color in dark mode
    LABEL_COLOR_LIGHT: '#555', // Label color in light mode
    LABEL_COLOR_DARK: '#AAA', // Label color in dark mode
    BUTTON_BACKGROUND_COLOR: 'rgba(0,0,0,0.05)', // Secondary button background color
  },

  // 📜 Input Configuration
  INPUT: {
    BACKGROUND_COLOR_LIGHT: '#fff',
    BACKGROUND_COLOR_DARK: '#333',
    TEXT_COLOR_LIGHT: '#333',
    TEXT_COLOR_DARK: '#fff',
    PLACEHOLDER_COLOR_LIGHT: '#999',
    PLACEHOLDER_COLOR_DARK: '#888',
    MICROPHONE_COLOR_DARK: '#aaa',
  },

  // 📜 Button Configuration
  BUTTON: {
    BACKGROUND_COLOR_DARK: '#555', // Button background color in dark mode
  },

  // 📜 Profile Configuration
  PROFILE: {
    BACKGROUND_COLOR_LIGHT: '#F5F5F5', // Profile background color in light mode
    BACKGROUND_COLOR_DARK: '#121212', // Profile background color in dark mode
    SECTION_BACKGROUND_COLOR_LIGHT: '#FFFFFF', // Section background color in light mode
    SECTION_BACKGROUND_COLOR_DARK: '#1E1E1E', // Section background color in dark mode
    TEXT_COLOR_LIGHT: '#212121', // Text color in light mode
    TEXT_COLOR_DARK: '#E0E0E0', // Text color in dark mode
    SECONDARY_TEXT_COLOR_LIGHT: '#424242', // Secondary text color in light mode
    SECONDARY_TEXT_COLOR_DARK: '#B0B0B0', // Secondary text color in dark mode
    BORDER_COLOR: '#B0B0B0', // Border color for language buttons
    SELECTED_BUTTON_COLOR: '#E3F2FD', // Selected language button background color
    SELECTED_BUTTON_BORDER_COLOR: '#1976D2', // Selected language button border color
    SELECTED_TEXT_COLOR: '#1976D2', // Selected language text color
    SAVE_BUTTON_COLOR_LIGHT: '#1976D2', // Save button color in light mode
    SAVE_BUTTON_COLOR_DARK: '#1E88E5', // Save button color in dark mode
  },

  // 📜 File Translation Configuration
  FILE: {
    BACKGROUND_COLOR_DARK: '#222', // File screen background color in dark mode
  },

  // 📜 Home Configuration
  HOME: {
    BACKGROUND_COLOR_LIGHT: '#F5F5F5', // Home background color in light mode
    BACKGROUND_COLOR_DARK: '#121212', // Home background color in dark mode
    HERO_BACKGROUND_COLOR: 'rgba(30,136,229,0.1)', // Hero section background color
    WELCOME_TEXT_COLOR_LIGHT: '#212121', // Welcome text color in light mode
    WELCOME_TEXT_COLOR_DARK: '#FFF', // Welcome text color in dark mode
    DESCRIPTION_TEXT_COLOR_LIGHT: '#424242', // Description text color in light mode
    DESCRIPTION_TEXT_COLOR_DARK: '#CCC', // Description text color in dark mode
    BUTTON_COLOR_LIGHT: '#1976D2', // Button color in light mode
    BUTTON_COLOR_DARK: '#1E88E5', // Button color in dark mode
  },

  // 📜 Welcome Configuration
  WELCOME: {
    BACKGROUND_COLOR_LIGHT: '#F5F5F5', // Welcome background color in light mode
    BACKGROUND_COLOR_DARK: '#121212', // Welcome background color in dark mode
    TITLE_COLOR_LIGHT: '#212121', // Title color in light mode
    TITLE_COLOR_DARK: '#E0E0E0', // Title color in dark mode
    GUEST_BUTTON_COLOR_LIGHT: '#1976D2', // Guest button color in light mode
    GUEST_BUTTON_COLOR_DARK: '#1E88E5', // Guest button color in dark mode
    REGISTER_BUTTON_COLOR_LIGHT: '#2E7D32', // Register button color in light mode
    REGISTER_BUTTON_COLOR_DARK: '#388E3C', // Register button color in dark mode
    LOGIN_BUTTON_COLOR_LIGHT: '#F9A825', // Login button color in light mode
    LOGIN_BUTTON_COLOR_DARK: '#FBC02D', // Login button color in dark mode
  },

  // 📜 Camera Translation Configuration
  CAMERA: {
    BACKGROUND_COLOR_DARK: '#222', // Camera screen background color in dark mode
    PLACEHOLDER_COLOR_LIGHT: '#d3d3d3', // Placeholder background color in light mode
    PLACEHOLDER_COLOR_DARK: '#444', // Placeholder background color in dark mode
    BUTTON_COLOR: '#007AFF', // Camera control button color (direct value to avoid circular reference)
    SAVE_BUTTON_COLOR_LIGHT: '#4CAF50', // Save button color in light mode
    SAVE_BUTTON_COLOR_DARK: '#4CAF50', // Save button color in dark mode
    DELETE_BUTTON_COLOR_LIGHT: '#F44336', // Delete button color in light mode
    DELETE_BUTTON_COLOR_DARK: '#F44336', // Delete button color in dark mode
  },

  // 📜 Saves Configuration
  SAVES: {
    BACKGROUND_COLOR_DARK: '#222', // Saves screen background color in dark mode
  },

  // 📜 Icon Configuration
  ICON: {
    COLOR_LIGHT: '#333', // Icon color in light mode
    COLOR_DARK: '#E0E0E0', // Icon color in dark mode
  },

  // 🧭 Navigation Routes
  ROUTES: {
    LOGIN: 'login', // Login route
    REGISTER: 'register', // Register route
    WELCOME: '/welcome', // Welcome route
    MAIN: '/(drawer)/(tabs)', // Main app route
    TEXT_VOICE: '/(drawer)/(tabs)/text-voice', // Text/voice translation route
  },

  // 🗄️ Storage Keys
  STORAGE_KEYS: {
    THEME: 'theme', // Key for storing theme preference in AsyncStorage
    GUEST_TRANSLATIONS: 'guestTranslations', // Key for storing guest translations
    GUEST_TEXT_COUNT: 'guest_text_count', // Key for text translation count
    GUEST_VOICE_COUNT: 'guest_voice_count', // Key for voice translation count
  },

  // 🌐 API Endpoints
  API_ENDPOINTS: {
    TRANSLATIONS_TEXT: '/translations/text', // Endpoint for text translations
    TRANSLATIONS_VOICE: '/translations/voice', // Endpoint for voice translations
    TRANSLATE: '/translate', // Endpoint for text translation and detection
    TRANSLITERATE: '/transliterate', // Endpoint for transliteration
    SPEECH_TO_TEXT: '/speech-to-text', // Endpoint for speech-to-text
    TEXT_TO_SPEECH: '/text-to-speech', // Endpoint for text-to-speech
    RECOGNIZE_TEXT: '/recognize-text', // Endpoint for image-to-text recognition
    RECOGNIZE_ASL: '/recognize-asl', // Endpoint for ASL recognition
    LANGUAGES: '/languages', // Endpoint for language search
    EXTRACT_TEXT: '/extract-text', // Endpoint for text extraction from files
    GENERATE_DOCX: '/generate-docx', // Endpoint for generating Word documents
  },

  // 🎨 Theme Modes
  THEME_MODES: {
    LIGHT: 'light', // Light mode value
    DARK: 'dark', // Dark mode value
  },

  // 🗣️ Default Preferences
  DEFAULT_PREFERENCES: {
    DEFAULT_FROM_LANG: 'en', // Default source language
    DEFAULT_TO_LANG: 'he', // Default target language
  },

  // 🔒 Session Configuration
  SESSION: {
    VALIDATION_INTERVAL: 15000, // Session validation interval in milliseconds (15 seconds)
  },

  // 📝 Fallback Text
  FALLBACK_TEXT: {
    LOADING: 'Loading...',
  },

  // ⚠️ Error Messages
  ERROR_MESSAGES: {
    ASYNC_STORAGE_GET_ITEM: (key, message) => `AsyncStorage.getItem('${key}') failed: ${message}`,
    ASYNC_STORAGE_SET_ITEM: (key, message) => `AsyncStorage.setItem('${key}') failed: ${message}`,
    ASYNC_STORAGE_REMOVE_ITEM: (key, message) => `AsyncStorage.removeItem('${key}') failed: ${message}`,
    ASYNC_STORAGE_CLEAR: (message) => `AsyncStorage.clear() failed: ${message}`,
    ASYNC_STORAGE_NOT_SERIALIZABLE: (key) => `Value for key '${key}' is not serializable.`,
    ASYNC_STORAGE_GET_ALL_KEYS: (message) => `AsyncStorage.getAllKeys() failed: ${message}`,
    THEME_INITIALIZE_FAILED: (message) => `Failed to initialize theme: ${message}`,
    THEME_TOGGLE_FAILED: (message) => `Failed to toggle theme: ${message}`,
    LANGUAGE_FETCH_FAILED: (message) => `Failed to fetch languages: ${message}`,
    TRANSLATION_TEXT_FAILED: 'Failed to translate text',
    TRANSLATION_DETECT_FAILED: 'Failed to detect language',
    TRANSLITERATE_TEXT_FAILED: 'Failed to transliterate text',
    TRANSLATION_FILE_FAILED: 'Failed to translate file',
    SPEECH_TO_TEXT_FAILED: 'Failed to transcribe speech',
    TEXT_TO_SPEECH_FAILED: 'Failed to generate speech',
    RECOGNIZE_TEXT_FAILED: 'Failed to recognize text from image',
    RECOGNIZE_ASL_FAILED: 'Failed to recognize ASL gesture',
    SEARCH_LANGUAGES_FAILED: 'Failed to search languages',
    EXTRACT_TEXT_FAILED: 'Failed to extract text from file',
    FILE_EXTRACTION_FAILED: 'File extraction failed',
    GENERATE_DOCX_FAILED: 'Failed to generate Word document',
    DOCUMENT_GENERATION_FAILED: 'Document generation failed',
    API_REQUEST_FAILED: 'Request failed',
    API_NETWORK_ERROR: 'Network error: No response received',
    API_REQUEST_SETUP_ERROR: 'Request setup error',
    TOAST_INVALID_MESSAGE_REACT: '[Invalid React element passed as message]',
    TOAST_INVALID_MESSAGE_ARRAY: '[Array passed as message]',
    TOAST_UNRENDERABLE_MESSAGE: '[Unrenderable message]',
    ERROR_BOUNDARY_UNKNOWN_ERROR: 'Unknown error',
    ERROR_BOUNDARY_NO_STACK: 'No stack trace',
    NOT_FOUND_ERROR: (errText, notFoundText) => `${errText}: 404 - ${notFoundText}`,
    LOGIN_EMAIL_PASSWORD_REQUIRED: 'Email and password are required',
    LOGIN_INVALID_EMAIL: 'Please enter a valid email address',
    LOGIN_PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters long',
    REGISTRATION_SUCCESS: 'Registration successful! Please log in.',
    TRANSLATION_TEXT_REQUIRED: 'Please enter text to translate',
    TRANSLATION_LANGUAGES_REQUIRED: 'Please select source and target languages',
    TRANSLATION_RECORDING_TOO_SHORT: 'Recording too short. Please record at least 1 second.',
    TRANSLATION_INVALID_AUDIO_PATH: 'Invalid audio path. Please try again.',
    TRANSLATION_NO_TEXT_TO_HEAR: 'No translated text to hear',
    TRANSLATION_NO_TEXT_TO_SAVE: 'No translation to save',
    TRANSLATION_PERMISSION_NOT_GRANTED: 'Audio permission not granted. Please enable it in your device settings.',
    TRANSLATION_PERMISSION_FAILED: (message) => `Failed to request audio permission: ${message}`,
    TRANSLATION_RECORDING_FAILED: (message) => `Failed to start recording: ${message}`,
    TRANSLATION_RECORDING_FAILED_EMULATOR: 'Recording failed. Please ensure no other apps are using the microphone and try again. If using an emulator, test on a physical device.',
    TRANSLATION_RECORDING_CONFLICT: 'Recording conflict detected. Please try again.',
    PROFILE_LANGUAGE_CHANGE_NOT_LOGGED_IN: 'Cannot change language: Please log in',
    PROFILE_PREFERENCES_SAVED: 'Preferences saved successfully',
    PROFILE_TRANSLATIONS_CLEARED: 'Translations cleared successfully',
    FILE_NO_FILE_SELECTED: 'No file selected',
    FILE_NOT_LOGGED_IN: 'You must be logged in to translate files. Would you like to log in now?',
    FILE_DOWNLOAD_FAILED: 'Failed to download file',
    FILE_NO_TRANSLATED_FILE: 'No translated file available',
    CAMERA_PERMISSION_NOT_GRANTED: 'Camera permission not granted. Please enable it in your device settings.',
    CAMERA_GALLERY_PERMISSION_NOT_GRANTED: 'Gallery permission not granted. Please enable it in your device settings.',
    CAMERA_LANGUAGES_REQUIRED: 'Source and target languages are required',
    CAMERA_NOT_AVAILABLE: 'Camera not available. Please try again.',
    CAMERA_CAPTURE_FAILED: 'Failed to capture photo. Please try again.',
    CAMERA_GALLERY_FAILED: 'Failed to select photo from gallery. Please try again.',
    CAMERA_NO_TEXT_DETECTED: 'No text detected in the image.',
    CAMERA_PROCESS_FAILED: 'Failed to process the image. Please try again.',
    CAMERA_NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    CAMERA_SAVE_FAILED: 'Failed to save translation. Please try again.',
    SAVES_DELETE_SERVER_FAILED: 'Failed to delete from server. Removed locally.',
  },
};

export default Constants;