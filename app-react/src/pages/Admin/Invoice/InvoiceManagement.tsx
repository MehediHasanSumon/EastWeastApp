import { useEffect, useState } from "react";
import { FiPlus, FiDownload, FiFilter } from "react-icons/fi";
import { useSearchParams } from "react-router";
import Table from "../../../components/Table";
import Button from "../../../components/ui/Button";
import DeleteDialog from "../../../components/ui/DeleteDialog";
import Dialog from "../../../components/ui/Dialog";
import Form from "../../../components/ui/Form";
import Pagination from "../../../components/ui/Pagination";
import TableFilter from "../../../components/ui/TableFilter";
import TableHeader from "../../../components/ui/TableHeader";
import type { PaginationMeta } from "../../../interface/types";
import AdminLayout from "../../../layouts/Admin/AdminLayout";
import request from "../../../service/AxiosInstance";
import { handleApiError } from "../../../utils/Api";
import { toastError, toastSuccess } from "../../../utils/Toast";
import { getColumns } from "./Column";
import { LucideCalculator } from "lucide-react";

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

const InvoiceManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modals, setModals] = useState({
    createOrEdit: false,
    delete: false,
    view: false,
    filter: false,
    statusUpdate: false,
    calculator: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableData, setTableData] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState({
    status: "",
    payment_method: "",
    startDate: "",
    endDate: "",
  });
  const [newStatus, setNewStatus] = useState<"pending" | "paid" | "cancelled">("pending");
  
  // Auto-calculation states
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [formValues, setFormValues] = useState({
    price: "",
    quantity: "",
    discount: "",
    total_amount: "",
  });
  const [selectedProductForCalc, setSelectedProductForCalc] = useState<Product | null>(null);

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");
  const sort = searchParams.get("sort") || "";

  const [searchInput, setSearchInput] = useState("");

  const fetchProducts = async () => {
    try {
      const res = await request.get("/api/admin/get/products", { params: { perPage: 1000 } });
      
      if (res.data.status && res.data.products) {
        setProducts(res.data.products);
      } else {
        toastError("Failed to fetch products");
        setProducts([]);
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        toastError(error.response.data.message);
      } else {
        toastError("Failed to fetch products");
      }
      setProducts([]);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = { 
        page, 
        perPage, 
        search: searchInput, 
        sort,
        status: filters.status || undefined,
        payment_method: filters.payment_method || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      
      const res = await request.get("/api/admin/get/invoices", { params });
      
      if (res.data.status && res.data.invoices) {
        setTableData(res.data.invoices);
        setMeta(res.data.meta);
      } else {
        toastError("Invalid response from server");
        setTableData([]);
        setMeta(null);
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      if (error.response?.status === 401) {
        toastError("Authentication failed. Please login again.");
      } else if (error.response?.data?.message) {
        toastError(error.response.data.message);
      } else if (error.message) {
        toastError(error.message);
      } else {
        toastError("Failed to fetch invoices");
      }
      setTableData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProducts();
  }, [page, perPage, sort, searchInput, filters]);

  // Refetch data when modals are closed
  useEffect(() => {
    if (!modals.createOrEdit && !modals.delete && !modals.statusUpdate) {
      // Small delay to ensure backend operations are complete
      const timer = setTimeout(() => {
        fetchData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [modals.createOrEdit, modals.delete, modals.statusUpdate]);

  const updateURLParams = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => updateURLParams({ page: newPage });
  const handlePerPageChange = (value: number) => updateURLParams({ perPage: value, page: 1 });
  const handleSortChange = (value: string) => updateURLParams({ sort: value, page: 1 });

  const openModal = (modalType: keyof typeof modals, invoice?: Invoice) => {
    if (invoice) setSelectedInvoice(invoice);
    setModals((prev) => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalType]: false }));
    if (modalType === "createOrEdit" || modalType === "view" || modalType === "delete" || modalType === "statusUpdate" || modalType === "calculator") {
      setSelectedInvoice(null);
      setSelectedProductForCalc(null);
      setFormValues({ price: "", quantity: "", discount: "", total_amount: "" });
    }
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
  };

  // Auto-calculation functions
  const calculateTotal = (price: string, quantity: string, discount: string) => {
    const priceNum = parseFloat(price) || 0;
    const quantityNum = parseFloat(quantity) || 0;
    const discountNum = parseFloat(discount) || 0;
    return (priceNum * quantityNum - discountNum).toFixed(2);
  };

  const calculateProfitMargin = (price: string, quantity: string, product: Product) => {
    const priceNum = parseFloat(price) || 0;
    const quantityNum = parseFloat(quantity) || 0;
    const purchasePrice = product.purchases;
    const profit = (priceNum - purchasePrice) * quantityNum;
    const profitPercentage = purchasePrice > 0 ? (profit / (purchasePrice * quantityNum)) * 100 : 0;
    return {
      profit: profit.toFixed(2),
      percentage: profitPercentage.toFixed(2)
    };
  };

  const handleFormValueChange = (field: string, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    
    if (autoCalculate && (field === 'price' || field === 'quantity' || field === 'discount')) {
      const newValues = { ...formValues, [field]: value };
      const total = calculateTotal(newValues.price, newValues.quantity, newValues.discount);
      setFormValues(prev => ({ ...prev, [field]: value, total_amount: total }));
    }
  };

  const handleProductSelection = (productId: string) => {
    const product = products.find(p => p._id === productId);
    setSelectedProductForCalc(product || null);
    
    if (product && autoCalculate) {
      setFormValues(prev => ({ 
        ...prev, 
        price: product.sell.toString(),
        total_amount: calculateTotal(product.sell.toString(), prev.quantity, prev.discount)
      }));
    }
  };

  const handleCreateOrEditSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      // Parse and validate the date
      let parsedDate;
      try {
        // Handle both ISO string and custom format
        if (values.date_time.includes('T')) {
          parsedDate = new Date(values.date_time);
        } else {
          // Parse custom format: "YYYY-MM-DD HH:MM"
          const [datePart, timePart] = values.date_time.split(' ');
          const [year, month, day] = datePart.split('-');
          const [hour, minute] = timePart.split(':');
          parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        }
        
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (dateError) {
        toastError("Invalid date format. Please use YYYY-MM-DD HH:MM format.");
        setIsSubmitting(false);
        return;
      }

      const invoiceData = {
        invoice_no: values.invoice_no,
        date_time: parsedDate,
        vehicle_no: values.vehicle_no || null,
        customer_name: values.customer_name,
        customer_phone_number: values.customer_phone_number,
        payment_method: values.payment_method,
        product: values.product,
        price: parseFloat(values.price),
        quantity: parseInt(values.quantity),
        total_amount: parseFloat(values.total_amount),
        discount: parseFloat(values.discount) || 0,
        is_sent_sms: values.is_sent_sms || false,
        status: values.status,
      };

      if (selectedInvoice) {
        const res = await request.put(`/api/admin/update/invoice/${selectedInvoice._id}`, invoiceData);
        toastSuccess(res.data.message || "Invoice updated successfully");
      } else {
        const res = await request.post("/api/admin/create/invoice", invoiceData);
        toastSuccess(res.data.message || "Invoice created successfully");
      }
      closeModal("createOrEdit");
      fetchData();
    } catch (error: any) {
      console.error('Invoice operation error:', error);
      if (error.response?.data?.message) {
        toastError(error.response.data.message);
      } else if (error.message) {
        toastError(error.message);
      } else {
        toastError("An error occurred while processing the invoice");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const idsToDelete = selectedRows.length > 0 ? selectedRows : selectedInvoice ? [selectedInvoice._id] : [];

    if (idsToDelete.length === 0) {
      toastError("No invoice selected for deletion.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await request.post("/api/admin/delete/invoices", { ids: idsToDelete });
      toastSuccess(res.data.message);
      closeModal("delete");
      setSelectedRows([]);
      fetchData();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      toastError("Please select invoices to delete");
      return;
    }
    openModal("delete");
  };

  const handleStatusUpdate = async () => {
    if (!selectedInvoice) return;
    
    setIsSubmitting(true);
    try {
      await request.put(`/api/admin/update/invoice-status/${selectedInvoice._id}`, {
        status: newStatus,
      });
      toastSuccess("Invoice status updated successfully");
      closeModal("statusUpdate");
      fetchData();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await request.get("/api/admin/get/invoices", {
        params: {
          page: 1,
          perPage: 10000, // Get all invoices for export
          search: searchInput,
          sort,
          status: filters.status || undefined,
          payment_method: filters.payment_method || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoices-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toastSuccess("Invoices exported successfully");
    } catch (error) {
      console.error('Export error:', error);
      toastError("Failed to export invoices");
    }
  };

  const handleFilterApply = (newFilters: typeof filters) => {
    setFilters(newFilters);
    closeModal("filter");
    updateURLParams({ page: 1 });
  };

  const columns = getColumns({
    onEdit: (invoice) => openModal("createOrEdit", invoice),
    onDelete: (invoice) => {
      setSelectedInvoice(invoice);
      openModal("delete");
    },
    onView: (invoice) => openModal("view", invoice),
  });

  const getDeleteMessage = () => {
    if (selectedRows.length > 0) {
      return `You are about to delete ${selectedRows.length} invoice(s). This action is irreversible.`;
    }
    return selectedInvoice
      ? `You are about to delete the invoice "${selectedInvoice.invoice_no}". This action is irreversible.`
      : "";
  };

  const InvoiceFormController = [
    {
      label: "Invoice Number",
      name: "invoice_no",
      type: "text" as const,
      placeholder: "Enter invoice number",
      required: true,
      validation: {
        requiredMessage: "Invoice number is required.",
      },
    },
    {
      label: "Date & Time",
      name: "date_time",
      type: "text" as const,
      placeholder: "YYYY-MM-DD HH:MM (e.g., 2024-01-15 14:30)",
      required: true,
      validation: {
        requiredMessage: "Date and time are required.",
        pattern: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
        message: "Please use format: YYYY-MM-DD HH:MM",
      },
    },
    {
      label: "Vehicle Number",
      name: "vehicle_no",
      type: "text" as const,
      placeholder: "Enter vehicle number (optional)",
    },
    {
      label: "Customer Name",
      name: "customer_name",
      type: "text" as const,
      placeholder: "Enter customer name",
      required: true,
      validation: {
        requiredMessage: "Customer name is required.",
      },
    },
    {
      label: "Customer Phone",
      name: "customer_phone_number",
      type: "text" as const,
      placeholder: "Enter customer phone number",
      required: true,
      validation: {
        requiredMessage: "Customer phone number is required.",
      },
    },
    {
      label: "Payment Method",
      name: "payment_method",
      type: "select" as const,
      required: true,
      options: [
        { value: "cash", label: "Cash" },
        { value: "card", label: "Card" },
        { value: "bank_transfer", label: "Bank Transfer" },
        { value: "credit", label: "Credit" },
        { value: "due", label: "Due" },
      ],
      validation: {
        requiredMessage: "Payment method is required.",
      },
    },
    {
      label: "Product",
      name: "product",
      type: "select" as const,
      required: true,
      options: products.map((product) => ({ value: product._id, label: product.name })),
      validation: {
        requiredMessage: "Product is required.",
      },
    },
    {
      label: "Price",
      name: "price",
      type: "text" as const,
      placeholder: "Enter price",
      required: true,
      validation: {
        requiredMessage: "Price is required.",
      },
    },
    {
      label: "Quantity",
      name: "quantity",
      type: "text" as const,
      placeholder: "Enter quantity",
      required: true,
      validation: {
        requiredMessage: "Quantity is required.",
      },
    },
    {
      label: "Total Amount",
      name: "total_amount",
      type: "text" as const,
      placeholder: "Enter total amount",
      required: true,
      validation: {
        requiredMessage: "Total amount is required.",
      },
    },
    {
      label: "Discount",
      name: "discount",
      type: "text" as const,
      placeholder: "Enter discount (optional)",
    },
    {
      label: "Status",
      name: "status",
      type: "select" as const,
      required: true,
      options: [
        { value: "pending", label: "Pending" },
        { value: "paid", label: "Paid" },
        { value: "cancelled", label: "Cancelled" },
      ],
      validation: {
        requiredMessage: "Status is required.",
      },
    },
    {
      label: "Send SMS",
      name: "is_sent_sms",
      type: "checkbox" as const,
    },
  ];

  const breadcrumb = [{ label: "Dashboard", path: "/dashboard" }, { label: "Invoice Management" }];

  return (
    <AdminLayout breadcrumbItems={breadcrumb}>
      <Dialog
        header={selectedInvoice ? "Edit Invoice" : "Create Invoice"}
        visible={modals.createOrEdit}
        onHide={() => closeModal("createOrEdit")}
      >
        <Form
          fields={InvoiceFormController}
          initialValues={{
            invoice_no: selectedInvoice?.invoice_no || generateInvoiceNumber(),
            date_time: selectedInvoice?.date_time 
              ? new Date(selectedInvoice.date_time).toISOString().slice(0, 16).replace('T', ' ')
              : new Date().toISOString().slice(0, 16).replace('T', ' '),
            vehicle_no: selectedInvoice?.vehicle_no || "",
            customer_name: selectedInvoice?.customer_name || "",
            customer_phone_number: selectedInvoice?.customer_phone_number || "",
            payment_method: selectedInvoice?.payment_method || "cash",
            product: selectedInvoice?.product._id || "",
            price: selectedInvoice?.price?.toString() || "",
            quantity: selectedInvoice?.quantity?.toString() || "",
            total_amount: selectedInvoice?.total_amount?.toString() || "",
            discount: selectedInvoice?.discount?.toString() || "0",
            status: selectedInvoice?.status || "pending",
            is_sent_sms: selectedInvoice?.is_sent_sms || false,
          }}
          onSubmit={handleCreateOrEditSubmit}
          buttonText={selectedInvoice ? "Update Invoice" : "Create Invoice"}
          loading={isSubmitting}
        />
      </Dialog>

      <Dialog header="View Invoice" visible={modals.view} onHide={() => closeModal("view")}>
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Number</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedInvoice.invoice_no}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date & Time</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(selectedInvoice.date_time).toLocaleString()}
                </p>
              </div>
            </div>
            {selectedInvoice.vehicle_no && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Number</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedInvoice.vehicle_no}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedInvoice.customer_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Phone</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedInvoice.customer_phone_number}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">{selectedInvoice.payment_method}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">{selectedInvoice.status}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedInvoice.product.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seller Name</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedInvoice.seller.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seller Email</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedInvoice.seller.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">${selectedInvoice.price}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedInvoice.quantity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">${selectedInvoice.total_amount}</p>
              </div>
            </div>
            {selectedInvoice.discount > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">${selectedInvoice.discount}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profit Margin</label>
              <p className="mt-1 text-sm text-green-600 font-semibold">
                {((selectedInvoice.price - selectedInvoice.product.purchases) / selectedInvoice.product.purchases * 100).toFixed(2)}% 
                (${((selectedInvoice.price - selectedInvoice.product.purchases) * selectedInvoice.quantity).toFixed(2)})
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SMS Sent</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {selectedInvoice.is_sent_sms ? "Yes" : "No"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created At</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(selectedInvoice.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Updated At</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(selectedInvoice.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Calculator Modal */}
      <Dialog header="Invoice Calculator" visible={modals.calculator} onHide={() => closeModal("calculator")}>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="autoCalculate"
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoCalculate" className="text-sm font-medium text-gray-700">
              Auto-calculate totals
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select
              onChange={(e) => handleProductSelection(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} - ${product.sell}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                value={formValues.price}
                onChange={(e) => handleFormValueChange('price', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={formValues.quantity}
                onChange={(e) => handleFormValueChange('quantity', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="0"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
              <input
                type="number"
                value={formValues.discount}
                onChange={(e) => handleFormValueChange('discount', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="number"
                value={formValues.total_amount}
                onChange={(e) => handleFormValueChange('total_amount', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none bg-gray-50"
                placeholder="0.00"
                step="0.01"
                readOnly={autoCalculate}
              />
            </div>
          </div>

          {selectedProductForCalc && formValues.price && formValues.quantity && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <h4 className="font-medium text-green-800 mb-2">Profit Analysis</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Purchase Price:</span>
                  <span>${selectedProductForCalc.purchases}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sell Price:</span>
                  <span>${formValues.price}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit per Unit:</span>
                  <span className="text-green-600">${(parseFloat(formValues.price) - selectedProductForCalc.purchases).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Profit:</span>
                  <span className="text-green-600 font-semibold">
                    ${((parseFloat(formValues.price) - selectedProductForCalc.purchases) * parseFloat(formValues.quantity)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Margin:</span>
                  <span className="text-green-600 font-semibold">
                    {((parseFloat(formValues.price) - selectedProductForCalc.purchases) / selectedProductForCalc.purchases * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="light" onClick={() => closeModal("calculator")}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog header="Update Invoice Status" visible={modals.statusUpdate} onHide={() => closeModal("statusUpdate")}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as "pending" | "paid" | "cancelled")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="light" onClick={() => closeModal("statusUpdate")}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog header="Filter Invoices" visible={modals.filter} onHide={() => closeModal("filter")}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
            <select
              value={filters.payment_method}
              onChange={(e) => setFilters(prev => ({ ...prev, payment_method: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit">Credit</option>
              <option value="due">Due</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="light"
              onClick={() => {
                setFilters({ status: "", payment_method: "", startDate: "", endDate: "" });
                closeModal("filter");
              }}
            >
              Clear
            </Button>
            <Button onClick={() => handleFilterApply(filters)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Dialog>

      <DeleteDialog
        header="Delete Invoice"
        message={getDeleteMessage()}
        visible={modals.delete}
        onHide={() => closeModal("delete")}
        onConfirm={handleDelete}
      />

      <div className="py-5 mx-auto">
        <TableHeader
          title="Invoice Management"
          subtitle="Manage invoices and their details"
          actions={
            <div className="flex space-x-2">
              <Button variant="light" onClick={() => openModal("calculator")}>
                <LucideCalculator className="mr-2" />
                Calculator
              </Button>
              <Button variant="light" onClick={() => openModal("filter")}>
                <FiFilter className="mr-2" />
                Filter
              </Button>
              <Button variant="light" onClick={handleExport}>
                <FiDownload className="mr-2" />
                Export
              </Button>
              <Button onClick={() => openModal("createOrEdit")}>
                <FiPlus className="mr-2" />
                Add Invoice
              </Button>
            </div>
          }
        />

        <TableFilter
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          sortValue={sort}
          onSortChange={handleSortChange}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
          onDelete={selectedRows.length > 0 ? handleBulkDelete : undefined}
          selectedCount={selectedRows.length}
        />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table
            columns={columns}
            data={tableData}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            isLoading={isLoading}
          />
          {meta && <Pagination meta={meta} onPageChange={handlePageChange} />}
        </div>
      </div>
    </AdminLayout>
  );
};

export default InvoiceManagement;
