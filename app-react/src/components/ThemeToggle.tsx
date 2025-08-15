import { useEffect, useState } from "react";
import { getLocalStorage, setLocalStorage } from "../utils/Storage";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState<boolean>(true);

  const applyTheme = (theme: "dark" | "light") => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    setIsDark(theme === "dark");
  };

  useEffect(() => {
    const storedTheme = getLocalStorage("color-theme");
    const prefersDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applySystemTheme = (e: MediaQueryListEvent) => {
      // Only update theme if user hasn't set a preference
      const currentStored = getLocalStorage("color-theme");
      if (!currentStored) {
        applyTheme(e.matches ? "dark" : "light");
      }
    };

    if (storedTheme === "dark" || storedTheme === "light") {
      applyTheme(storedTheme);
    } else {
      applyTheme(prefersDarkQuery.matches ? "dark" : "light");
      prefersDarkQuery.addEventListener("change", applySystemTheme);
    }

    return () => {
      prefersDarkQuery.removeEventListener("change", applySystemTheme);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    applyTheme(newTheme);
    setLocalStorage("color-theme", newTheme);
  };

  const pathD = isDark
    ? "M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
    : "M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="text-gray-500 cursor-pointer dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5"
      aria-label="Toggle Theme"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" clipRule="evenodd" d={pathD} />
      </svg>
    </button>
  );
};

export default ThemeToggle;
