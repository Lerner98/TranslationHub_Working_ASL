import React, { createContext, useContext, useEffect } from 'react';
import useThemeStore from '../stores/ThemeStore';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { isDarkMode, toggleTheme, initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);