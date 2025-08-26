import { Request, Response } from "express";
import { SMSTemplate } from "../../models/Settings";

// Create or update SMS template
export const createOrUpdateSMSTemplate = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { title, body, isActive } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required and cannot be empty",
      });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: "Body is required and cannot be empty",
      });
    }

    if (title.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Title must be at least 3 characters long",
      });
    }

    if (body.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Body must be at least 10 characters long",
      });
    }

    // Check if template with same title exists (case-insensitive)
    const existingTemplate = await SMSTemplate.findOne({
      title: { $regex: new RegExp(`^${title}$`, "i") },
      _id: { $ne: req.body._id }, // Exclude current template if updating
    });

    if (existingTemplate) {
      return res.status(409).json({
        success: false,
        message: "A template with this title already exists",
      });
    }

    let template;
    if (req.body._id) {
      // Update existing template
      template = await SMSTemplate.findByIdAndUpdate(
        req.body._id,
        {
          title: title.trim(),
          body: body.trim(),
          isActive: isActive !== undefined ? isActive : true,
        },
        { new: true, runValidators: true }
      );

      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }
    } else {
      // Create new template
      template = new SMSTemplate({
        title: title.trim(),
        body: body.trim(),
        isActive: isActive !== undefined ? isActive : true,
      });

      await template.save();
    }

    return res.status(200).json({
      success: true,
      message: req.body._id ? "SMS template updated successfully" : "SMS template created successfully",
      data: template,
    });
  } catch (error: any) {
    console.error("Error in createOrUpdateSMSTemplate:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

// Get all SMS templates with pagination and search
export const getAllSMSTemplates = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const search = (req.query.search as string) || "";
    const sort = req.query.sort as string;
    const status = req.query.status as string;

    const query: any = {};

    if (search && search.trim()) {
      query.$or = [{ title: { $regex: search.trim(), $options: "i" } }, { body: { $regex: search.trim(), $options: "i" } }];
    }

    if (status !== undefined) {
      query.isActive = status === "true";
    }

    const total = await SMSTemplate.countDocuments(query);

    let sortObj: any = { createdAt: -1 };

    if (sort) {
      switch (sort) {
        case "title_asc":
          sortObj = { title: 1 };
          break;
        case "title_desc":
          sortObj = { title: -1 };
          break;
        case "newest":
          sortObj = { createdAt: -1 };
          break;
        case "oldest":
          sortObj = { createdAt: 1 };
          break;
        case "active":
          sortObj = { isActive: -1, createdAt: -1 };
          break;
        case "inactive":
          sortObj = { isActive: 1, createdAt: -1 };
          break;
        default:
          sortObj = { createdAt: -1 };
      }
    }

    const templates = await SMSTemplate.find(query)
      .sort(sortObj)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .select("-__v")
      .lean();

    const lastPage = Math.ceil(total / perPage);
    const from = total > 0 ? (page - 1) * perPage + 1 : 0;
    const to = Math.min((page - 1) * perPage + templates.length, total);

    return res.status(200).json({
      status: true,
      templates,
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
  } catch (error: any) {
    console.error("Error in getAllSMSTemplates:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

// Get single SMS template by ID
export const getSMSTemplateById = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    const template = await SMSTemplate.findById(id).select("-__v");

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "SMS template not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "SMS template retrieved successfully",
      data: template,
    });
  } catch (error: any) {
    console.error("Error in getSMSTemplateById:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

// Get latest active SMS template
export const getLatestActiveSMSTemplate = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const template = await SMSTemplate.findOne({ isActive: true }).sort({ createdAt: -1 }).select("-__v");

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "No active SMS template found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Latest active SMS template retrieved successfully",
      data: template,
    });
  } catch (error: any) {
    console.error("Error in getLatestActiveSMSTemplate:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

// Toggle template active status
export const toggleTemplateStatus = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    const template = await SMSTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "SMS template not found",
      });
    }

    // Toggle the status
    template.isActive = !template.isActive;
    await template.save();

    return res.status(200).json({
      success: true,
      message: `Template ${template.isActive ? "activated" : "deactivated"} successfully`,
      data: template,
    });
  } catch (error: any) {
    console.error("Error in toggleTemplateStatus:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

// Delete SMS template
export const deleteSMSTemplate = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    const template = await SMSTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "SMS template not found",
      });
    }

    // Check if this is the only active template
    if (template.isActive) {
      const activeTemplatesCount = await SMSTemplate.countDocuments({ isActive: true });
      if (activeTemplatesCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the only active template. Please activate another template first.",
        });
      }
    }

    await SMSTemplate.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "SMS template deleted successfully",
      data: { id: template._id, title: template.title },
    });
  } catch (error: any) {
    console.error("Error in deleteSMSTemplate:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

// Bulk operations
export const bulkUpdateTemplates = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { templateIds, updates } = req.body;

    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Template IDs array is required",
      });
    }

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({
        success: false,
        message: "Updates object is required",
      });
    }

    // Validate template IDs
    const validIds = templateIds.filter((id: string) => id && typeof id === "string");
    if (validIds.length !== templateIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some template IDs are invalid",
      });
    }

    // Perform bulk update
    const result = await SMSTemplate.updateMany({ _id: { $in: validIds } }, { $set: updates }, { runValidators: true });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No templates found with the provided IDs",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} out of ${result.matchedCount} templates`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error: any) {
    console.error("Error in bulkUpdateTemplates:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};
