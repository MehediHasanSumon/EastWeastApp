import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  systemTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("system");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  // Determine if we should use dark mode
  const isDark = theme === "system" ? systemTheme === "dark" : theme === "dark";

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Watch for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    // Apply the theme to the document
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return <ThemeContext.Provider value={{ theme, systemTheme, setTheme, isDark }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
