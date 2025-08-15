import { motion } from "framer-motion";
import type { IconType } from "../../interface/types";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: IconType;
}

const iconMap = {
  "currency-dollar":
    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  users:
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  "shopping-cart":
    "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
  briefcase:
    "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
};

const StatsCard = ({ title, value, change, icon }: StatsCardProps) => {
  const isPositive = change.startsWith("+");

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center justify-between transition-all duration-300"
    >
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
        <p
          className={`mt-1 text-sm ${
            isPositive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {change} from last week
        </p>
      </div>
      <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-lg">
        <svg
          className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={iconMap[icon]}
          />
        </svg>
      </div>
    </motion.div>
  );
};

export default StatsCard;
