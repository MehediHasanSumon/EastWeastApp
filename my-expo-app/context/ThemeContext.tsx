import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface Theme {
  mode: ThemeMode;
  bgColor: string;
  fontColor: string;
  fontSize: number;
  primaryGradient?: readonly [string, string];
}

interface ThemeContextType {
  theme: Theme;
  updateTheme: (newTheme: Partial<Theme>) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: {
    mode: 'light',
    bgColor: '#ffffff',
    fontColor: '#000000',
    fontSize: 16,
    primaryGradient: ['#6366F1', '#8B5CF6'] as const,
  },
  updateTheme: () => {},
});

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook to check if theme is ready
export const useThemeReady = () => {
  const context = useContext(ThemeContext);
  return !!context;
};

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>({
    mode: 'light',
    bgColor: '#ffffff',
    fontColor: '#000000',
    fontSize: 16,
    primaryGradient: ['#6366F1', '#8B5CF6'] as const,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme) {
          const parsed = JSON.parse(savedTheme);
          if (
            parsed &&
            ['light', 'dark', 'system'].includes(parsed.mode) &&
            typeof parsed.bgColor === 'string' &&
            typeof parsed.fontColor === 'string' &&
            typeof parsed.fontSize === 'number'
          ) {
            setTheme(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load theme:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateTheme = useCallback(async (newTheme: Partial<Theme>) => {
    setTheme((prev) => {
      const merged = { ...prev, ...newTheme };
      AsyncStorage.setItem('appTheme', JSON.stringify(merged)).catch((err) =>
        console.warn('Failed to save theme:', err)
      );
      return merged;
    });
  }, []);

  if (loading) {
    return (
      <ThemeContext.Provider value={{ 
        theme: {
          mode: 'light',
          bgColor: '#ffffff',
          fontColor: '#000000',
          fontSize: 16,
          primaryGradient: ['#6366F1', '#8B5CF6'] as const,
        }, 
        updateTheme: () => {} 
      }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return <ThemeContext.Provider value={{ theme, updateTheme }}>{children}</ThemeContext.Provider>;
}
