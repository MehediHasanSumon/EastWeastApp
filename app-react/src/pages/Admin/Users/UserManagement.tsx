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

interface Role {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  roles: (string | Role)[];
  status: boolean;
  verify_at: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const UserManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modals, setModals] = useState({
    createOrEdit: false,
    delete: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableData, setTableData] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");
  const sort = searchParams.get("sort") || "";
  const [searchInput, setSearchInput] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = { page, perPage, search: searchInput, sort };
      const res = await request.get("/api/admin/get/users", { params });
      setTableData(res.data.users);
      setMeta(res.data.meta);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await request.get("/api/admin/get/roles-for-user");
      setRoles(res.data.roles);
    } catch (error) {
      handleApiError(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, perPage, sort, searchInput]);

  useEffect(() => {
    fetchRoles();
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

  const openModal = (modalType: keyof typeof modals, user?: User) => {
    if (user) {
      setSelectedUser(user);
      setName(user.name);
      setEmail(user.email);
      setStatus(user.status);
      setIsVerified(user.verify_at !== null);
      setAssignedRoles(user.roles.map((r) => (typeof r === "string" ? r : r._id)));
      setPassword("");
    } else {
      setSelectedUser(null);
      setName("");
      setEmail("");
      setPassword("");
      setStatus(true);
      setIsVerified(false);
      setAssignedRoles([]);
    }
    setModals((prev) => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalType]: false }));
    setSelectedUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setAssignedRoles([]);
    setIsVerified(false);
    setErrors({});
  };

  const handleRoleChange = (id: string, checked: boolean) => {
    setAssignedRoles((prev) => (checked ? [...prev, id] : prev.filter((rid) => rid !== id)));
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Name is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    if (!selectedUser && !password.trim()) newErrors.password = "Password is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        email,
        status,
        roles: assignedRoles,
        verify_at: isVerified ? new Date().toISOString() : null,
        ...(!selectedUser && { password }),
      };

      if (selectedUser) {
        const res = await request.put(`/api/admin/update/user/${selectedUser._id}`, payload);
        toastSuccess(res.data.message);
      } else {
        await request.post("/api/admin/create/user", payload);
        toastSuccess("User created successfully");
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
    const idsToDelete = selectedRows.length > 0 ? selectedRows : selectedUser ? [selectedUser._id] : [];
    if (idsToDelete.length === 0) {
      toastError("No user selected for deletion.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await request.post("/api/admin/delete/users", { ids: idsToDelete });
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
      toastError("Please select users to delete");
      return;
    }
    setModals((prev) => ({ ...prev, delete: true }));
  };

  const handleSingleDelete = (user: User) => {
    setSelectedUser(user);
    setModals((prev) => ({ ...prev, delete: true }));
  };

  const handleVerifyToggle = async (userId: string, verified: boolean) => {
    try {
      const response = await request.put(`/api/admin/update/verified-at/user/${userId}`, { verified });
      toastSuccess(response.data.message);
      fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleStatusToggle = async (userId: string, status: boolean) => {
    try {
      const response = await request.put(`/api/admin/update/status/user/${userId}`, { status });
      toastSuccess(response.data.message);
      fetchData();
    } catch (error) {
      handleApiError(error);
    }
  };

  const columns = getColumns({
    onEdit: (user) => openModal("createOrEdit", user),
    onDelete: handleSingleDelete,
    onVerifyToggle: handleVerifyToggle,
    onStatusToggle: handleStatusToggle,
  });

  const breadcrumb = [{ label: "Dashboard", path: "/dashboard" }, { label: "User Management" }, { label: "Users" }];

  return (
    <AdminLayout breadcrumbItems={breadcrumb}>
      <Dialog
        header={selectedUser ? "Edit User" : "Create User"}
        visible={modals.createOrEdit}
        onHide={() => closeModal("createOrEdit")}
      >
        <form onSubmit={handleCreateOrEditSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" required>
              Full Name
            </Label>
            <Input id="name" type="text" placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} />
            {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input id="email" type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
          </div>

          {!selectedUser && (
            <div className="space-y-2">
              <Label htmlFor="password" required>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <div className="text-red-500 text-sm">{errors.password}</div>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Checkbox id="status" label="Active" checked={status} onChange={(e) => setStatus(e.target.checked)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verified">Verified</Label>
            <Checkbox
              id="verified"
              label="Mark as verified"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roles">Roles</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roles.map((role) => (
                <Checkbox
                  key={role._id}
                  id={role._id}
                  label={role.name}
                  checked={assignedRoles.includes(role._id)}
                  onChange={(e) => handleRoleChange(role._id, e.target.checked)}
                />
              ))}
            </div>
          </div>

          <SubmitButton loading={isSubmitting}>{selectedUser ? "Update User" : "Create User"}</SubmitButton>
        </form>
      </Dialog>

      <DeleteDialog
        header="Delete User"
        message={
          selectedRows.length > 0
            ? `You are about to delete ${selectedRows.length} user(s). This action is irreversible.`
            : selectedUser
            ? `You are about to delete the user "${selectedUser.name}". This action is irreversible.`
            : ""
        }
        visible={modals.delete}
        onHide={() => closeModal("delete")}
        onConfirm={handleDelete}
      />

      <div className="py-5 mx-auto">
        <TableHeader
          title="User Management"
          subtitle="Manage system users and their permissions"
          actions={
            <Button onClick={() => openModal("createOrEdit")}>
              <FiPlus className="mr-2" />
              Add User
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
            data={tableData as any}
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

export default UserManagement;
