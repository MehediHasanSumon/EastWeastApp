import { Request, Response } from "express";
import { Types } from "mongoose";
import Invoice from "../../models/Invoice";
import Product from "../../models/Product";

export const createInvoice = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const {
      invoice_no,
      date_time,
      vehicle_no,
      customer_name,
      customer_phone_number,
      payment_method,
      product,
      price,
      quantity,
      total_amount,
      discount,
      is_sent_sms,
      status
    } = req.body;

    // Validate required fields
    if (!invoice_no?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Invoice number is required.",
      });
    }

    if (!date_time) {
      return res.status(400).send({
        status: false,
        message: "Date and time are required.",
      });
    }

    if (!customer_name?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Customer name is required.",
      });
    }

    if (!customer_phone_number?.trim()) {
      return res.status(400).send({
        status: false,
        message: "Customer phone number is required.",
      });
    }

    if (!payment_method || !["cash", "card", "bank_transfer", "credit", "due"].includes(payment_method)) {
      return res.status(400).send({
        status: false,
        message: "Valid payment method is required (cash, card, bank_transfer, credit, due).",
      });
    }

    if (!product || !Types.ObjectId.isValid(product)) {
      return res.status(400).send({
        status: false,
        message: "Valid product ID is required.",
      });
    }

    if (price === undefined || price <= 0) {
      return res.status(400).send({
        status: false,
        message: "Price must be a positive number.",
      });
    }

    if (quantity === undefined || quantity <= 0) {
      return res.status(400).send({
        status: false,
        message: "Quantity must be a positive number.",
      });
    }

    if (total_amount === undefined || total_amount < 0) {
      return res.status(400).send({
        status: false,
        message: "Total amount must be a non-negative number.",
      });
    }

    if (discount !== undefined && discount < 0) {
      return res.status(400).send({
        status: false,
        message: "Discount must be a non-negative number.",
      });
    }

    if (!status || !["pending", "paid", "cancelled"].includes(status)) {
      return res.status(400).send({
        status: false,
        message: "Valid status is required (pending, paid, cancelled).",
      });
    }

    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({ invoice_no });
    if (existingInvoice) {
      return res.status(400).send({
        status: false,
        message: "Invoice with this number already exists.",
      });
    }

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(400).send({
        status: false,
        message: "Product not found.",
      });
    }

    // Create new invoice
    const newInvoice = await Invoice.create({
      invoice_no: invoice_no.trim(),
      date_time,
      vehicle_no: vehicle_no?.trim() || null,
      customer_name: customer_name.trim(),
      customer_phone_number: customer_phone_number.trim(),
      payment_method,
      product,
      price,
      quantity,
      total_amount,
      discount: discount || 0,
      is_sent_sms: is_sent_sms || false,
      status,
    });

    return res.status(201).send({
      status: true,
      message: "Invoice created successfully.",
      invoice: {
        _id: newInvoice._id,
        invoice_no: newInvoice.invoice_no,
        date_time: newInvoice.date_time,
        vehicle_no: newInvoice.vehicle_no,
        customer_name: newInvoice.customer_name,
        customer_phone_number: newInvoice.customer_phone_number,
        payment_method: newInvoice.payment_method,
        product: newInvoice.product,
        price: newInvoice.price,
        quantity: newInvoice.quantity,
        total_amount: newInvoice.total_amount,
        discount: newInvoice.discount,
        is_sent_sms: newInvoice.is_sent_sms,
        status: newInvoice.status,
        createdAt: newInvoice.createdAt,
        updatedAt: newInvoice.updatedAt,
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

export const getAllInvoices = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const search = req.query.search as string;
    const sort = req.query.sort as string;
    const status = req.query.status as string;
    const payment_method = req.query.payment_method as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const query: any = {};

    // Search functionality
    if (search && search.trim()) {
      query.$or = [
        { invoice_no: { $regex: search.trim(), $options: "i" } },
        { customer_name: { $regex: search.trim(), $options: "i" } },
        { customer_phone_number: { $regex: search.trim(), $options: "i" } },
        { vehicle_no: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Filter by status
    if (status && ["pending", "paid", "cancelled"].includes(status)) {
      query.status = status;
    }

    // Filter by payment method
    if (payment_method && ["cash", "card", "bank_transfer", "credit", "due"].includes(payment_method)) {
      query.payment_method = payment_method;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) {
        query.date_time.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date_time.$lte = new Date(endDate);
      }
    }

    const total = await Invoice.countDocuments(query);

    // Sorting options
    let sortObj: any = { createdAt: -1 };
    if (sort) {
      switch (sort) {
        case "invoice_no_asc":
          sortObj = { invoice_no: 1 };
          break;
        case "invoice_no_desc":
          sortObj = { invoice_no: -1 };
          break;
        case "date_asc":
          sortObj = { date_time: 1 };
          break;
        case "date_desc":
          sortObj = { date_time: -1 };
          break;
        case "amount_asc":
          sortObj = { total_amount: 1 };
          break;
        case "amount_desc":
          sortObj = { total_amount: -1 };
          break;
        case "customer_asc":
          sortObj = { customer_name: 1 };
          break;
        case "customer_desc":
          sortObj = { customer_name: -1 };
          break;
        default:
          sortObj = { createdAt: -1 };
      }
    }

    const invoices = await Invoice.find(query)
      .populate("product", "name")
      .sort(sortObj)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const lastPage = Math.ceil(total / perPage);
    const from = total > 0 ? (page - 1) * perPage + 1 : 0;
    const to = Math.min((page - 1) * perPage + invoices.length, total);

    return res.status(200).json({
      status: true,
      invoices,
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
    console.error("Error fetching invoices:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const getInvoiceDetails = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        status: false,
        message: "Invalid invoice ID.",
      });
    }

    const invoice = await Invoice.findById(id).populate("product");

    if (!invoice) {
      return res.status(404).send({
        status: false,
        message: "Invoice not found.",
      });
    }

    return res.status(200).send({
      status: true,
      invoice,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const updateInvoice = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;
    const {
      invoice_no,
      date_time,
      vehicle_no,
      customer_name,
      customer_phone_number,
      payment_method,
      product,
      price,
      quantity,
      total_amount,
      discount,
      is_sent_sms,
      status
    } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        status: false,
        message: "Invalid invoice ID.",
      });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).send({
        status: false,
        message: "Invoice not found.",
      });
    }

    // Check if invoice number is being updated and if it already exists
    if (invoice_no?.trim() && invoice_no !== invoice.invoice_no) {
      const existingInvoice = await Invoice.findOne({ invoice_no });
      if (existingInvoice) {
        return res.status(400).send({
          status: false,
          message: "Invoice number already in use by another invoice.",
        });
      }
      invoice.invoice_no = invoice_no.trim();
    }

    if (date_time) {
      invoice.date_time = date_time;
    }

    if (vehicle_no !== undefined) {
      invoice.vehicle_no = vehicle_no?.trim() || null;
    }

    if (customer_name?.trim()) {
      invoice.customer_name = customer_name.trim();
    }

    if (customer_phone_number?.trim()) {
      invoice.customer_phone_number = customer_phone_number.trim();
    }

    if (payment_method && ["cash", "card", "bank_transfer", "credit", "due"].includes(payment_method)) {
      invoice.payment_method = payment_method;
    }

    if (product && Types.ObjectId.isValid(product)) {
      const productExists = await Product.findById(product);
      if (!productExists) {
        return res.status(400).send({
          status: false,
          message: "Product not found.",
        });
      }
      invoice.product = product;
    }

    if (price !== undefined && price > 0) {
      invoice.price = price;
    }

    if (quantity !== undefined && quantity > 0) {
      invoice.quantity = quantity;
    }

    if (total_amount !== undefined && total_amount >= 0) {
      invoice.total_amount = total_amount;
    }

    if (discount !== undefined && discount >= 0) {
      invoice.discount = discount;
    }

    if (is_sent_sms !== undefined) {
      invoice.is_sent_sms = is_sent_sms;
    }

    if (status && ["pending", "paid", "cancelled"].includes(status)) {
      invoice.status = status;
    }

    await invoice.save();

    const updatedInvoice = await Invoice.findById(id).populate("product");

    return res.status(200).send({
      status: true,
      message: "Invoice updated successfully.",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const updateInvoiceStatus = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid invoice ID",
      });
    }

    if (!status || !["pending", "paid", "cancelled"].includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Valid status is required (pending, paid, cancelled)",
      });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("product");

    if (!invoice) {
      return res.status(404).json({
        status: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Invoice status updated successfully",
      invoice,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const deleteInvoices = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No invoice IDs provided.",
      });
    }

    const invalidIds = ids.filter((id) => !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Invalid IDs: ${invalidIds.join(", ")}`,
      });
    }

    const result = await Invoice.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      status: true,
      message: result.deletedCount === 1 
        ? "1 invoice deleted successfully." 
        : `${result.deletedCount} invoices deleted successfully.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};