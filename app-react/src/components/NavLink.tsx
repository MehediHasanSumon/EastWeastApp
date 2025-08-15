import { NavLink } from "react-router";
import type { NavLinkProps } from "../interface/types";

export const NavbarLink: React.FC<NavLinkProps> = ({
  to,
  children,
  className = "",
}) => (
  <NavLink
    to={to}
    className={`relative px-1 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors group ${className}`}
  >
    <span className="relative">
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full dark:from-blue-400 dark:to-purple-400"></span>
    </span>
  </NavLink>
);
