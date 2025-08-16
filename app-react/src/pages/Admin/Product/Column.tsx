import { SquarePen } from "lucide-react";
import { FiEye, FiTrash2 } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import Toggle from "../../../components/ui/Toggle";
import type { Column } from "../../../interface/types";

interface Product {
  _id: string;
  name: string;
  purchases: number;
  sell: number;
  description?: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getColumns = ({
  onView,
  onEdit,
  onDelete,
  onStatusToggle,
}: {
  onView: (row: Product) => void;
  onEdit: (row: Product) => void;
  onDelete: (row: Product) => void;
  onStatusToggle: (productId: string, status: boolean) => void;
}): Column<Product>[] => [
  {
    header: "Product Name",
    accessor: "name",
    cell: (row) => (
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {row.name}
      </div>
    ),
  },
  {
    header: "Purchase Price",
    accessor: "purchases",
    cell: (row) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        ${row.purchases.toFixed(2)}
      </div>
    ),
  },
  {
    header: "Sell Price",
    accessor: "sell",
    cell: (row) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        ${row.sell.toFixed(2)}
      </div>
    ),
  },
  {
    header: "Profit Margin",
    accessor: "profit",
    cell: (row) => {
      const profit = row.sell - row.purchases;
      const margin = row.purchases > 0 ? (profit / row.purchases) * 100 : 0;
      return (
        <div className="text-sm">
          <div className={`font-medium ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ${profit.toFixed(2)}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {margin.toFixed(1)}%
          </div>
        </div>
      );
    },
  },
  {
    header: "Description",
    accessor: "description",
    cell: (row) => (
      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
        {row.description || "No description"}
      </div>
    ),
  },
  {
    header: "Status",
    accessor: "status",
    cell: (row) => (
      <div className="flex items-center">
        <Toggle
          id={`status-${row._id}`}
          checked={row.status}
          onChange={(e) => onStatusToggle(row._id, e.target.checked)}
          aria-label={`Toggle status for ${row.name}`}
        />
        <span className={`ml-2 text-xs font-medium capitalize ${
          row.status 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {row.status ? "Active" : "Inactive"}
        </span>
      </div>
    ),
  },
  {
    header: "Created",
    accessor: "createdAt",
    cell: (row) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {new Date(row.createdAt).toLocaleDateString()}
      </div>
    ),
  },
  {
    header: "",
    cell: (row) => (
      <div className="flex justify-end space-x-2">
        <Button variant="view" onClick={() => onView(row)} aria-label="View">
          <FiEye size={14} />
        </Button>

        <Button variant="edit" onClick={() => onEdit(row)} aria-label="Edit">
          <SquarePen size={15} />
        </Button>

        <Button variant="delete" onClick={() => onDelete(row)} aria-label="Delete">
          <FiTrash2 size={14} />
        </Button>
      </div>
    ),
  },
];
