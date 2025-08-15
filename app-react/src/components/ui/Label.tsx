import type React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor: string;
  required?: boolean;
}

const Label: React.FC<LabelProps> = ({ htmlFor, children, className = "", required, ...props }) => {
  const baseClasses = "block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300";

  return (
    <label htmlFor={htmlFor} className={`${baseClasses} ${className}`} {...props}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export default Label;
