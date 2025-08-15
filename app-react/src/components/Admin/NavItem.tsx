import { motion } from "framer-motion";
import type { IconType } from "react-icons/lib";
import { NavLink } from "react-router";

interface NavItemProps {
  to: string;
  icon: IconType;
  children: React.ReactNode;
  badge?: number;
}

const NavItem = ({ to, icon: Icon, children, badge }: NavItemProps) => {
  return (
    <motion.li whileHover={{ scale: 1.01 }}>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center p-2 text-sm rounded ${
            isActive
              ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-200"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`
        }
      >
        <Icon className="w-4 h-4" />
        <span className="ml-2">{children}</span>
        {badge && (
          <span className="ml-auto text-sm px-1 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200">
            {badge}
          </span>
        )}
      </NavLink>
    </motion.li>
  );
};

export default NavItem;
