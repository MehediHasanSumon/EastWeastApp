import type { Column } from "../interface/types";
import Loader from "./ScaleLoader";
import Checkbox from "./ui/Checkbox";

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  selectedRows?: string[];
  setSelectedRows?: (rows: string[]) => void;
  isLoading?: boolean;
}

export default function Table<T extends { _id: string | number }>({
  columns,
  data,
  selectedRows,
  setSelectedRows,
  isLoading = false,
}: TableProps<T>) {
  const toggleRow = (id: string | number) => {
    if (!selectedRows || !setSelectedRows) return;
    const idStr = id.toString();
    if (selectedRows.includes(idStr)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== idStr));
    } else {
      setSelectedRows([...selectedRows, idStr]);
    }
  };

  const allSelected = selectedRows && data.length > 0 && selectedRows.length === data.length;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {selectedRows && setSelectedRows && (
              <th className="px-4 py-2">
                <Checkbox
                  id="ids"
                  checked={allSelected}
                  onChange={() => {
                    if (allSelected) {
                      setSelectedRows([]);
                    } else {
                      setSelectedRows(data.map((row) => row._id.toString()));
                    }
                  }}
                />
              </th>
            )}
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-2 text-${
                  col.align ?? "left"
                } text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length + (selectedRows && setSelectedRows ? 1 : 0)} className="px-6 py-8 text-center">
                <Loader />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectedRows && setSelectedRows ? 1 : 0)}
                className="px-6 py-2 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                Please adjust your filters or add new data to see it here.
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {selectedRows && setSelectedRows && (
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Checkbox
                      id="tableId"
                      checked={selectedRows.includes(row._id.toString())}
                      onChange={() => toggleRow(row._id)}
                    />
                  </td>
                )}
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white text-${col.align ?? "left"}`}
                  >
                    {col.cell
                      ? col.cell(row)
                      : typeof col.accessor === "function"
                      ? col.accessor(row)
                      : (row as any)[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
