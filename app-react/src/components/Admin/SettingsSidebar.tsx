import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { IoMoonOutline } from "react-icons/io5";
import { MdLockOutline } from "react-icons/md";
import { NavLink } from "react-router";

interface SidebarItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const SettingsSidebar: React.FC = () => {
  const sidebarItems: SidebarItem[] = [
    {
      label: "Profile Information",
      path: "/dashboard/account-settings",
      icon: <FaRegUserCircle className="w-5 h-5 mr-3" />,
    },
    {
      label: "Email Settings",
      path: "/dashboard/email-settings",
      icon: <HiOutlineMail className="w-5 h-5 mr-3" />,
    },
    {
      label: "Password",
      path: "/dashboard/password-settings",
      icon: <MdLockOutline className="w-5 h-5 mr-3" />,
    },
    {
      label: "Appearance",
      path: "/dashboard/theme-settings",
      icon: <IoMoonOutline className="w-5 h-5 mr-3" />,
    },
  ];

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
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }: any) =>
                `flex items-center px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-indigo-700 hover:bg-indigo-200 dark:text-gray-300 dark:hover:bg-gray-700"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-indigo-200 dark:border-gray-700"></div>
      </motion.div>
    </div>
  );
};

export default SettingsSidebar;
