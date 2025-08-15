import { Request, Response } from "express";
import { Types } from "mongoose";
import Product from "../../models/Product";

export const createProduct = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { name, purchases, sell, description } = req.body;
    
    if (!name?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Name is required.",
      });
    }
    
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(400).send({
        status: false,
        message: "Product with this name already exists.",
      });
    }
    
    const newProduct = await Product.create({
      name,
      purchases: purchases || 0,
      sell: sell || 0,
      description: description || null,
    });
    
    return res.status(201).send({
      status: true,
      message: "Product created successfully.",
      product: newProduct,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const getAllProducts = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const search = req.query.search as string;
    const sort = req.query.sort as string;
    const status = req.query.status as string;
    
    const query: any = {};
    
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } }
      ];
    }
    
    if (status !== undefined) {
      query.status = status === "true";
    }
    
    const total = await Product.countDocuments(query);
    
    let sortObj: any = { createdAt: -1 };
    if (sort) {
      switch (sort) {
        case "name_asc":
          sortObj = { name: 1 };
          break;
        case "name_desc":
          sortObj = { name: -1 };
          break;
        case "purchases_asc":
          sortObj = { purchases: 1 };
          break;
        case "purchases_desc":
          sortObj = { purchases: -1 };
          break;
        case "sell_asc":
          sortObj = { sell: 1 };
          break;
        case "sell_desc":
          sortObj = { sell: -1 };
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
    
    const products = await Product.find(query)
      .sort(sortObj)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();
    
    const lastPage = Math.ceil(total / perPage);
    const from = total > 0 ? (page - 1) * perPage + 1 : 0;
    const to = Math.min((page - 1) * perPage + products.length, total);
    
    return res.status(200).json({
      status: true,
      products,
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
    console.error("Error fetching products:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;
    const { name, purchases, sell, description, status } = req.body;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        status: false,
        message: "Invalid product ID.",
      });
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).send({
        status: false,
        message: "Product not found.",
      });
    }
    
    if (name?.trim()) {
      if (name !== product.name) {
        const existingProduct = await Product.findOne({ name });
        if (existingProduct) {
          return res.status(400).send({
            status: false,
            message: "Product name already in use by another product.",
          });
        }
        product.name = name.trim();
      }
    }
    
    if (purchases !== undefined) {
      product.purchases = purchases;
    }
    
    if (sell !== undefined) {
      product.sell = sell;
    }
    
    if (description !== undefined) {
      product.description = description;
    }
    
    if (status !== undefined) {
      product.status = status;
    }
    
    await product.save();
    
    return res.status(200).send({
      status: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const updateProductStatus = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid product ID",
      });
    }
    
    if (typeof status !== "boolean") {
      return res.status(400).json({
        status: false,
        message: "Status must be a boolean",
      });
    }
    
    const product = await Product.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!product) {
      return res.status(404).json({
        status: false,
        message: "Product not found",
      });
    }
    
    return res.status(200).json({
      status: true,
      message: "Product status updated successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const deleteProducts = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No product IDs provided.",
      });
    }
    
    const invalidIds = ids.filter((id) => !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Invalid IDs: ${invalidIds.join(", ")}`,
      });
    }
    
    const result = await Product.deleteMany({ _id: { $in: ids } });
    
    return res.status(200).json({
      status: true,
      message: result.deletedCount === 1 
        ? "1 product deleted successfully." 
        : `${result.deletedCount} products deleted successfully.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

