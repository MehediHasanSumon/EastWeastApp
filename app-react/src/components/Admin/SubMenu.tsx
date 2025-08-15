import { motion } from "framer-motion";
import { useState } from "react";
import type { IconType } from "react-icons/lib";

interface SubMenuProps {
  title: string;
  icon: IconType;
  children: React.ReactNode;
}

const SubMenu = ({ title, icon: Icon, children }: SubMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center cursor-pointer justify-between w-full p-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center">
          <Icon className="w-4 h-4" />
          <span className="ml-2">{title}</span>
        </div>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="pl-6 mt-0.5 space-y-0.5"
        >
          {children}
        </motion.ul>
      )}
    </li>
  );
};

export default SubMenu;
