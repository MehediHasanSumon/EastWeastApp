import { SquarePen } from "lucide-react";
import { FiTrash2 } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import type { Column } from "../../../interface/types";

interface Permission {
  _id: string;
  name: string;
}

export const getColumns = ({ onEdit, onDelete }: { onEdit: (row: any) => void; onDelete: (row: any) => void }): Column<any>[] => [
  {
    header: "Role Name",
    accessor: "name",
    cell: (row: any) => <div className="capitalize">{row.name}</div>,
  },
  {
    header: "Permissions",
    accessor: "permissions",
    cell: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.permissions.length > 0 ? (
          row.permissions.map((perm: Permission) => (
            <span
              key={perm._id}
              className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
            >
              {perm.name}
            </span>
          ))
        ) : (
          <span className="text-gray-500 text-sm dark:text-gray-400">No permissions</span>
        )}
      </div>
    ),
  },
  {
    header: "",
    cell: (row) => (
      <div className="flex justify-end space-x-2">
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
