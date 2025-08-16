import { Router } from "express";
import {
  createUser,
  deleteUsers,
  getAllRolesForUser,
  getAllUsers,
  updateUser,
  updateUserStatus,
  updateUserVerification,
} from "../app/controllers/Admin/users.controller";
import {
  createPermission,
  deletePermissions,
  getAllPermissions,
  updatePermission,
} from "../app/controllers/Admin/permission.controller";
import {
  createRole,
  deleteRoles,
  getAllRoles,
  getAllPermissionsForRole,
  updateRole,
} from "../app/controllers/Admin/role.controller";
import {
  createInvoice,
  deleteInvoices,
  getAllInvoices,
  getInvoiceDetails,
  updateInvoice,
  updateInvoiceStatus,
  getReportStats,
  exportReport,
} from "../app/controllers/Invoice/invoice.controller";
import {
  createProduct,
  deleteProducts,
  getAllProducts,
  updateProduct,
  updateProductStatus,
} from "../app/controllers/Invoice/product.controller";

const route = Router();

// Users
route.get("/get/roles-for-user", getAllRolesForUser);
route.get("/get/users", getAllUsers);
route.post("/create/user", createUser);
route.put("/update/user/:id", updateUser);
route.put("/update/status/user/:id", updateUserStatus);
route.put("/update/verified-at/user/:id", updateUserVerification);
route.post("/delete/users", deleteUsers);

// Products
route.get("/get/products", getAllProducts);
route.post("/create/product", createProduct);
route.put("/update/product/:id", updateProduct);
route.put("/update/product-status/:id", updateProductStatus);
route.post("/delete/products", deleteProducts);

// Invoices
route.get("/get/invoices", getAllInvoices);
route.get("/get/invoice/:id", getInvoiceDetails);
route.post("/create/invoice", createInvoice);
route.put("/update/invoice/:id", updateInvoice);
route.put("/update/invoice-status/:id", updateInvoiceStatus);
route.post("/delete/invoices", deleteInvoices);

// Reports
route.get("/reports/stats", getReportStats);
route.get("/reports/export", exportReport);


export default route;
