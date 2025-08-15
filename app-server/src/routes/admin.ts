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

const route = Router();

// Users
route.get("/get/roles-for-user", getAllRolesForUser);
route.get("/get/users", getAllUsers);
route.post("/create/user", createUser);
route.put("/update/user/:id", updateUser);
route.put("/update/status/user/:id", updateUserStatus);
route.put("/update/verified-at/user/:id", updateUserVerification);
route.post("/delete/users", deleteUsers);

export default route;
