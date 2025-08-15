import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, className = "", rows = 4, placeholder = "", error, ...props }, ref) => {
    const baseClasses = `block p-3 w-full text-sm text-gray-900 bg-white rounded-lg border transition-all duration-200 resize-none focus:outline-none dark:bg-gray-800 dark:text-white ${
      error
        ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:border-red-600 dark:focus:ring-red-800/30"
        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:focus:ring-blue-800/30"
    }`;

    return (
      <div className="relative">
        <textarea ref={ref} id={id} rows={rows} className={`${baseClasses} ${className}`} placeholder={placeholder} {...props} />
        {error && (
          <div className="absolute inset-y-0 right-0 flex items-start pt-3 pr-3 pointer-events-none">
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
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
