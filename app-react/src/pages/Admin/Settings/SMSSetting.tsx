import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useSearchParams } from "react-router";
import { Info, Copy, Check, SquarePen, Trash2 } from "lucide-react";
import AdminLayout from "../../../layouts/Admin/AdminLayout";
import Button from "../../../components/ui/Button";
import DeleteDialog from "../../../components/ui/DeleteDialog";
import Dialog from "../../../components/ui/Dialog";
import Input from "../../../components/ui/Input";
import Label from "../../../components/ui/Label";
import Pagination from "../../../components/ui/Pagination";
import SubmitButton from "../../../components/ui/SubmitButton";
import TableFilter from "../../../components/ui/TableFilter";
import TableHeader from "../../../components/ui/TableHeader";
import Toggle from "../../../components/ui/Toggle";
import type { PaginationMeta } from "../../../interface/types";
import request from "../../../service/AxiosInstance";
import { handleApiError } from "../../../utils/Api";
import { toastError, toastSuccess } from "../../../utils/Toast";

interface SMSTemplate {
    _id: string;
    title: string;
    body: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

const SMSSetting = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [modals, setModals] = useState({
        createOrEdit: false,
        delete: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tableData, setTableData] = useState<SMSTemplate[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

    // Copy state for placeholders
    const [copiedPlaceholder, setCopiedPlaceholder] = useState<string | null>(null);

    // Template placeholders data
    const placeholders = [
        { key: "{invoice_no}", description: "Unique invoice number for the transaction" },
        { key: "{date_time}", description: "Date and time when the invoice was created" },
        { key: "{vehicle_no}", description: "Vehicle registration/number (optional)" },
        { key: "{customer_name}", description: "Full name of the customer" },
        { key: "{customer_phone_number}", description: "Customer's phone number" },
        { key: "{payment_method}", description: "Payment method (cash, card, bank_transfer, credit, due)" },
        { key: "{product}", description: "Reference to the purchased product" },
        { key: "{seller}", description: "Seller/user who created the invoice" },
        { key: "{price}", description: "Price of a single unit of the product" },
        { key: "{quantity}", description: "Number of product units purchased" },
        { key: "{total_amount}", description: "Final invoice amount after discount" },
        { key: "{discount}", description: "Discount applied to the purchase (default: 0)" }
    ];

    const exampleTemplate = `Thank you {customer_name} for purchasing {quantity} L of {product} at {price} BDT/L. Invoice No: {invoice_no}, Total: {total_amount} BDT.`;

    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");
    const sort = searchParams.get("sort") || "";
    const [searchInput, setSearchInput] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = {
                page,
                perPage,
                search: searchInput,
                sort,
                status: statusFilter || undefined
            };
            const res = await request.get("/api/admin/sms-templates", { params });
            setTableData(res.data.templates);
            setMeta(res.data.meta);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, perPage, sort, searchInput, statusFilter]);

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

    const openModal = (modalType: keyof typeof modals, template?: SMSTemplate) => {
        if (template) {
            setSelectedTemplate(template);
            setTitle(template.title);
            setBody(template.body);
            setIsActive(template.isActive);
        } else {
            setSelectedTemplate(null);
            setTitle("");
            setBody("");
            setIsActive(true);
        }
        setModals((prev) => ({ ...prev, [modalType]: true }));
    };

    const closeModal = (modalType: keyof typeof modals) => {
        setModals((prev) => ({ ...prev, [modalType]: false }));
        setSelectedTemplate(null);
        setTitle("");
        setBody("");
        setIsActive(true);
        setErrors({});
    };

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!title.trim()) newErrors.title = "Title is required.";
        if (!body.trim()) newErrors.body = "Body is required.";
        if (title.length < 3) newErrors.title = "Title must be at least 3 characters.";
        if (body.length < 10) newErrors.body = "Body must be at least 10 characters.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateOrEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const templateData = {
                title: title.trim(),
                body: body.trim(),
                isActive,
                ...(selectedTemplate && { _id: selectedTemplate._id })
            };

            if (selectedTemplate) {
                const res = await request.post("/api/admin/sms-template", templateData);
                toastSuccess(res.data.message);
            } else {
                const res = await request.post("/api/admin/sms-template", templateData);
                toastSuccess(res.data.message);
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
        const idsToDelete = selectedRows.length > 0 ? selectedRows : selectedTemplate ? [selectedTemplate._id] : [];
        if (idsToDelete.length === 0) {
            toastError("No template selected for deletion.");
            return;
        }

        setIsSubmitting(true);
        try {
            for (const id of idsToDelete) {
                await request.delete(`/api/admin/sms-template/${id}`);
            }
            toastSuccess("Template(s) deleted successfully");
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
            toastError("Please select templates to delete");
            return;
        }
        setModals((prev) => ({ ...prev, delete: true }));
    };

    const handleSingleDelete = (template: SMSTemplate) => {
        setSelectedTemplate(template);
        setModals((prev) => ({ ...prev, delete: true }));
    };

    const handleToggleStatus = async (template: SMSTemplate) => {
        try {
            const res = await request.put(`/api/admin/sms-template/${template._id}/toggle-status`);
            toastSuccess(res.data.message);
            fetchData();
        } catch (error) {
            handleApiError(error);
        }
    };

    // Copy placeholder to clipboard
    const copyPlaceholder = async (placeholder: string) => {
        try {
            await navigator.clipboard.writeText(placeholder);
            setCopiedPlaceholder(placeholder);
            setTimeout(() => setCopiedPlaceholder(null), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const columns = [
        {
            header: "Title",
            accessor: "title",
            cell: (row: SMSTemplate) => <div className="font-medium">{row.title}</div>,
        },
        {
            header: "Body",
            accessor: "body",
            cell: (row: SMSTemplate) => (
                <div className="max-w-xs truncate" title={row.body}>
                    {row.body}
                </div>
            ),
        },
        {
            header: "Status",
            accessor: "isActive",
            cell: (row: SMSTemplate) => (
                <Toggle
                    id={`toggle-${row._id}`}
                    checked={row.isActive}
                    onChange={() => handleToggleStatus(row)}
                    label={row.isActive ? "Active" : "Inactive"}
                />
            ),
        },
        {
            header: "Created",
            accessor: "createdAt",
            cell: (row: SMSTemplate) => (
                <div className="text-sm text-gray-500">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A"}
                </div>
            ),
        },
        {
            header: "",
            cell: (row: SMSTemplate) => (
                <div className="flex justify-end space-x-2">
                    <Button variant="edit" onClick={() => openModal("createOrEdit", row)} aria-label="Edit">
                        <SquarePen size={15} />
                    </Button>
                    <Button variant="delete" onClick={() => handleSingleDelete(row)} aria-label="Delete">
                        <Trash2 size={14} />
                    </Button>
                </div>
            ),
        },
    ];

    const breadcrumb = [{ label: "Dashboard", path: "/dashboard" }, { label: "Settings" }, { label: "SMS Templates" }];

    return (
        <AdminLayout breadcrumbItems={breadcrumb}>
            {/* Instructions Panel */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 mb-6">
                <div className="flex items-start space-x-3 mb-4">
                    <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            SMS Template Instructions
                        </h3>
                        <p className="text-blue-800 dark:text-blue-200 mb-4">
                            Use the following placeholders in your SMS templates. They will be automatically replaced with actual values when sending SMS notifications.
                        </p>
                    </div>
                </div>

                {/* Placeholders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {placeholders.map((placeholder, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:shadow-sm dark:hover:shadow-gray-700/30 transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded">
                                        {placeholder.key}
                                    </code>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {placeholder.description}
                                    </p>
                                </div>
                                <button
                                    onClick={() => copyPlaceholder(placeholder.key)}
                                    className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="Copy placeholder"
                                >
                                    {copiedPlaceholder === placeholder.key ? (
                                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <Copy className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Example Template */}
                <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Example Template:</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm font-mono text-gray-700 dark:text-gray-300 relative">
                        {exampleTemplate}
                        <button
                            onClick={() => copyPlaceholder(exampleTemplate)}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Copy example"
                        >
                            {copiedPlaceholder === exampleTemplate ? (
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                                <Copy className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Dialog
                header={selectedTemplate ? "Edit SMS Template" : "Create SMS Template"}
                visible={modals.createOrEdit}
                onHide={() => closeModal("createOrEdit")}
            >
                <form onSubmit={handleCreateOrEditSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title" required>
                            SMS Title
                        </Label>
                        <Input
                            id="title"
                            type="text"
                            placeholder="Enter SMS title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        {errors.title && <div className="text-red-500 text-sm">{errors.title}</div>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="body" required>
                            SMS Body Template
                        </Label>
                        <textarea
                            id="body"
                            rows={6}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="Enter SMS template using placeholders above..."
                        />
                        {errors.body && <div className="text-red-500 text-sm">{errors.body}</div>}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Use the placeholders from the instruction panel above to create dynamic SMS content.
                        </p>
                    </div>

                    <div className="flex items-center">
                        <Toggle
                            id="isActive"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            label="Enable SMS notifications"
                        />
                    </div>

                    <SubmitButton loading={isSubmitting}>
                        {selectedTemplate ? "Update Template" : "Create Template"}
                    </SubmitButton>
                </form>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <DeleteDialog
                header="Delete SMS Template"
                message={
                    selectedRows.length > 0
                        ? `You are about to delete ${selectedRows.length} template(s). This action is irreversible.`
                        : selectedTemplate
                            ? `You are about to delete the template "${selectedTemplate.title}". This action is irreversible.`
                            : ""
                }
                visible={modals.delete}
                onHide={() => closeModal("delete")}
                onConfirm={handleDelete}
            />

            {/* Main Content */}
            <div className="py-5 mx-auto">
                <TableHeader
                    title="SMS Template Management"
                    subtitle="Manage SMS templates for invoice notifications"
                    actions={
                        <Button onClick={() => openModal("createOrEdit")}>
                            <FiPlus className="mr-2" />
                            Add Template
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

                {/* Status Filter */}
                <div className="mb-4 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                updateURLParams({ page: 1 }); // Reset to first page when filtering
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedRows.length === tableData.length && tableData.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRows(tableData.map(item => item._id));
                                                } else {
                                                    setSelectedRows([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    {columns.map((column, index) => (
                                        <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            {column.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={columns.length + 1} className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : tableData.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                            No templates found
                                        </td>
                                    </tr>
                                ) : (
                                    tableData.map((row) => (
                                        <tr key={row._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={selectedRows.includes(row._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedRows([...selectedRows, row._id]);
                                                        } else {
                                                            setSelectedRows(selectedRows.filter(id => id !== row._id));
                                                        }
                                                    }}
                                                />
                                            </td>
                                            {columns.map((column, index) => (
                                                <td key={index} className="px-6 py-4 whitespace-nowrap">
                                                    {column.cell ? column.cell(row) : row[column.accessor as keyof SMSTemplate]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {meta && <Pagination meta={meta} onPageChange={handlePageChange} />}
                </div>
            </div>
        </AdminLayout>
    );
};

export default SMSSetting;