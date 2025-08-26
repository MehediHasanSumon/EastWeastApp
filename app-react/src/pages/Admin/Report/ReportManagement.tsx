import { useEffect, useState } from "react";
import { FiDownload, FiFilter, FiFileText, FiBarChart, FiTrendingUp, FiDollarSign, FiShoppingCart } from "react-icons/fi";
import { useSearchParams } from "react-router";
import Table from "../../../components/Table";
import Button from "../../../components/ui/Button";
import Dialog from "../../../components/ui/Dialog";
import Pagination from "../../../components/ui/Pagination";
import TableFilter from "../../../components/ui/TableFilter";
import TableHeader from "../../../components/ui/TableHeader";
import type { PaginationMeta } from "../../../interface/types";
import AdminLayout from "../../../layouts/Admin/AdminLayout";
import request from "../../../service/AxiosInstance";
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

interface ReportStats {
  totalInvoices: number;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  topProducts: Array<{
    product: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethodStats: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  dailyStats: Array<{
    date: string;
    invoices: number;
    revenue: number;
    profit: number;
  }>;
}

const ReportManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modals, setModals] = useState({
    filter: false,
    export: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [tableData, setTableData] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [filters, setFilters] = useState({
    payment_method: "",
    startDate: "",
    endDate: "",
    product: "",
    customer: "",
    minAmount: "",
    maxAmount: "",
  });
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("excel");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "quarter" | "year" | "custom">("month");

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "20");
  const sort = searchParams.get("sort") || "";

  const [searchInput, setSearchInput] = useState("");

  // Initialize filters with current month
  useEffect(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    setFilters(prev => ({
      ...prev,
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    }));
  }, []);



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
        product: filters.product || undefined,
        customer: filters.customer || undefined,
        minAmount: filters.minAmount || undefined,
        maxAmount: filters.maxAmount || undefined,
      };
      
      // Check if token is available
      const token = localStorage.getItem('rt') || document.cookie.split('; ').find(row => row.startsWith('rt='))?.split('=')[1];
      
      const res = await request.get("/api/admin/reports/detailed", { params });
      
      if (res.data.status && res.data.invoices) {
        setTableData(res.data.invoices);
        setMeta(res.data.meta);
      } else {
        console.error("Invalid response structure:", res.data);
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

  const fetchStats = async () => {
    try {
      const params = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        payment_method: filters.payment_method || undefined,
      };
      
      const res = await request.get("/api/admin/reports/stats", { params });
      
      if (res.data.status && res.data.totalInvoices !== undefined) {
        setStats(res.data);
      } else {
        console.error("Invalid stats response structure:", res.data);
        setStats(null);
      }
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      if (error.response?.status === 401) {
        toastError("Authentication failed. Please login again.");
      } else if (error.response?.data?.message) {
        toastError(error.response.data.message);
      } else {
        toastError("Failed to fetch statistics");
      }
      setStats(null);
    }
  };

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [page, perPage, sort, searchInput]);

  // Separate useEffect for filters to avoid infinite loops
  useEffect(() => {
    if (filters.startDate || filters.endDate || filters.payment_method || filters.customer || filters.minAmount || filters.maxAmount) {
      fetchData();
      fetchStats();
    }
  }, [filters]);

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

  const openModal = (modalType: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalType]: false }));
  };

  const handleFilterApply = (newFilters: typeof filters) => {
    setFilters(newFilters);
    closeModal("filter");
    updateURLParams({ page: 1 });
  };

  const handleDateRangeChange = (range: typeof dateRange) => {
    setDateRange(range);
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom":
        return; // Don't change dates for custom
    }
    
    const newFilters = {
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
    
    setFilters(newFilters);
    
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
              const params = {
          format: exportFormat,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          payment_method: filters.payment_method || undefined,
          product: filters.product || undefined,
          customer: filters.customer || undefined,
          minAmount: filters.minAmount || undefined,
          maxAmount: filters.maxAmount || undefined,
        };
      
      const response = await request.get("/api/admin/reports/export", {
        params,
        responseType: 'blob',
      });

      // Check if response is valid
      if (response.data && response.data.size > 0) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileName = `invoice-report-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toastSuccess(`${exportFormat.toUpperCase()} report exported successfully`);
        closeModal("export");
      } else {
        throw new Error("Invalid export response");
      }
    } catch (error: any) {
      console.error('Export error:', error);
      if (error.response?.status === 401) {
        toastError("Authentication failed. Please login again.");
      } else if (error.response?.data?.message) {
        toastError(error.response.data.message);
      } else if (error.message) {
        toastError(error.message);
      } else {
        toastError(`Failed to export ${exportFormat.toUpperCase()} report`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  

  const breadcrumb = [{ label: "Dashboard", path: "/dashboard" }, { label: "Report Management" }];

  return (
    <AdminLayout breadcrumbItems={breadcrumb}>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalInvoices}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiDollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiTrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Profit</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.totalProfit.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                                 <FiBarChart className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.averageOrderValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Quick Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {(["today", "week", "month", "quarter", "year", "custom"] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "light"}
              onClick={() => handleDateRangeChange(range)}
              className="text-sm"
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Filter Modal */}
      <Dialog header="Advanced Filter" visible={modals.filter} onHide={() => closeModal("filter")}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={filters.payment_method}
              onChange={(e) => setFilters(prev => ({ ...prev, payment_method: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit">Credit</option>
              <option value="due">Due</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Search</label>
            <input
              type="text"
              value={filters.customer}
              onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
              placeholder="Search by customer name or phone"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                placeholder="0.00"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                placeholder="0.00"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="light"
              onClick={() => {
                setFilters({
                  payment_method: "",
                  startDate: "",
                  endDate: "",
                  product: "",
                  customer: "",
                  minAmount: "",
                  maxAmount: "",
                });
                closeModal("filter");
              }}
            >
              Clear All
            </Button>
            <Button onClick={() => handleFilterApply(filters)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Export Modal */}
      <Dialog header="Export Report" visible={modals.export} onHide={() => closeModal("export")}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="excel"
                  checked={exportFormat === "excel"}
                  onChange={(e) => setExportFormat(e.target.value as "excel")}
                  className="mr-2"
                />
                <FiFileText className="mr-2 text-green-600" />
                Excel (.xlsx)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === "pdf"}
                  onChange={(e) => setExportFormat(e.target.value as "pdf")}
                  className="mr-2"
                />
                <FiFileText className="mr-2 text-red-600" />
                PDF (.pdf)
              </label>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">Export will include:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Invoice details and customer information</li>
              <li>• Product details and pricing</li>
              <li>• Payment method and status</li>
              <li>• Date range: {filters.startDate || 'All'} to {filters.endDate || 'All'}</li>
              <li>• Applied filters: {Object.values(filters).filter(Boolean).length} active</li>
            </ul>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="light" onClick={() => closeModal("export")}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? "Exporting..." : `Export ${exportFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </Dialog>

      <div className="py-5 mx-auto">
        <TableHeader
          title="Invoice Reports"
          subtitle="Comprehensive invoice analytics and reporting"
          actions={
            <div className="flex space-x-2">

              <Button variant="light" onClick={() => openModal("filter")}>
                <FiFilter className="mr-2" />
                Advanced Filter
              </Button>
              <Button variant="light" onClick={() => openModal("export")}>
                <FiDownload className="mr-2" />
                Export Report
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
        />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

          <Table
            columns={getColumns()}
            data={tableData || []}
            isLoading={isLoading}
          />
          {meta && <Pagination meta={meta} onPageChange={handlePageChange} />}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportManagement;
