import { Router } from "express";
import {
  createPermission,
  deletePermissions,
  getAllPermissions,
  updatePermission,
} from "../app/controllers/Admin/permission.controller";
import {
  createRole,
  deleteRoles,
  getAllPermissionsForRole,
  getAllRoles,
  updateRole,
} from "../app/controllers/Admin/role.controller";

const route = Router();

// Roles
route.get("/get/permissions", getAllPermissions);
route.post("/create/permission", createPermission);
route.put("/update/permission/:id", updatePermission);
route.post("/delete/permissions", deletePermissions);

// Permissions
route.get("/get/permissions-for-role", getAllPermissionsForRole);
route.get("/get/roles", getAllRoles);
route.post("/create/role", createRole);
route.put("/update/role/:id", updateRole);
route.post("/delete/roles", deleteRoles);

export default route;
