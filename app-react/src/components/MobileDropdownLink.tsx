import { Link } from "react-router";
import type { NavLinkProps } from "../interface/types";

export const MobileDropdownLink: React.FC<NavLinkProps> = ({
  to,
  children,
  onClick,
}) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
  >
    {children}
  </Link>
);
