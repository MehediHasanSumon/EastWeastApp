import { SquarePen } from "lucide-react";
import { FiTrash2 } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import Toggle from "../../../components/ui/Toggle";
import type { Column } from "../../../interface/types";

interface Role {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  verify_at: string | null;
  roles: Role[];
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getColumns = ({
  onEdit,
  onDelete,
  onVerifyToggle,
  onStatusToggle,
}: {
  onEdit: (row: User) => void;
  onDelete: (row: User) => void;
  onVerifyToggle: (userId: string, verified: boolean) => void;
  onStatusToggle: (userId: string, status: boolean) => void;
}): Column<User>[] => [
  {
    header: "Name",
    accessor: "name",
    cell: (row) => <div className="capitalize">{row.name}</div>,
  },
  {
    header: "Email",
    accessor: "email",
  },
  {
    header: "Roles",
    accessor: "roles",
    cell: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.roles.length > 0 ? (
          row.roles.map((role) => (
            <span
              key={role._id}
              className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
            >
              {role.name}
            </span>
          ))
        ) : (
          <span className="text-gray-500 text-sm dark:text-gray-400">No roles</span>
        )}
      </div>
    ),
  },
  {
    header: "Verified",
    accessor: "verify_at",
    cell: (row) => (
      <div className="flex items-center">
        <Toggle
          id={`verify-${row._id}`}
          checked={!!row.verify_at}
          onChange={(e) => onVerifyToggle(row._id, e.target.checked)}
          aria-label={`Toggle verification for ${row.name}`}
        />
        {row.verify_at && (
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{new Date(row.verify_at).toLocaleDateString()}</span>
        )}
      </div>
    ),
  },
  {
    header: "Status",
    accessor: "status",
    cell: (row) => (
      <Toggle
        id={`status-${row._id}`}
        checked={row.status}
        onChange={(e) => onStatusToggle(row._id, e.target.checked)}
        aria-label={`Toggle status for ${row.name}`}
      />
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
