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
}

interface Seller {
  _id: string;
  name: string;
  email: string;
}

interface Invoice {
  _id: string;
  invoice_no: string;
  date_time: string;
  vehicle_no?: string | null;
  customer_name: string;
  customer_phone_number: string;
  payment_method: "cash" | "card" | "bank_transfer" | "credit" | "due";
  product: Product;
  seller: Seller;
  price: number;
  quantity: number;
  total_amount: number;
  discount: number;
  is_sent_sms: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getColumns = ({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (row: Invoice) => void;
  onEdit: (row: Invoice) => void;
  onDelete: (row: Invoice) => void;
}): Column<Invoice>[] => [
  {
    header: "Invoice No",
    accessor: "invoice_no",
    cell: (row) => (
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {row.invoice_no}
      </div>
    ),
  },
  {
    header: "Date",
    accessor: "date_time",
    cell: (row) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {new Date(row.date_time).toLocaleDateString()}
      </div>
    ),
  },
  {
    header: "Customer",
    accessor: "customer_name",
    cell: (row) => (
      <div>
        <div className="font-medium text-gray-900 dark:text-gray-100">{row.customer_name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{row.customer_phone_number}</div>
      </div>
    ),
  },
  {
    header: "Product",
    accessor: "product",
    cell: (row) => (
      <div className="text-sm text-gray-900 dark:text-gray-100">
        {row.product.name}
      </div>
    ),
  },
  {
    header: "Seller",
    accessor: "seller",
    cell: (row) => (
      <div>
        <div className="font-medium text-gray-900 dark:text-gray-100">{row.seller.name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{row.seller.email}</div>
      </div>
    ),
  },
  {
    header: "Amount",
    accessor: "total_amount",
    cell: (row) => (
      <div className="text-right">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          ${row.total_amount.toFixed(2)}
        </div>
        {row.discount > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            -${row.discount.toFixed(2)} discount
          </div>
        )}
      </div>
    ),
  },
  {
    header: "Payment",
    accessor: "payment_method",
    cell: (row) => (
      <div className="flex items-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
          row.payment_method === 'cash' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : row.payment_method === 'credit' || row.payment_method === 'due'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
        }`}>
          {row.payment_method}
        </span>
      </div>
    ),
  },
  {
    header: "SMS",
    accessor: "is_sent_sms",
    cell: (row) => (
      <div className="flex items-center">
        <Toggle
          id={`sms-${row._id}`}
          checked={row.is_sent_sms}
          disabled={true}
          aria-label={`SMS sent for ${row.invoice_no}`}
        />
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
