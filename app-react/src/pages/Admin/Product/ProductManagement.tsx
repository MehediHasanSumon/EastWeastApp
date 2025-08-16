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
import Toggle from "../../../components/ui/Toggle";
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
  description?: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

const ProductManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modals, setModals] = useState({
    createOrEdit: false,
    delete: false,
    view: false,
    filter: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableData, setTableData] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    sortBy: "",
    dateRange: "",
  });

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");
  const sort = searchParams.get("sort") || "";

  const [searchInput, setSearchInput] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = { 
        page, 
        perPage, 
        search: searchInput, 
        sort,
        status: filters.status || undefined,
      };
      const res = await request.get("/api/admin/get/products", { params });
      setTableData(res.data.products);
      setMeta(res.data.meta);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, perPage, sort, searchInput, filters]);

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

  const openModal = (modalType: keyof typeof modals, product?: Product) => {
    if (product) setSelectedProduct(product);
    setModals((prev) => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalType]: false }));
    if (modalType === "createOrEdit" || modalType === "view" || modalType === "delete") {
      setSelectedProduct(null);
    }
  };

  const handleCreateOrEditSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const productData = {
        name: values.name,
        purchases: parseFloat(values.purchases) || 0,
        sell: parseFloat(values.sell) || 0,
        description: values.description || null,
      };

      if (selectedProduct) {
        const res = await request.put(`/api/admin/update/product/${selectedProduct._id}`, productData);
        toastSuccess(res.data.message);
      } else {
        await request.post("/api/admin/create/product", productData);
        toastSuccess("Product created successfully");
      }
      closeModal("createOrEdit");
      fetchData();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const idsToDelete = selectedRows.length > 0 ? selectedRows : selectedProduct ? [selectedProduct._id] : [];

    if (idsToDelete.length === 0) {
      toastError("No product selected for deletion.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await request.post("/api/admin/delete/products", { ids: idsToDelete });
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
      toastError("Please select products to delete");
      return;
    }
    openModal("delete");
  };

  const handleStatusToggle = async (productId: string, status: boolean) => {
    try {
      await request.put(`/api/admin/update/product-status/${productId}`, { status });
      toastSuccess("Product status updated successfully");
      fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await request.get("/api/admin/get/products", {
        params: {
          page: 1,
          perPage: 10000, // Get all products for export
          search: searchInput,
          sort,
          status: filters.status || undefined,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toastSuccess("Products exported successfully");
    } catch (error) {
      console.error('Export error:', error);
      toastError("Failed to export products");
    }
  };

  const handleFilterApply = (newFilters: typeof filters) => {
    setFilters(newFilters);
    closeModal("filter");
    updateURLParams({ page: 1 });
  };

  const columns = getColumns({
    onEdit: (product) => openModal("createOrEdit", product),
    onDelete: (product) => {
      setSelectedProduct(product);
      openModal("delete");
    },
    onView: (product) => openModal("view", product),
    onStatusToggle: handleStatusToggle,
  });

  const getDeleteMessage = () => {
    if (selectedRows.length > 0) {
      return `You are about to delete ${selectedRows.length} product(s). This action is irreversible.`;
    }
    return selectedProduct
      ? `You are about to delete the product "${selectedProduct.name}". This action is irreversible.`
      : "";
  };

  const ProductFormController = [
    {
      label: "Product Name",
      name: "name",
      type: "text" as const,
      placeholder: "Enter product name",
      required: true,
      validation: {
        requiredMessage: "Product name is required.",
      },
    },
    {
      label: "Purchase Price",
      name: "purchases",
      type: "text" as const,
      placeholder: "Enter purchase price",
      required: true,
      validation: {
        requiredMessage: "Purchase price is required.",
      },
    },
    {
      label: "Sell Price",
      name: "sell",
      type: "text" as const,
      placeholder: "Enter sell price",
      required: true,
      validation: {
        requiredMessage: "Sell price is required.",
      },
    },
    {
      label: "Description",
      name: "description",
      type: "textarea" as const,
      placeholder: "Enter product description (optional)",
    },
  ];

  const breadcrumb = [{ label: "Dashboard", path: "/dashboard" }, { label: "Product Management" }];

  return (
    <AdminLayout breadcrumbItems={breadcrumb}>
      <Dialog
        header={selectedProduct ? "Edit Product" : "Create Product"}
        visible={modals.createOrEdit}
        onHide={() => closeModal("createOrEdit")}
      >
        <Form
          fields={ProductFormController}
          initialValues={{
            name: selectedProduct?.name || "",
            purchases: selectedProduct?.purchases?.toString() || "0",
            sell: selectedProduct?.sell?.toString() || "0",
            description: selectedProduct?.description || "",
          }}
          onSubmit={handleCreateOrEditSubmit}
          buttonText={selectedProduct ? "Update Product" : "Create Product"}
          loading={isSubmitting}
        />
      </Dialog>

      <Dialog header="View Product" visible={modals.view} onHide={() => closeModal("view")}>
        {selectedProduct && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedProduct.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purchase Price</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">${selectedProduct.purchases}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sell Price</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">${selectedProduct.sell}</p>
              </div>
            </div>
            {selectedProduct.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedProduct.description}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <div className="mt-1 flex items-center">
                <Toggle
                  id={`status-${selectedProduct._id}`}
                  checked={selectedProduct.status}
                  disabled={true}
                  aria-label={`Status for ${selectedProduct.name}`}
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {selectedProduct.status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created At</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(selectedProduct.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Updated At</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(selectedProduct.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog header="Filter Products" visible={modals.filter} onHide={() => closeModal("filter")}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="light"
              onClick={() => {
                setFilters({ status: "", sortBy: "", dateRange: "" });
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
        header="Delete Product"
        message={getDeleteMessage()}
        visible={modals.delete}
        onHide={() => closeModal("delete")}
        onConfirm={handleDelete}
      />

      <div className="py-5 mx-auto">
        <TableHeader
          title="Product Management"
          subtitle="Manage products and their details"
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
                Add Product
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

export default ProductManagement;
