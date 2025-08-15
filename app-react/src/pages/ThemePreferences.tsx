import { useUser } from "../context/UserContext";

const ThemePreferences = () => {
  const { user, handleThemeChange } = useUser();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Theme Preferences</h3>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleThemeChange("light")}
            className={`px-4 py-2 rounded-lg border ${
              user.theme === "light"
                ? "bg-indigo-100 border-indigo-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            Light Mode
          </button>
          <button
            onClick={() => handleThemeChange("dark")}
            className={`px-4 py-2 rounded-lg border ${
              user.theme === "dark"
                ? "bg-indigo-900 border-indigo-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            Dark Mode
          </button>
          <button
            onClick={() => handleThemeChange("system")}
            className={`px-4 py-2 rounded-lg border ${
              user.theme === "system"
                ? "bg-indigo-600 text-white border-indigo-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            System Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemePreferences;
