import { Request, Response } from "express";
import { Types } from "mongoose";
import { Permission } from "../../models/Permission";

export const createPermission = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { name, guard } = req.body;

    if (!name?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Permission name is required.",
      });
    }

    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return res.status(400).send({
        status: false,
        message: "Permission already exists.",
      });
    }

    const newPermission = await Permission.create({
      name,
      guard: guard || "web",
    });

    return res.status(201).send({
      status: true,
      message: "Permission created successfully.",
      permission: newPermission,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const getAllPermissions = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const search = req.query.search as string;
    const sort = req.query.sort as string;

    const query: any = {};

    if (search && search.trim()) {
      query.$or = [{ name: { $regex: search.trim(), $options: "i" } }, { description: { $regex: search.trim(), $options: "i" } }];
    }

    const total = await Permission.countDocuments(query);

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

    const permissions = await Permission.find(query)
      .sort(sortObj)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const lastPage = Math.ceil(total / perPage);
    const from = total > 0 ? (page - 1) * perPage + 1 : 0;
    const to = Math.min((page - 1) * perPage + permissions.length, total);

    return res.status(200).json({
      status: true,
      permissions,
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
    console.error("Error fetching permissions:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const updatePermission = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;
    const { name, guard } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        status: false,
        message: "Invalid permission ID.",
      });
    }

    if (!name?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Permission name is required.",
      });
    }

    const permission = await Permission.findById(id);
    if (!permission) {
      return res.status(404).send({
        status: false,
        message: "Permission not found.",
      });
    }

    if (name !== permission.name) {
      const existingPermission = await Permission.findOne({ name });
      if (existingPermission) {
        return res.status(400).send({
          status: false,
          message: "Permission with this name already exists.",
        });
      }
    }

    permission.name = name;
    if (guard) permission.guard = guard;
    await permission.save();

    return res.status(200).send({
      status: true,
      message: "Permission updated successfully.",
      permission,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const deletePermissions = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No permission IDs provided.",
      });
    }

    const invalidIds = ids.filter((id) => !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Invalid IDs: ${invalidIds.join(", ")}`,
      });
    }

    const result = await Permission.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status: true,
      message:
        result.deletedCount === 1
          ? "1 permission deleted successfully."
          : `${result.deletedCount} permissions deleted successfully.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
