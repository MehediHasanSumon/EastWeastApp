import { Types } from "mongoose";
import { Permission } from "../app/models/Permission";
import { Role } from "../app/models/Role";
import User from "../app/models/Users";

export const getUserWithRolesAndPermissions = async (userId: string) => {
  const user = await User.findById(userId).select("-password").lean();

  if (!user) return null;

  const userRoles = await Role.find({ _id: { $in: user.roles } }).lean();

  const rolePermissionIds = [...new Set(userRoles.flatMap((role) => (role.permissions as Types.ObjectId[]) || []))];

  const permissions = await Permission.find({ _id: { $in: rolePermissionIds } }).lean();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    roles: userRoles,
    permissions,
    verifyAt: user.verify_at,
  };
};
