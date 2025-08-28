import { Request, Response } from "express";
import { Types } from "mongoose";

export const updatePassword = async (req: Request, res: Response): Promise<Response | any> => {
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
