import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext(null);

const COLLEGE_THEMES = {
  bannari_classic: {
    label: 'Bannari Classic Blue',
    vars: {
      '--college-primary': '#2563EB',
      '--college-secondary': '#1D4ED8',
      '--college-accent': '#F59E0B',
      '--college-ring': '#DBEAFE',
      '--college-soft': '#EFF6FF',
    },
  },
  bannari_emerald: {
    label: 'Bannari Emerald',
    vars: {
      '--college-primary': '#047857',
      '--college-secondary': '#065F46',
      '--college-accent': '#F59E0B',
      '--college-ring': '#D1FAE5',
      '--college-soft': '#ECFDF5',
    },
  },
  bannari_maroon: {
    label: 'Bannari Maroon Gold',
    vars: {
      '--college-primary': '#9F1239',
      '--college-secondary': '#881337',
      '--college-accent': '#FBBF24',
      '--college-ring': '#FFE4E6',
      '--college-soft': '#FFF1F2',
    },
  },
};

const COLLEGE_THEME_STORAGE_KEY = 'college_theme';
const DEFAULT_COLLEGE_THEME = 'bannari_classic';

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => sessionStorage.getItem('theme') === 'dark');
  const [collegeTheme, setCollegeTheme] = useState(() => {
    const savedTheme = localStorage.getItem(COLLEGE_THEME_STORAGE_KEY);
    return savedTheme && COLLEGE_THEMES[savedTheme] ? savedTheme : DEFAULT_COLLEGE_THEME;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    sessionStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const selectedTheme = COLLEGE_THEMES[collegeTheme] || COLLEGE_THEMES[DEFAULT_COLLEGE_THEME];
    const root = document.documentElement;

    Object.entries(selectedTheme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    localStorage.setItem(COLLEGE_THEME_STORAGE_KEY, collegeTheme);
  }, [collegeTheme]);

  const toggle = useCallback(() => {
    setDark((value) => !value);
  }, []);

  const collegeThemeOptions = useMemo(
    () => Object.entries(COLLEGE_THEMES).map(([key, theme]) => ({ key, label: theme.label })),
    []
  );

  const value = useMemo(() => ({
    dark,
    toggle,
    collegeTheme,
    setCollegeTheme,
    collegeThemeOptions,
  }), [dark, toggle, collegeTheme, collegeThemeOptions]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
