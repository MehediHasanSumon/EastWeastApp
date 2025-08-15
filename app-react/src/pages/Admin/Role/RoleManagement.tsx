import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useSearchParams } from "react-router";
import Table from "../../../components/Table";
import Button from "../../../components/ui/Button";
import Checkbox from "../../../components/ui/Checkbox";
import DeleteDialog from "../../../components/ui/DeleteDialog";
import Dialog from "../../../components/ui/Dialog";
import Input from "../../../components/ui/Input";
import Label from "../../../components/ui/Label";
import Pagination from "../../../components/ui/Pagination";
import SubmitButton from "../../../components/ui/SubmitButton";
import TableFilter from "../../../components/ui/TableFilter";
import TableHeader from "../../../components/ui/TableHeader";
import type { PaginationMeta } from "../../../interface/types";
import AdminLayout from "../../../layouts/Admin/AdminLayout";
import request from "../../../service/AxiosInstance";
import { handleApiError } from "../../../utils/Api";
import { toastError, toastSuccess } from "../../../utils/Toast";
import { getColumns } from "./Column";

interface Permission {
  _id: string;
  name: string;
  guard?: string;
}

interface Role {
  _id: string;
  name: string;
  permissions: (string | Permission)[];
  createdAt?: string;
  updatedAt?: string;
}

const RoleManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modals, setModals] = useState({
    createOrEdit: false,
    delete: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableData, setTableData] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [assignedPermissions, setAssignedPermissions] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");
  const sort = searchParams.get("sort") || "";
  const [searchInput, setSearchInput] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = { page, perPage, search: searchInput, sort };
      const res = await request.get("/api/admin/get/roles", { params });
      setTableData(res.data.roles);
      setMeta(res.data.meta);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await request.get("/api/admin/get/permissions-for-role");
      setPermissions(res.data.permissions);
    } catch (error) {
      handleApiError(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, perPage, sort, searchInput]);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const updateURLParams = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, String(value));
      else newParams.delete(key);
    });
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => updateURLParams({ page: newPage });
  const handlePerPageChange = (value: number) => updateURLParams({ perPage: value, page: 1 });
  const handleSortChange = (value: string) => updateURLParams({ sort: value, page: 1 });

  const openModal = (modalType: keyof typeof modals, role?: Role) => {
    if (role) {
      setSelectedRole(role);
      setName(role.name);
      setAssignedPermissions(role.permissions.map((p) => (typeof p === "string" ? p : p._id)));
    } else {
      setSelectedRole(null);
      setName("");
      setAssignedPermissions([]);
    }
    setModals((prev) => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalType]: false }));
    setSelectedRole(null);
    setName("");
    setAssignedPermissions([]);
    setErrors({});
  };

  const handlePermissionChange = (id: string, checked: boolean) => {
    setAssignedPermissions((prev) => (checked ? [...prev, id] : prev.filter((pid) => pid !== id)));
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (selectedRole) {
        const res = await request.put(`/api/admin/update/role/${selectedRole._id}`, {
          name,
          permissions: assignedPermissions,
        });
        toastSuccess(res.data.message);
      } else {
        await request.post("/api/admin/create/role", {
          name,
          permissions: assignedPermissions,
        });
        toastSuccess("Role created successfully");
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
    const idsToDelete = selectedRows.length > 0 ? selectedRows : selectedRole ? [selectedRole._id] : [];
    if (idsToDelete.length === 0) {
      toastError("No role selected for deletion.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await request.post("/api/admin/delete/roles", { ids: idsToDelete });
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
      toastError("Please select roles to delete");
      return;
    }
    setModals((prev) => ({ ...prev, delete: true }));
  };

  const handleSingleDelete = (role: Role) => {
    setSelectedRole(role);
    setModals((prev) => ({ ...prev, delete: true }));
  };

  const columns = getColumns({
    onEdit: (role) => openModal("createOrEdit", role),
    onDelete: handleSingleDelete,
  });

  const breadcrumb = [{ label: "Dashboard", path: "/dashboard" }, { label: "User Management" }, { label: "Roles" }];

  return (
    <AdminLayout breadcrumbItems={breadcrumb}>
      <Dialog
        header={selectedRole ? "Edit Role" : "Create Role"}
        visible={modals.createOrEdit}
        onHide={() => closeModal("createOrEdit")}
      >
        <form onSubmit={handleCreateOrEditSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" required>
              Role Name
            </Label>
            <Input id="name" type="text" placeholder="Enter role name" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="permissions">Permissions</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissions.map((perm) => (
                <Checkbox
                  key={perm._id}
                  id={perm._id}
                  label={perm.name}
                  checked={assignedPermissions.includes(perm._id)}
                  onChange={(e) => handlePermissionChange(perm._id, e.target.checked)}
                />
              ))}
            </div>
          </div>

          <SubmitButton loading={isSubmitting}>{selectedRole ? "Update Role" : "Create Role"}</SubmitButton>
        </form>
      </Dialog>

      <DeleteDialog
        header="Delete Role"
        message={
          selectedRows.length > 0
            ? `You are about to delete ${selectedRows.length} role(s). This action is irreversible.`
            : selectedRole
            ? `You are about to delete the role "${selectedRole.name}". This action is irreversible.`
            : ""
        }
        visible={modals.delete}
        onHide={() => closeModal("delete")}
        onConfirm={handleDelete}
      />

      <div className="py-5 mx-auto">
        <TableHeader
          title="Role Management"
          subtitle="Manage roles and assign permissions"
          actions={
            <Button onClick={() => openModal("createOrEdit")}>
              <FiPlus className="mr-2" />
              Add Role
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

export default RoleManagement;
