import React from "react";
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import type { PaginationMeta } from "../../interface/types";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange }) => {
  const { currentPage, lastPage, from, to, total } = meta;

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
    <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{from}</span> to <span className="font-medium">{to}</span> of{" "}
            <span className="font-medium">{total}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <span className="sr-only">First</span>
              <FiChevronsLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <FiChevronLeft className="h-5 w-5" />
            </button>
            {startPage > 1 && (
              <>
                <button
                  onClick={() => onPageChange(1)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  1
                </button>
                {startPage > 2 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                    ...
                  </span>
                )}
              </>
            )}
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`${
                  page === currentPage
                    ? "z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-700 text-blue-600 dark:text-blue-300"
                    : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                } relative inline-flex items-center px-4 py-2 border text-sm font-medium`}
              >
                {page}
              </button>
            ))}
            {endPage < lastPage && (
              <>
                {endPage < lastPage - 1 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                    ...
                  </span>
                )}
                <button
                  onClick={() => onPageChange(lastPage)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  {lastPage}
                </button>
              </>
            )}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === lastPage}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <FiChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => onPageChange(lastPage)}
              disabled={currentPage === lastPage}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <span className="sr-only">Last</span>
              <FiChevronsRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
