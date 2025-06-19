import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslation } from '../../utils/TranslationContext';
import { useSession } from '../../utils/ctx';
import { useTheme } from '../../utils/ThemeContext';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Constants from '../../utils/Constants';

/**
 * A custom drawer content component displaying user info and navigation items.
 * @param {Object} props - The props passed by the Drawer navigator.
 * @param {Object} props.navigation - The navigation object from the Drawer.
 * @returns {JSX.Element} The custom drawer content.
 */
const CustomDrawerContent = React.memo((props) => {
  const { t } = useTranslation();
  const { session, signOut } = useSession();
  const { isDarkMode } = useTheme();
  const { navigation } = props;
  const pathname = usePathname();
  const router = useRouter();

  const isTabsActive = pathname.startsWith('/(tabs)') || pathname === '/';
  const isSavesActive = pathname === '/saves';
  const isProfileActive = pathname === '/profile';

  const getIconColor = (isActive) => (isActive ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT);
  const getLabelColor = (isActive) => (isActive ? Constants.COLORS.CARD : Constants.COLORS.SECONDARY_TEXT);
  const getBackgroundColor = (isActive) => {
    return isActive ? Constants.COLORS.PRIMARY : isDarkMode ? '#333' : Constants.COLORS.CARD;
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={styles.userInfoWrapper}
        accessibilityLabel={`User: ${session ? session.email.split('@')[0] : 'Guest'}`}
      >
        <View style={styles.userImagePlaceholder}>
          <Text style={styles.userImagePlaceholderText}>
            {session ? session.email.charAt(0).toUpperCase() : 'G'}
          </Text>
        </View>
        <View style={styles.userDetailsWrapper}>
          <Text style={[styles.username, { color: isDarkMode ? Constants.COLORS.CARD : Constants.COLORS.TEXT }]}>
            {session ? session.email.split('@')[0] : 'Guest'}
          </Text>
        </View>
      </View>
      <DrawerItem
        label={t('home', { defaultValue: 'Home' })}
        icon={({ size }) => (
          <FontAwesome name="home" size={size} color={getIconColor(isTabsActive)} />
        )}
        labelStyle={{
          ...styles.navItemLabel,
          color: getLabelColor(isTabsActive),
          marginLeft: Constants.SPACING.SMALL,
        }}
        style={{ backgroundColor: getBackgroundColor(isTabsActive) }}
        onPress={() => router.push('/(tabs)')}
        accessibilityLabel="Go to Home"
      />
      <DrawerItem
        label={t('saves', { defaultValue: 'Saved Translations' })}
        icon={({ size }) => (
          <FontAwesome name="bookmark" size={size} color={getIconColor(isSavesActive)} />
        )}
        labelStyle={{
          ...styles.navItemLabel,
          color: getLabelColor(isSavesActive),
          marginLeft: Constants.SPACING.SMALL,
        }}
        style={{ backgroundColor: getBackgroundColor(isSavesActive) }}
        onPress={() => router.push('/saves')}
        accessibilityLabel="Go to Saved Translations"
      />
      <DrawerItem
        label={session ? t('profile', { defaultValue: 'Profile' }) : t('settings', { defaultValue: 'Settings' })}
        icon={({ size }) => (
          <FontAwesome name={session ? "user" : "cog"} size={size} color={getIconColor(isProfileActive)} />
        )}
        labelStyle={{
          ...styles.navItemLabel,
          color: getLabelColor(isProfileActive),
          marginLeft: Constants.SPACING.SMALL,
        }}
        style={{ backgroundColor: getBackgroundColor(isProfileActive) }}
        onPress={() => router.push('/profile')}
        accessibilityLabel={session ? "Go to Profile" : "Go to Settings"}
      />
      {session ? (
        <DrawerItem
          label={t('signOut', { defaultValue: 'Sign Out' })}
          icon={({ size }) => (
            <FontAwesome name="sign-out" size={size} color={Constants.COLORS.DESTRUCTIVE} />
          )}
          labelStyle={{
            ...styles.navItemLabel,
            color: Constants.COLORS.DESTRUCTIVE,
            marginLeft: Constants.SPACING.SMALL,
          }}
          style={{ backgroundColor: getBackgroundColor(false) }}
          onPress={async () => {
            await signOut();
            router.replace('/welcome');
          }}
          accessibilityLabel="Sign out"
        />
      ) : (
        <DrawerItem
          label={t('login', { defaultValue: 'Login' })}
          icon={({ size }) => (
            <FontAwesome name="sign-in" size={size} color={getIconColor(pathname === '/(auth)/login')} />
          )}
          labelStyle={{
            ...styles.navItemLabel,
            color: getLabelColor(pathname === '/(auth)/login'),
            marginLeft: Constants.SPACING.SMALL,
          }}
          style={{
            backgroundColor: getBackgroundColor(pathname === '/(auth)/login'),
          }}
          onPress={() => router.push('/(auth)/login')}
          accessibilityLabel="Go to Login"
        />
      )}
    </DrawerContentScrollView>
  );
});

CustomDrawerContent.propTypes = {
  navigation: PropTypes.object.isRequired,
};

/**
 * The layout component for the drawer navigation group.
 * @returns {JSX.Element} The drawer navigation layout.
 */
export default function DrawerLayout() {
  const { t } = useTranslation();
  const { session, error: sessionError, isLoggingIn } = useSession();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    // Normalize pathname for consistency
    const normalizedPath = pathname.toLowerCase();
    const isAuthRoute = normalizedPath.includes('/login') || normalizedPath.includes('/register');

    // Skip navigation to /welcome if on login or register screen, or if still logging in
    if (!session && sessionError && !isLoggingIn && !isAuthRoute) {
      // Add a delay to ensure the toast is visible before navigating
      const timer = setTimeout(() => {
        router.replace('/welcome');
      }, Constants.TOAST_DURATION); // Align with toast duration
      return () => clearTimeout(timer);
    }
  }, [session, sessionError, isLoggingIn, pathname, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: isDarkMode ? '#333' : Constants.COLORS.CARD,
            width: width * Constants.DRAWER.WIDTH_MULTIPLIER,
            height: height,
            borderRightWidth: Constants.DRAWER.BORDER_WIDTH,
            borderRightColor: isDarkMode ? Constants.DRAWER.BORDER_COLOR_DARK : Constants.DRAWER.BORDER_COLOR_LIGHT,
          },
          drawerType: 'front',
          swipeEnabled: true,
          drawerPosition: 'left',
        }}
        onBackdropPress={() => router.back()}
      >
        <Drawer.Screen name="(tabs)" options={{ drawerLabel: t('home', { defaultValue: 'Home' }) }} />
        <Drawer.Screen
          name="saves"
          options={{ drawerLabel: t('saves', { defaultValue: 'Saved Translations' }) }}
        />
        <Drawer.Screen
          name="profile"
          options={{ drawerLabel: session ? t('profile', { defaultValue: 'Profile' }) : t('settings', { defaultValue: 'Settings' }) }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  userInfoWrapper: {
    flexDirection: 'row',
    paddingHorizontal: Constants.SPACING.MEDIUM,
    paddingVertical: Constants.SPACING.SECTION,
    borderBottomColor: Constants.COLORS.SECONDARY_TEXT,
    borderBottomWidth: 1,
    marginBottom: Constants.SPACING.MEDIUM,
  },
  userImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Constants.COLORS.SECONDARY_TEXT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImagePlaceholderText: {
    fontSize: 40,
    color: Constants.COLORS.CARD,
    fontWeight: 'bold',
  },
  userDetailsWrapper: {
    marginTop: Constants.SPACING.SECTION,
    marginLeft: Constants.SPACING.MEDIUM,
  },
  username: {
    fontSize: Constants.FONT_SIZES.SUBTITLE,
    fontWeight: 'bold',
  },
  navItemLabel: {
    fontSize: Constants.FONT_SIZES.BODY,
  },
});