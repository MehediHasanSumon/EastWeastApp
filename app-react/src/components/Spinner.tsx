import React from "react";

interface SpinnerProps {
  text?: string;
  size?: number;
  colorClass?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ text = "Loading...", size = 3, colorClass = "border-blue-500" }) => {
  const spinnerSize = `${size}rem`;

  return (
    <div className="text-center py-12">
      <div
        className={`animate-spin rounded-full border-b-2 ${colorClass} mx-auto`}
        style={{ width: spinnerSize, height: spinnerSize }}
      ></div>
      {text && <p className="mt-4 text-gray-600 dark:text-gray-400">{text}</p>}
    </div>
  );
};

export default Spinner;
