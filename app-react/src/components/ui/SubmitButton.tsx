import React from "react";

interface SubmitButtonProps {
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ loading = false, children = "Submit", className = "" }) => {
  return (
    <div className="pt-3 flex justify-end">
      <button
        type="submit"
        disabled={loading}
        className={`flex items-center justify-center text-white cursor-pointer bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2 text-center me-2 mb-2 ${
          loading ? "opacity-75 cursor-not-allowed" : ""
        } ${className}`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <span>{children}</span>
        )}
      </button>
    </div>
  );
};

export default SubmitButton;
