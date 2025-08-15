
import { motion } from "framer-motion";
import { NavLink } from "react-router";

const ProfileSidebar: React.FC = () => {
  return (
    <div className="h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] w-full md:w-64">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-full bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-lg border border-indigo-100 dark:border-gray-700 flex flex-col"
      >
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 mb-2 px-2">Account Settings</h3>
          <div className="h-px bg-indigo-200 dark:bg-gray-700 w-full"></div>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-indigo-700 hover:bg-indigo-200 dark:text-gray-300 dark:hover:bg-gray-700"
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile Information
          </NavLink>

          <NavLink
            to="/email"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-indigo-700 hover:bg-indigo-200 dark:text-gray-300 dark:hover:bg-gray-700"
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Email Settings
          </NavLink>

          <NavLink
            to="/password"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-indigo-700 hover:bg-indigo-200 dark:text-gray-300 dark:hover:bg-gray-700"
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Password
          </NavLink>

          <NavLink
            to="/theme"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-indigo-700 hover:bg-indigo-200 dark:text-gray-300 dark:hover:bg-gray-700"
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
            Appearance
          </NavLink>
        </nav>

        <div className="mt-auto pt-4 border-t border-indigo-200 dark:border-gray-700">
          <button className="w-full flex items-center px-4 py-3 text-indigo-700 dark:text-gray-300 hover:bg-indigo-200 dark:hover:bg-gray-700 rounded-xl transition-all">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Account
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSidebar;
