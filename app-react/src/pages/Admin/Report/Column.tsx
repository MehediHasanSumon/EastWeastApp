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
  profit?: number;
  profitMargin?: number;
  calculatedTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export const getColumns = (): Column<Invoice>[] => [
  {
    header: "Invoice No",
    accessor: "invoice_no",
    cell: (row: Invoice) => {
      if (!row || typeof row !== 'object') return <span className="text-gray-400">N/A</span>;
      if (!row.invoice_no) return <span className="text-gray-400">N/A</span>;
      return (
        <span className="font-medium text-gray-900">{row.invoice_no}</span>
      );
    },
  },
  {
    header: "Date",
    accessor: "date_time",
    cell: (row: Invoice) => {
      if (!row || typeof row !== 'object') return <span className="text-gray-400">N/A</span>;
      if (!row.date_time) return <span className="text-gray-400">N/A</span>;
      return (
        <span className="text-gray-600">
          {new Date(row.date_time).toLocaleDateString()}
        </span>
      );
    },
  },
  {
    header: "Customer",
    accessor: "customer_name",
    cell: (row: Invoice) => {
      if (!row) return <span className="text-gray-400">N/A</span>;
      return (
        <div>
          <div className="font-medium text-gray-900">{row.customer_name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.customer_phone_number || 'N/A'}</div>
        </div>
      );
    },
  },
  {
    header: "Product",
    accessor: "product.name",
    cell: (row: Invoice) => {
      if (!row?.product?.name) return <span className="text-gray-400">N/A</span>;
      return (
        <span className="text-gray-900">{row.product.name}</span>
      );
    },
  },
  {
    header: "Seller",
    accessor: "seller.name",
    cell: (row: Invoice) => {
      if (!row?.seller?.name) return <span className="text-gray-400">N/A</span>;
      return (
        <div>
          <div className="font-medium text-gray-900">{row.seller.name}</div>
          <div className="text-sm text-gray-500">{row.seller.email}</div>
        </div>
      );
    },
  },
  {
    header: "Amount",
    accessor: "total_amount",
    cell: (row: Invoice) => {
      if (!row?.total_amount) return <span className="text-gray-400">N/A</span>;
      return (
        <span className="font-semibold text-gray-600">
          ৳{row.total_amount.toFixed(2)}
        </span>
      );
    },
  },
  {
    header: "Payment",
    accessor: "payment_method",
    cell: (row: Invoice) => {
      if (!row?.payment_method) return <span className="text-gray-400">N/A</span>;
      return (
        <span className="capitalize text-gray-700">{row.payment_method}</span>
      );
    },
  },
];
