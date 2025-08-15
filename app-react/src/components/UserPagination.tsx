import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { PaginationMeta } from "../interface/types";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange }) => {
  const { currentPage, lastPage } = meta;

  const pages = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = startPage + maxPagesToShow - 1;
  if (endPage > lastPage) {
    endPage = lastPage;
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let page = startPage; page <= endPage; page++) {
    pages.push(page);
  }

  return (
    <div className="mt-12">
      <nav className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
        <div>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <FiChevronLeft className="mr-2 h-5 w-5" />
            Previous
          </button>
        </div>
        <div className="hidden md:flex space-x-2">
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-500">...</span>
              )}
            </>
          )}
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                page === currentPage
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {page}
            </button>
          ))}
          {endPage < lastPage && (
            <>
              {endPage < lastPage - 1 && (
                <span className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-500">...</span>
              )}
              <button
                onClick={() => onPageChange(lastPage)}
                className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {lastPage}
              </button>
            </>
          )}
        </div>
        <div>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === lastPage}
            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            Next
            <FiChevronRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Pagination;
