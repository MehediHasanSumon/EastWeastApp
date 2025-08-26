import { useEffect, useState } from "react";
import { FiPlus, FiDownload, FiFilter } from "react-icons/fi";
import { useSearchParams } from "react-router";
import Table from "../../../components/Table";
import Button from "../../../components/ui/Button";
import DeleteDialog from "../../../components/ui/DeleteDialog";
import Dialog from "../../../components/ui/Dialog";
import Pagination from "../../../components/ui/Pagination";
import TableFilter from "../../../components/ui/TableFilter";
import TableHeader from "../../../components/ui/TableHeader";
import type { PaginationMeta } from "../../../interface/types";
import AdminLayout from "../../../layouts/Admin/AdminLayout";
import request from "../../../service/AxiosInstance";
import { handleApiError } from "../../../utils/Api";
import { toastError, toastSuccess } from "../../../utils/Toast";
import { getColumns } from "./Column";


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

const InvoiceManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modals, setModals] = useState({
    createOrEdit: false,
    delete: false,
    view: false,
    filter: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableData, setTableData] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState({
    payment_method: "",
    startDate: "",
    endDate: "",
  });



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
    if (!modals.createOrEdit && !modals.delete) {
      // Small delay to ensure backend operations are complete
      const timer = setTimeout(() => {
        fetchData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [modals.createOrEdit, modals.delete]);

  // Update form values when editing an invoice
  useEffect(() => {
    if (selectedInvoice) {
      setFormValues({
        price: selectedInvoice.price.toString(),
        quantity: selectedInvoice.quantity.toString(),
        discount: selectedInvoice.discount.toString(),
        total_amount: selectedInvoice.total_amount.toString(),
      });
      setSelectedProductId(selectedInvoice.product._id);
    } else {
      // Reset form values for new invoice
      setFormValues({
        price: "",
        quantity: "1",
        discount: "0",
        total_amount: "",
      });
      setSelectedProductId("");
    }
  }, [selectedInvoice]);

  // Auto-calculation state
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [formValues, setFormValues] = useState({
    price: "",
    quantity: "",
    discount: "",
    total_amount: "",
  });
  const [selectedProductForCalc, setSelectedProductForCalc] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Watch for product selection changes and auto-fill price
  useEffect(() => {
    if (selectedProductId && autoCalculate) {
      const product = products.find(p => p._id === selectedProductId);
      if (product) {
        setSelectedProductForCalc(product);
        const newFormValues = {
          price: product.sell.toString(),
          quantity: formValues.quantity || "1",
          discount: formValues.discount || "0",
          total_amount: calculateTotal(product.sell.toString(), formValues.quantity || "1", formValues.discount || "0").toString()
        };
        setFormValues(newFormValues);
      }
    }
  }, [selectedProductId, autoCalculate, products]);

  // Watch for form value changes and update selectedProductId
  useEffect(() => {
    if (formValues.price && !selectedProductId) {
      // If price is set but no product is selected, try to find matching product
      const matchingProduct = products.find(p => p.sell.toString() === formValues.price);
      if (matchingProduct) {
        setSelectedProductId(matchingProduct._id);
        setSelectedProductForCalc(matchingProduct);
      }
    }
  }, [formValues.price, selectedProductId, products]);

  // Debug: Log formValues changes
  useEffect(() => {
    console.log('formValues changed:', formValues);
  }, [formValues]);

  // Watch for product selection and update formValues for Form component
  useEffect(() => {
    if (selectedProductId && !selectedInvoice) {
      // Only update for new invoices, not when editing
      const product = products.find(p => p._id === selectedProductId);
      if (product) {
        const newFormValues = {
          price: product.sell.toString(),
          quantity: "1",
          discount: "0",
          total_amount: product.sell.toString()
        };
        setFormValues(newFormValues);
      }
    }
  }, [selectedProductId, products, selectedInvoice]);

  // Handle product selection change
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    if (productId && autoCalculate) {
      const product = products.find(p => p._id === productId);
      if (product) {
        setSelectedProductForCalc(product);
        const newFormValues = {
          price: product.sell.toString(),
          quantity: formValues.quantity || "1",
          discount: formValues.discount || "0",
          total_amount: calculateTotal(product.sell.toString(), formValues.quantity || "1", formValues.discount || "0").toString()
        };
        setFormValues(newFormValues);
      }
    }
  };

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
    if (modalType === "createOrEdit" || modalType === "view" || modalType === "delete") {
      setSelectedInvoice(null);
      setSelectedProductForCalc(null);
      setSelectedProductId("");
      setFormValues({
        price: "",
        quantity: "",
        discount: "",
        total_amount: "",
      });
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
    // Use Math.round to avoid floating point precision issues, similar to Android app
    return Math.round((priceNum * quantityNum - discountNum) * 100) / 100;
  };

  // Enhanced validation function similar to Android app
  const validateInvoiceData = (values: Record<string, any>) => {
    const priceNum = parseFloat(values.price) || 0;
    const quantityNum = parseInt(values.quantity) || 0;
    const discountNum = parseFloat(values.discount) || 0;

    if (priceNum <= 0) {
      toastError("Price must be greater than 0");
      return false;
    }

    if (quantityNum <= 0) {
      toastError("Quantity must be greater than 0");
      return false;
    }

    if (discountNum < 0) {
      toastError("Discount cannot be negative");
      return false;
    }

    // Check if discount is greater than subtotal (before discount)
    const subtotal = priceNum * quantityNum;
    if (discountNum > subtotal) {
      toastError("Discount cannot be greater than subtotal amount");
      return false;
    }

    return true;
  };

  const handleCreateOrEditSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      // Validate invoice data before submission
      if (!validateInvoiceData(values)) {
        setIsSubmitting(false);
        return;
      }

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

      // Recalculate total amount to ensure it's correct before submission
      const priceNum = parseFloat(values.price);
      const quantityNum = parseInt(values.quantity);
      const discountNum = parseFloat(values.discount) || 0;
      const calculatedTotal = calculateTotal(values.price, values.quantity, values.discount);

      const invoiceData = {
        invoice_no: values.invoice_no,
        date_time: parsedDate,
        vehicle_no: values.vehicle_no || null,
        customer_name: values.customer_name,
        customer_phone_number: values.customer_phone_number,
        payment_method: values.payment_method,
        product: values.product,
        price: priceNum,
        quantity: quantityNum,
        total_amount: calculatedTotal,
        discount: discountNum,
        is_sent_sms: values.is_sent_sms || false,
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



  const handleExport = async () => {
    try {
      const response = await request.get("/api/admin/get/invoices", {
        params: {
          page: 1,
          perPage: 10000, // Get all invoices for export
          search: searchInput,
          sort,
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

  const breadcrumb = [{ label: "Dashboard", path: "/dashboard" }, { label: "Invoice Management" }];

  return (
    <AdminLayout breadcrumbItems={breadcrumb}>
      <Dialog
        header={selectedInvoice ? "Edit Invoice" : "Create Invoice"}
        visible={modals.createOrEdit}
        onHide={() => closeModal("createOrEdit")}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const values = Object.fromEntries(formData.entries());
          
          // Ensure all required fields are present
          const completeValues = {
            ...values,
            product: selectedProductId || values.product,
            price: formValues.price || values.price,
            quantity: formValues.quantity || values.quantity,
            discount: formValues.discount || values.discount,
            total_amount: formValues.total_amount || values.total_amount,
            is_sent_sms: values.is_sent_sms === 'on'
          };
          
          handleCreateOrEditSubmit(completeValues);
        }} className="space-y-6">
          {/* Invoice Number */}
          <div className="space-y-2">
            <label htmlFor="invoice_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Invoice Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="invoice_no"
              name="invoice_no"
              defaultValue={selectedInvoice?.invoice_no || generateInvoiceNumber()}
              placeholder="Enter invoice number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <label htmlFor="date_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="date_time"
              name="date_time"
              defaultValue={selectedInvoice?.date_time
                ? new Date(selectedInvoice.date_time).toISOString().slice(0, 16).replace('T', ' ')
                : new Date().toISOString().slice(0, 16).replace('T', ' ')}
              placeholder="YYYY-MM-DD HH:MM (e.g., 2024-01-15 14:30)"
              required
              pattern="^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Vehicle Number */}
          <div className="space-y-2">
            <label htmlFor="vehicle_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Vehicle Number
            </label>
            <input
              type="text"
              id="vehicle_no"
              name="vehicle_no"
              defaultValue={selectedInvoice?.vehicle_no || ""}
              placeholder="Enter vehicle number (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Customer Name */}
          <div className="space-y-2">
            <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="customer_name"
              name="customer_name"
              defaultValue={selectedInvoice?.customer_name || ""}
              placeholder="Enter customer name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Customer Phone */}
          <div className="space-y-2">
            <label htmlFor="customer_phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Customer Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="customer_phone_number"
              name="customer_phone_number"
              defaultValue={selectedInvoice?.customer_phone_number || ""}
              placeholder="Enter customer phone number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              id="payment_method"
              name="payment_method"
              defaultValue={selectedInvoice?.payment_method || "cash"}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit">Credit</option>
              <option value="due">Due</option>
            </select>
          </div>

          {/* Product */}
          <div className="space-y-2">
            <label htmlFor="product" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              id="product"
              name="product"
              value={selectedProductId || selectedInvoice?.product._id || ""}
              onChange={(e) => handleProductChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} - ${product.sell}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formValues.price || selectedInvoice?.price?.toString() || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormValues(prev => ({
                  ...prev,
                  price: value,
                  total_amount: calculateTotal(value, prev.quantity || "1", prev.discount || "0").toString()
                }));
              }}
              placeholder="Enter price"
              required
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formValues.quantity || selectedInvoice?.quantity?.toString() || "1"}
              onChange={(e) => {
                const value = e.target.value;
                setFormValues(prev => ({
                  ...prev,
                  quantity: value,
                  total_amount: calculateTotal(prev.price || "0", value, prev.discount || "0").toString()
                }));
              }}
              placeholder="Enter quantity"
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="total_amount"
              name="total_amount"
              value={formValues.total_amount || selectedInvoice?.total_amount?.toString() || "0.00"}
              placeholder="Auto-calculated"
              required
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-600 dark:border-gray-600 dark:text-white cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Formula: (Price × Quantity) - Discount</p>
          </div>

          {/* Discount */}
          <div className="space-y-2">
            <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Discount
            </label>
            <input
              type="number"
              id="discount"
              name="discount"
              value={formValues.discount || selectedInvoice?.discount?.toString() || "0"}
              onChange={(e) => {
                const value = e.target.value;
                setFormValues(prev => ({
                  ...prev,
                  discount: value,
                  total_amount: calculateTotal(prev.price || "0", prev.quantity || "1", value).toString()
                }));
              }}
              placeholder="Enter discount (optional)"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Send SMS */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_sent_sms"
              name="is_sent_sms"
              defaultChecked={selectedInvoice?.is_sent_sms || false}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_sent_sms" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Send SMS
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => closeModal("createOrEdit")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                selectedInvoice ? "Update Invoice" : "Create Invoice"
              )}
            </button>
          </div>
        </form>
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
      <Dialog header="Filter Invoices" visible={modals.filter} onHide={() => closeModal("filter")}>
        <div className="space-y-4">
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
                setFilters({ payment_method: "", startDate: "", endDate: "" });
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