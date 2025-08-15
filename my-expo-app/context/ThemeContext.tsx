import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface Theme {
  mode: ThemeMode;
  bgColor: string;
  fontColor: string;
  fontSize: number;
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
  },
  updateTheme: () => {},
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>({
    mode: 'light',
    bgColor: '#ffffff',
    fontColor: '#000000',
    fontSize: 16,
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
    return null; // Or you can return a splash/loading screen
  }

  return <ThemeContext.Provider value={{ theme, updateTheme }}>{children}</ThemeContext.Provider>;
}
