import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  children: React.ReactNode;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ id, children, className = "", error, ...props }) => {
  const baseClasses = `bg-white border text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 block w-full p-2 dark:bg-gray-800 dark:text-white transition-all duration-200 ${
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-200 dark:border-red-600 dark:focus:ring-red-800/30"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200 dark:border-gray-600 dark:focus:ring-blue-800/30"
  }`;

  return (
    <div className="relative">
      <select id={id} className={`${baseClasses} ${className}`} {...props}>
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && (
        <div className="absolute inset-y-0 right-8 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

interface OptionProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
}

export const Option: React.FC<OptionProps> = ({ children, ...props }) => {
  return <option {...props}>{children}</option>;
};
