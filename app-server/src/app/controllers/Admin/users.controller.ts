import { Request, Response } from "express";
import { Types } from "mongoose";
import { hashPassword } from "../../../utils/password";
import { Role } from "../../models/Role";
import User from "../../models/Users";

export const getAllRolesForUser = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const roles = await Role.find();

    return res.status(200).send({
      status: true,
      roles,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { name, email, password, roles, status, verify_at } = req.body;

    if (!name?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Name is required.",
      });
    }

    if (!email?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Email is required.",
      });
    }

    if (!password?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Password is required.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({
        status: false,
        message: "User with this email already exists.",
      });
    }

    if (roles && Array.isArray(roles) && roles.length > 0) {
      const invalidRoles = roles.filter((id: string) => !Types.ObjectId.isValid(id));
      if (invalidRoles.length > 0) {
        return res.status(400).send({
          status: false,
          message: `Invalid role IDs: ${invalidRoles.join(", ")}`,
        });
      }

      const existingRoles = await Role.countDocuments({ _id: { $in: roles } });
      if (existingRoles !== roles.length) {
        return res.status(400).send({
          status: false,
          message: "One or more roles do not exist.",
        });
      }
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      roles: roles || [],
      status: status !== undefined ? status : true,
      verify_at: verify_at || null,
    });

    return res.status(201).send({
      status: true,
      message: "User created successfully.",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        roles: newUser.roles,
        status: newUser.status,
        verify_at: newUser.verify_at,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const search = req.query.search as string;
    const sort = req.query.sort as string;
    const status = req.query.status as string;
    const verified = req.query.verified as string;

    const query: any = {};

    if (search && search.trim()) {
      query.$or = [{ name: { $regex: search.trim(), $options: "i" } }, { email: { $regex: search.trim(), $options: "i" } }];
    }

    if (status !== undefined) {
      query.status = status === "true";
    }

    if (verified !== undefined) {
      if (verified === "true") {
        query.verify_at = { $ne: null };
      } else if (verified === "false") {
        query.verify_at = null;
      }
    }

    const total = await User.countDocuments(query);

    let sortObj: any = { createdAt: -1 };

    if (sort) {
      switch (sort) {
        case "name_asc":
          sortObj = { name: 1 };
          break;
        case "name_desc":
          sortObj = { name: -1 };
          break;
        case "email_asc":
          sortObj = { email: 1 };
          break;
        case "email_desc":
          sortObj = { email: -1 };
          break;
        case "newest":
          sortObj = { createdAt: -1 };
          break;
        case "oldest":
          sortObj = { createdAt: 1 };
          break;
        case "verified":
          sortObj = { verify_at: -1 };
          break;
        case "unverified":
          sortObj = { verify_at: 1 };
          break;
        default:
          sortObj = { createdAt: -1 };
      }
    }

    const users = await User.find(query)
      .select("-password")
      .populate("roles")
      .sort(sortObj)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const lastPage = Math.ceil(total / perPage);
    const from = total > 0 ? (page - 1) * perPage + 1 : 0;
    const to = Math.min((page - 1) * perPage + users.length, total);

    return res.status(200).json({
      status: true,
      users,
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
    console.error("Error fetching users:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;
    const { name, email, password, roles, status, verify_at } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        status: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found.",
      });
    }

    if (name?.trim()) {
      user.name = name.trim();
    }

    if (email?.trim()) {
      if (email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).send({
            status: false,
            message: "Email already in use by another user.",
          });
        }
        user.email = email.trim();
      }
    }

    if (password?.trim()) {
      user.password = await hashPassword(password.trim());
    }

    if (roles && Array.isArray(roles)) {
      const invalidRoles = roles.filter((id: string) => !Types.ObjectId.isValid(id));
      if (invalidRoles.length > 0) {
        return res.status(400).send({
          status: false,
          message: `Invalid role IDs: ${invalidRoles.join(", ")}`,
        });
      }

      const existingRoles = await Role.countDocuments({ _id: { $in: roles } });
      if (existingRoles !== roles.length) {
        return res.status(400).send({
          status: false,
          message: "One or more roles do not exist.",
        });
      }

      user.roles = roles;
    }

    if (status !== undefined) {
      user.status = status;
    }

    if (verify_at !== undefined) {
      user.verify_at = verify_at;
    }

    await user.save();

    const updatedUser = await User.findById(id).select("-password").populate("roles");

    return res.status(200).send({
      status: true,
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const updateUserVerification = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID",
      });
    }

    if (typeof verified !== "boolean") {
      return res.status(400).json({
        status: false,
        message: "Verified status must be a boolean",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        verify_at: verified ? new Date() : null,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "User verification updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID",
      });
    }

    if (typeof status !== "boolean") {
      return res.status(400).json({
        status: false,
        message: "Status must be a boolean",
      });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select("-password");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "User status updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const deleteUsers = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No user IDs provided.",
      });
    }

    const invalidIds = ids.filter((id) => !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Invalid IDs: ${invalidIds.join(", ")}`,
      });
    }

    const result = await User.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status: true,
      message: result.deletedCount === 1 ? "1 user deleted successfully." : `${result.deletedCount} users deleted successfully.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const getUserDetails = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        status: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(id).select("-password").populate("roles");

    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found.",
      });
    }

    return res.status(200).send({
      status: true,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};
