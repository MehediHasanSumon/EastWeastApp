import { motion } from "framer-motion";
import { IoMoonOutline } from "react-icons/io5";
import { useTheme } from "../../../context/ThemeContext";
import AdminLayout from "../../../layouts/Admin/AdminLayout";
import AdminSettingLayout from "../../../layouts/Admin/AdminSettingLayout";

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();
  const breadcrumbItems = [{ label: "Dashboard", path: "/dashboard" }, { label: "Settings" }];
  return (
    <AdminLayout breadcrumbItems={breadcrumbItems}>
      <AdminSettingLayout>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center space-x-3">
            <IoMoonOutline className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Appearance</h2>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-6">
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme Preference</label>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <input
                      id="light-theme"
                      name="theme"
                      type="radio"
                      checked={theme === "light"}
                      onChange={() => setTheme("light")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="light-theme" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Light
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="dark-theme"
                      name="theme"
                      type="radio"
                      checked={theme === "dark"}
                      onChange={() => setTheme("dark")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="dark-theme" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dark
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="system-theme"
                      name="theme"
                      type="radio"
                      checked={theme === "system"}
                      onChange={() => setTheme("system")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="system-theme" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      System Preference
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    // Handle theme save if needed
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </AdminSettingLayout>
    </AdminLayout>
  );
};

export default AppearanceSettings;
