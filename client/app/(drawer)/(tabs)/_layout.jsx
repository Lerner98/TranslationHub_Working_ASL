import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Tabs } from 'expo-router';
import { useTranslation } from '../../../utils/TranslationContext';
import useThemeStore from '../../../stores/ThemeStore';
import { FontAwesome } from '@expo/vector-icons';
import Constants from '../../../utils/Constants';
import { Pressable, Text, View, StyleSheet } from 'react-native';

const { TAB_BAR, SCENE_CONTAINER, HEADER, COLORS, FONT_SIZES, SPACING } = Constants;
/**
 * The layout component for the tab navigation group within the drawer.
 * @returns {JSX.Element} The tab navigation layout.
 */
export default function TabLayout() {
  const { t } = useTranslation();
  const themeStore = useThemeStore();
  const { isDarkMode = false } = themeStore;

  /**
   * A custom header component with a drawer toggle button.
   * @param {Object} props - The props passed by the Tabs navigator.
   * @param {Object} props.navigation - The navigation object.
   * @param {Object} props.options - The screen options, including title.
   * @returns {JSX.Element} The custom header.
   */
  const header = useCallback(({ navigation, options }) => {
    const toggleDrawer = () => {
      navigation.openDrawer();
    };

    return (
      <View style={[styles.headerContainer, { backgroundColor: isDarkMode ? HEADER.BACKGROUND_COLOR_DARK : HEADER.BACKGROUND_COLOR_LIGHT }]}>
        <Pressable
          onPress={toggleDrawer}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Open drawer"
          accessibilityRole="button"
        >
          <FontAwesome name="bars" size={24} color={isDarkMode ? HEADER.ICON_COLOR_DARK : HEADER.ICON_COLOR_LIGHT} />
        </Pressable>
        <Text style={[styles.headerText, { color: isDarkMode ? HEADER.TEXT_COLOR_DARK : HEADER.TEXT_COLOR_LIGHT }]}>
          {String(options?.title || '')}
        </Text>
        <View style={styles.placeholder} />
      </View>
    );
  }, [isDarkMode]);

  header.propTypes = {
    navigation: PropTypes.shape({
      openDrawer: PropTypes.func.isRequired,
    }).isRequired,
    options: PropTypes.shape({
      title: PropTypes.string,
    }).isRequired,
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isDarkMode ? TAB_BAR.BACKGROUND_COLOR_DARK : TAB_BAR.BACKGROUND_COLOR_LIGHT,
          borderTopColor: isDarkMode ? TAB_BAR.BORDER_COLOR_DARK : TAB_BAR.BORDER_COLOR_LIGHT,
          borderTopWidth: TAB_BAR.BORDER_WIDTH,
          height: TAB_BAR.HEIGHT,
          paddingBottom: TAB_BAR.PADDING_VERTICAL,
          paddingTop: TAB_BAR.PADDING_VERTICAL,
        },
        tabBarActiveTintColor: isDarkMode ? TAB_BAR.ACTIVE_TINT_COLOR_DARK : TAB_BAR.ACTIVE_TINT_COLOR_LIGHT,
        tabBarInactiveTintColor: isDarkMode ? TAB_BAR.INACTIVE_TINT_COLOR_DARK : TAB_BAR.INACTIVE_TINT_COLOR_LIGHT,
        tabBarLabelStyle: {
          fontSize: Constants.FONT_SIZES.SMALL,
          fontWeight: '600',
          marginBottom: Constants.SPACING.SMALL,
        },
        header: header,
        unmountOnBlur: false,
        lazy: false,
        tabBarAllowFontScaling: false,
      }}
      sceneContainerStyle={{
        backgroundColor: isDarkMode ? SCENE_CONTAINER.BACKGROUND_COLOR_DARK : SCENE_CONTAINER.BACKGROUND_COLOR_LIGHT,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: String(t('welcomeMessageHeader')),
          tabBarLabel: String(t('home')),
          tabBarAccessibilityLabel: "Go to Home tab",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="text-voice"
        options={{
          title: String(t('textVoiceTranslation')),
          tabBarLabel: String(t('textVoiceTranslation')),
          tabBarAccessibilityLabel: "Go to Text and Voice Translation tab",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="microphone" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="file"
        options={{
          title: String(t('fileTranslation')),
          tabBarLabel: String(t('fileTranslation')),
          tabBarAccessibilityLabel: "Go to File Translation tab",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="asl"
        options={{
          title: String(t('aslTranslation')),
          tabBarLabel: String(t('aslTranslation')),
          tabBarAccessibilityLabel: "Go to ASL Translation tab",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="hand-o-right" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: String(t('cameraTranslation')),
          tabBarLabel: String(t('cameraTranslation')),
          tabBarAccessibilityLabel: "Go to Camera Translation tab",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="camera" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Constants.SPACING.SECTION,
    borderBottomWidth: 1,
    borderBottomColor: Constants.COLORS.SECONDARY_TEXT,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  placeholder: {
    width: 24,
  },
});