import { Request, Response } from "express";
import { Types } from "mongoose";
import { Permission } from "../../models/Permission";
import { Role } from "../../models/Role";

export const getAllPermissionsForRole = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const permissions = await Permission.find();

    return res.status(200).send({
      status: true,
      permissions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const createRole = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { name, permissions } = req.body;

    if (!name?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Role name is required.",
      });
    }

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).send({
        status: false,
        message: "Role already exists.",
      });
    }

    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const invalidPermissions = permissions.filter((id: string) => !Types.ObjectId.isValid(id));
      if (invalidPermissions.length > 0) {
        return res.status(400).send({
          status: false,
          message: `Invalid permission IDs: ${invalidPermissions.join(", ")}`,
        });
      }

      const existingPermissions = await Permission.countDocuments({ _id: { $in: permissions } });
      if (existingPermissions !== permissions.length) {
        return res.status(400).send({
          status: false,
          message: "One or more permissions do not exist.",
        });
      }
    }

    const newRole = await Role.create({
      name,
      permissions: permissions || [],
    });

    return res.status(201).send({
      status: true,
      message: "Role created successfully.",
      role: newRole,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const getAllRoles = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const search = req.query.search as string;
    const sort = req.query.sort as string;

    const query: any = {};

    if (search && search.trim()) {
      query.$or = [{ name: { $regex: search.trim(), $options: "i" } }];
    }

    const total = await Role.countDocuments(query);

    let sortObj: any = { createdAt: -1 };

    if (sort) {
      switch (sort) {
        case "asc":
          sortObj = { name: 1 };
          break;
        case "desc":
          sortObj = { name: -1 };
          break;
        case "newest":
          sortObj = { createdAt: -1 };
          break;
        case "oldest":
          sortObj = { createdAt: 1 };
          break;
        default:
          sortObj = { createdAt: -1 };
      }
    }

    const roles = await Role.find(query)
      .populate("permissions")
      .sort(sortObj)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const lastPage = Math.ceil(total / perPage);
    const from = total > 0 ? (page - 1) * perPage + 1 : 0;
    const to = Math.min((page - 1) * perPage + roles.length, total);

    return res.status(200).json({
      status: true,
      roles,
      meta: {
        total,
        perPage,
        currentPage: page,
        lastPage,
        from,
        to,
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const updateRole = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        status: false,
        message: "Invalid role ID.",
      });
    }

    if (!name?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Role name is required.",
      });
    }

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).send({
        status: false,
        message: "Role not found.",
      });
    }

    if (name !== role.name) {
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).send({
          status: false,
          message: "Role with this name already exists.",
        });
      }
    }

    // Validate permission IDs if provided
    if (permissions && Array.isArray(permissions)) {
      const invalidPermissions = permissions.filter((id: string) => !Types.ObjectId.isValid(id));
      if (invalidPermissions.length > 0) {
        return res.status(400).send({
          status: false,
          message: `Invalid permission IDs: ${invalidPermissions.join(", ")}`,
        });
      }

      const existingPermissions = await Permission.countDocuments({ _id: { $in: permissions } });
      if (existingPermissions !== permissions.length) {
        return res.status(400).send({
          status: false,
          message: "One or more permissions do not exist.",
        });
      }
    }

    role.name = name;
    if (permissions) role.permissions = permissions;
    await role.save();

    const updatedRole = await Role.findById(id).populate("permissions");

    return res.status(200).send({
      status: true,
      message: "Role updated successfully.",
      role: updatedRole,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const deleteRoles = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No role IDs provided.",
      });
    }

    const invalidIds = ids.filter((id) => !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Invalid IDs: ${invalidIds.join(", ")}`,
      });
    }

    const result = await Role.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status: true,
      message: result.deletedCount === 1 ? "1 role deleted successfully." : `${result.deletedCount} roles deleted successfully.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
