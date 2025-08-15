import { ChevronRight, Home } from "lucide-react";
import React from "react";
import { Link } from "react-router";

type BreadcrumbItem = {
  label: string;
  path?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  isActive?: boolean;
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, isActive }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex mb-8" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="inline-flex items-center">
              {/* separator */}
              {index > 0 && <ChevronRight size={12} className="mx-1 text-gray-400" aria-hidden="true" />}

              {isLast ? (
                <span
                  className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400"
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path ?? "#"}
                  className={`${
                    index === 0 ? "inline-flex items-center" : "ml-1 md:ml-2"
                  } text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white`}
                >
                  {/* Home icon on first item */}
                  {index === 0 && <Home size={12} className="mr-2.5" aria-hidden="true" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
