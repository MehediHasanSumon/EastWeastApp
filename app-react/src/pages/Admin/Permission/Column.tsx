import { SquarePen } from "lucide-react";
import { FiEye, FiTrash2 } from "react-icons/fi";
import Button from "../../../components/ui/Button";
import type { Column } from "../../../interface/types";

export const getColumns = ({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (row: any) => void;
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
}): Column<any>[] => [
  {
    header: "Name",
    accessor: "name",
  },
  {
    header: "Guard",
    accessor: "guard",
  },
  {
    header: "",
    cell: (row: any) => (
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
