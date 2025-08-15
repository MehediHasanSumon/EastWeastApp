import React from "react";

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
}

const Toggle: React.FC<ToggleProps> = ({ id, label, className = "", ...props }) => {
  return (
    <label htmlFor={id} className="inline-flex items-center cursor-pointer group">
      <input id={id} type="checkbox" className={`sr-only peer ${className}`} {...props} />
      <div className="relative w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/50 dark:peer-focus:ring-blue-800/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-200 dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 dark:peer-checked:from-blue-600 dark:peer-checked:to-blue-700 shadow-sm hover:shadow-md transition-shadow"></div>
      {label && (
        <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
          {label}
        </span>
      )}
    </label>
  );
};

export default Toggle;
