import { AxiosError } from "axios";
import { motion } from "framer-motion";
import { useState } from "react";
import { FaRegUser } from "react-icons/fa";
import { IoExitOutline, IoSettingsOutline } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router";
import { logout } from "../../app/features/auth/authSlice";
import request from "../../service/AxiosInstance";
import { removeAuthCookies } from "../../utils/AuthLib";
import { toastError } from "../../utils/Toast";
import Loading from "../Loading";

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await request.get("/api/logout");
      if (response.status === 200) {
        dispatch(logout());
        removeAuthCookies();
        return navigate("/", { replace: true });
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400 || error.response?.status === 404) {
          toastError(error.response.data.message);
        } else {
          toastError("Something went wrong! Please try again.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="relative" onClick={() => setIsOpen(!isOpen)}>
      <button className="flex text-sm rounded-full focus:outline-none transition-all duration-300" aria-label="User Menu">
        <img
          src="https://i.pravatar.cc/150?img=30"
          alt="User Avatar"
          className="w-8 h-8 rounded-full ring-2 ring-indigo-500 dark:ring-indigo-400 hover:ring-4 transition-all duration-300"
        />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-12 right-0 w-48 bg-white rounded-lg shadow-xl dark:bg-gray-700 z-50"
        >
          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-600/50">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Jessica Smith</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">jessica@example.com</p>
          </div>
          <ul className="py-1 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <Link
                to="/profile"
                className="block px-4 py-2 hover:bg-indigo-50 dark:hover:bg-gray-600/50 transition-colors duration-200"
              >
                <span className="flex items-center">
                  <FaRegUser className="w-4 h-4 mr-2" />
                  Profile
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/account-settings"
                className="block px-4 py-2 hover:bg-indigo-50 dark:hover:bg-gray-600/50 transition-colors duration-200"
              >
                <span className="flex items-center">
                  <IoSettingsOutline className="w-4 h-4 mr-2" />
                  Settings
                </span>
              </Link>
            </li>
            <li>
              <div
                onClick={handleLogout}
                className="block px-4 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-600/50 transition-colors duration-200"
              >
                <span className="flex items-center text-red-500 dark:text-red-400">
                  <IoExitOutline className="w-4 h-4 mr-2" />
                  Sign Out
                </span>
              </div>
            </li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default UserMenu;
