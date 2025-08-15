import { Link } from "react-router";
import type { NavLinkProps } from "../interface/types";

export const DropdownLink: React.FC<NavLinkProps> = ({
  to,
  children,
  className = "",
}) => (
  <Link
    to={to}
    className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors ${className}`}
  >
    {children}
  </Link>
);
