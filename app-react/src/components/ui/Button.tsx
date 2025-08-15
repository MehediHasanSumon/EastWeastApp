import clsx from "clsx";
import React from "react";

type Variant = "default" | "alternative" | "dark" | "light" | "green" | "red" | "yellow" | "purple" | "edit" | "view" | "delete";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  default:
    "px-5 py-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
  alternative:
    "px-5 py-2 text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:ring-4 focus:ring-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700",
  dark: "px-5 py-2 text-white bg-gray-800 hover:bg-gray-900 focus:ring-4 focus:ring-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700",
  light:
    "px-5 py-2 text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700",
  green:
    "px-5 py-2 text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800",
  red: "px-5 py-2 text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900",
  yellow: "px-5 py-2 text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 dark:focus:ring-yellow-900",
  purple:
    "px-5 py-2 text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900",

  view: "text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300",
  edit: "text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300",
  delete: "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300",
};

const Button: React.FC<ButtonProps> = ({ variant = "default", className, children, ...props }) => {
  return (
    <button
      type="button"
      className={clsx(
        "flex justify-center items-center cursor-pointer focus:outline-none font-medium rounded-lg text-sm",
        (variant === "view" || variant === "edit" || variant === "delete") && "rounded p-1 text-base",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
