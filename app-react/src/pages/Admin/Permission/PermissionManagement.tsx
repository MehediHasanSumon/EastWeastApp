import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
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
import { PermissionFormController } from "../../../utils/FormController/FormController";
import { toastError, toastSuccess } from "../../../utils/Toast";
import { getColumns } from "./Column";

interface Permission {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const PermissionManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modals, setModals] = useState({
    createOrEdit: false,
    delete: false,
    view: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableData, setTableData] = useState<Permission[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");
  const sort = searchParams.get("sort") || "";

  const [searchInput, setSearchInput] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = { page, perPage, search: searchInput, sort };
      const res = await request.get("/api/admin/get/permissions", { params });
      setTableData(res.data.permissions);
      setMeta(res.data.meta);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, perPage, sort, searchInput]);

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

  const openModal = (modalType: keyof typeof modals, permission?: Permission) => {
    if (permission) setSelectedPermission(permission);
    setModals((prev) => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalType]: false }));
    if (modalType === "createOrEdit" || modalType === "view" || modalType === "delete") {
      setSelectedPermission(null);
    }
  };

  const handleCreateOrEditSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      if (selectedPermission) {
        const res = await request.put(`/api/admin/update/permission/${selectedPermission._id}`, {
          name: values.permission,
        });
        toastSuccess(res.data.message);
      } else {
        await request.post("/api/admin/create/permission", { name: values.permission });
        toastSuccess("Permission created successfully");
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
    const idsToDelete = selectedRows.length > 0 ? selectedRows : selectedPermission ? [selectedPermission._id] : [];

    if (idsToDelete.length === 0) {
      toastError("No permission selected for deletion.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await request.post("/api/admin/delete/permissions", { ids: idsToDelete });
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
      toastError("Please select permissions to delete");
      return;
    }
    openModal("delete");
  };

  const columns = getColumns({
    onEdit: (permission) => openModal("createOrEdit", permission),
    onDelete: (permission) => {
      setSelectedPermission(permission);
      openModal("delete");
    },
    onView: (permission) => openModal("view", permission),
  });

  const getDeleteMessage = () => {
    if (selectedRows.length > 0) {
      return `You are about to delete ${selectedRows.length} permission(s). This action is irreversible.`;
    }
    return selectedPermission
      ? `You are about to delete the permission "${selectedPermission.name}". This action is irreversible.`
      : "";
  };

  const breadcrumb = [{ label: "Dashboard", path: "/dashboard" }, { label: "User Management" }, { label: "Permissions" }];

  return (
    <AdminLayout breadcrumbItems={breadcrumb}>
      <Dialog
        header={selectedPermission ? "Edit Permission" : "Create Permission"}
        visible={modals.createOrEdit}
        onHide={() => closeModal("createOrEdit")}
      >
        <Form
          fields={PermissionFormController}
          initialValues={{ permission: selectedPermission?.name || "" }}
          onSubmit={handleCreateOrEditSubmit}
          buttonText={selectedPermission ? "Update Permission" : "Create Permission"}
          loading={isSubmitting}
        />
      </Dialog>

      <Dialog header="View Permission" visible={modals.view} onHide={() => closeModal("view")}>
        {selectedPermission && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedPermission.name}</p>
            </div>
            {selectedPermission.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedPermission.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created At</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(selectedPermission.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Updated At</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(selectedPermission.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <DeleteDialog
        header="Delete Permission"
        message={getDeleteMessage()}
        visible={modals.delete}
        onHide={() => closeModal("delete")}
        onConfirm={handleDelete}
      />

      <div className="py-5 mx-auto">
        <TableHeader
          title="Permission Management"
          subtitle="Manage permissions and their access levels"
          actions={
            <Button onClick={() => openModal("createOrEdit")}>
              <FiPlus className="mr-2" />
              Add Permission
            </Button>
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

export default PermissionManagement;
