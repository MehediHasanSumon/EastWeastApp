import React from "react";

interface FileInputProps {
  id: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  helperText?: string;
  required?: boolean;
  error?: string;
  multiple?: boolean;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ id, onChange, accept = "*", helperText, error, multiple = false }, ref) => {
    return (
      <div className="space-y-1 relative">
        <input
          ref={ref}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
          aria-describedby={`${id}_help`}
        />
        {helperText && (
          <p id={`${id}_help`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
        {error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
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

FileInput.displayName = "FileInput";

export default FileInput;
