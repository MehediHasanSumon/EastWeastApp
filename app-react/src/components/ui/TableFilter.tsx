import React from "react";
import { FiSearch, FiTrash2, FiX } from "react-icons/fi";
import Button from "./Button";
import Input from "./Input";
import { Option, Select } from "./Select";

interface TableFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  onDelete?: () => void;
  selectedCount?: number;
}

const TableFilter: React.FC<TableFilterProps> = ({
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  perPage,
  onPerPageChange,
  onDelete,
  selectedCount = 0,
}) => {
  const handleClearSearch = () => onSearchChange("");
  const handleClearSort = () => onSortChange("");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-gray-500 dark:text-gray-400" />
            </div>
            <Input
              id="search"
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search permissions..."
              className="pl-10 pr-10"
            />
            {searchValue && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                type="button"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="min-w-[140px] relative">
            <Select id="sort" value={sortValue} onChange={(e) => onSortChange(e.target.value)}>
              <Option value="">Sort by</Option>
              <Option value="asc">Name (A-Z)</Option>
              <Option value="desc">Name (Z-A)</Option>
              <Option value="newest">Newest First</Option>
              <Option value="oldest">Oldest First</Option>
            </Select>
            {sortValue && (
              <button
                onClick={handleClearSort}
                className="absolute inset-y-0 right-8 flex items-center pr-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                type="button"
              >
                <FiX className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="min-w-[100px]">
            <Select id="perPage" value={perPage.toString()} onChange={(e) => onPerPageChange(Number(e.target.value))}>
              <Option value="5">5</Option>
              <Option value="10">10</Option>
              <Option value="25">25</Option>
              <Option value="50">50</Option>
              <Option value="100">100</Option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="red" onClick={() => onDelete?.()} className="flex items-center gap-2">
              <FiTrash2 className="w-4 h-4" />
              <span>{selectedCount > 0 ? `Delete (${selectedCount})` : "Delete"}</span>
            </Button>
          </div>
        </div>
      </div>

      {(searchValue || sortValue) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {searchValue && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm">
              <span>Search: "{searchValue}"</span>
              <button onClick={handleClearSearch}>
                <FiX className="w-3 h-3" />
              </button>
            </div>
          )}
          {sortValue && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md text-sm">
              <span>
                Sort: {sortValue === "asc" ? "A-Z" : sortValue === "desc" ? "Z-A" : sortValue === "newest" ? "Newest" : "Oldest"}
              </span>
              <button onClick={handleClearSort}>
                <FiX className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableFilter;
