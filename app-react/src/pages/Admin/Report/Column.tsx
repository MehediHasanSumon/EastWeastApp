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
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export const getColumns = (): Column[] => [
  {
    header: "Invoice No",
    accessorKey: "invoice_no",
    cell: ({ row }: any) => (
      <span className="font-medium text-gray-900">{row.original.invoice_no}</span>
    ),
  },
  {
    header: "Date",
    accessorKey: "date_time",
    cell: ({ row }: any) => (
      <span className="text-gray-600">
        {new Date(row.original.date_time).toLocaleDateString()}
      </span>
    ),
  },
  {
    header: "Customer",
    accessorKey: "customer_name",
    cell: ({ row }: any) => (
      <div>
        <div className="font-medium text-gray-900">{row.original.customer_name}</div>
        <div className="text-sm text-gray-500">{row.original.customer_phone_number}</div>
      </div>
    ),
  },
  {
    header: "Product",
    accessorKey: "product.name",
    cell: ({ row }: any) => (
      <span className="text-gray-900">{row.original.product.name}</span>
    ),
  },
  {
    header: "Seller",
    accessorKey: "seller.name",
    cell: ({ row }: any) => (
      <div>
        <div className="font-medium text-gray-900">{row.original.seller.name}</div>
        <div className="text-sm text-gray-500">{row.original.seller.email}</div>
      </div>
    ),
  },
  {
    header: "Amount",
    accessorKey: "total_amount",
    cell: ({ row }: any) => (
      <span className="font-semibold text-green-600">
        ${row.original.total_amount.toFixed(2)}
      </span>
    ),
  },
  {
    header: "Payment",
    accessorKey: "payment_method",
    cell: ({ row }: any) => (
      <span className="capitalize text-gray-700">{row.original.payment_method}</span>
    ),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }: any) => {
      const status = row.original.status as "pending" | "paid" | "cancelled";
      const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        paid: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status}
        </span>
      );
    },
  },
];
