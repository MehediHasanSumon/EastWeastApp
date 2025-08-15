import React from "react";

interface TableHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const TableHeader: React.FC<TableHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
        {subtitle && <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">{actions}</div>}
    </div>
  );
};

export default TableHeader;
