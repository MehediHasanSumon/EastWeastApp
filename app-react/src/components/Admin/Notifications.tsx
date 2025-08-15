import { motion } from "framer-motion";
import { useState } from "react";

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = [
    {
      user: "Sarah",
      message: "New message from Sarah",
      time: "5 minutes ago",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    {
      user: "System",
      message: "Your post got 24 likes",
      time: "1 hour ago",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
  ];

  return (
    <div className="relative" onClick={() => setIsOpen(!isOpen)}>
      <button
        className="p-2 text-gray-500 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 relative"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl divide-y divide-gray-200/50 dark:divide-gray-600/50 dark:bg-gray-700 z-50"
        >
          <div className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-white bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-600 dark:to-gray-700 rounded-t-lg">
            Notifications
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            {notifications.map((notification, i) => (
              <a
                key={i}
                href="#"
                className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-600/50 rounded-md transition-all duration-200"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <img
                      src={notification.avatar}
                      alt={notification.user}
                      className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-600"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {notification.message}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {notification.time}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <a
            href="#"
            className="block px-4 py-3 text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-600/50 rounded-b-lg transition-colors duration-200"
          >
            View all notifications
          </a>
        </motion.div>
      )}
    </div>
  );
};

export default Notifications;
