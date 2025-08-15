import { motion } from "framer-motion";
import ThemeToggle from "../ThemeToggle";
import Logo from "./Logo";
import Notifications from "./Notifications";
import UserMenu from "./UserMenu";

const Header = ({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (value: boolean) => void }) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50 fixed left-0 right-0 top-0 z-60 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 text-gray-600 ${
              !sidebarOpen ? "bg-gray-600" : ""
            } dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>

          <Logo />
        </div>

        <div className="flex items-center space-x-4">
          <Notifications />
          <UserMenu />
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
