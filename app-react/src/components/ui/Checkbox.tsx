import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ id, label, className = "", ...props }) => {
  const checkboxClasses =
    "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-500 transition-all duration-200";
  const labelClasses =
    "ms-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 transition-colors";

  return (
    <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <input id={id} type="checkbox" className={`${checkboxClasses} ${className}`} {...props} />
      {label && (
        <label htmlFor={id} className={labelClasses}>
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
