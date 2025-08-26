import { Request, Response } from "express";
import { Types } from "mongoose";
import Invoice from "../../models/Invoice";
import Product from "../../models/Product";
import User from "../../models/Users";
import { SMSTemplate } from "../../models/Settings";
import { formatSms } from "../../../utils/sms";
import { sendSMS } from "../../../config/SmsConfig";

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
    } = req.body;

    // Validation
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

    // Parse and validate the date
    let parsedDate;
    try {
      // Handle both ISO string and custom format
      if (typeof date_time === "string" && date_time.includes("T")) {
        parsedDate = new Date(date_time);
      } else if (typeof date_time === "string") {
        // Parse custom format: "YYYY-MM-DD HH:MM"
        const [datePart, timePart] = date_time.split(" ");
        if (datePart && timePart) {
          const [year, month, day] = datePart.split("-");
          const [hour, minute] = timePart.split(":");
          parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        } else {
          parsedDate = new Date(date_time);
        }
      } else {
        parsedDate = new Date(date_time);
      }

      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date format");
      }
    } catch (dateError) {
      return res.status(400).send({
        status: false,
        message: "Invalid date format. Please use YYYY-MM-DD HH:MM format or ISO string.",
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

    if (!payment_method) {
      return res.status(400).send({
        status: false,
        message: "Payment method is required.",
      });
    }

    if (!product || !Types.ObjectId.isValid(product)) {
      return res.status(400).send({
        status: false,
        message: "Valid product ID is required.",
      });
    }

    if (!price || price <= 0) {
      return res.status(400).send({
        status: false,
        message: "Valid price is required.",
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).send({
        status: false,
        message: "Valid quantity is required.",
      });
    }

    if (!total_amount || total_amount <= 0) {
      return res.status(400).send({
        status: false,
        message: "Valid total amount is required.",
      });
    }

    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({ invoice_no });
    if (existingInvoice) {
      return res.status(400).send({
        status: false,
        message: "Invoice number already exists.",
      });
    }

    // Verify product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(400).send({
        status: false,
        message: "Product not found.",
      });
    }

    // Get seller from authenticated user (req.user is set by auth middleware)
    const seller = req.user._id;
    if (!seller || !Types.ObjectId.isValid(seller)) {
      return res.status(400).send({
        status: false,
        message: "Valid seller is required.",
      });
    }

    // Verify seller exists
    const sellerExists = await User.findById(seller);
    if (!sellerExists) {
      return res.status(400).send({
        status: false,
        message: "Seller not found.",
      });
    }

    let newInvoice;
    try {
      newInvoice = await Invoice.create({
        invoice_no: invoice_no.trim(),
        date_time: parsedDate,
        vehicle_no: vehicle_no?.trim() || null,
        customer_name: customer_name.trim(),
        customer_phone_number: customer_phone_number.trim(),
        payment_method,
        product,
        seller,
        price,
        quantity,
        total_amount,
        discount: discount || 0,
        is_sent_sms: is_sent_sms || false,
      });
    } catch (createError: any) {
      return res.status(400).send({
        status: false,
        message: createError.message || "Failed to create invoice due to validation error",
      });
    }

    // Populate references for response
    await newInvoice.populate([
      { path: "product", select: "name purchases sell" },
      { path: "seller", select: "name email" },
    ]);

    if (is_sent_sms == true) {
      const smsTemplate = await SMSTemplate.findOne({ isActive: true }).sort({ createdAt: -1 }).exec();
      console.log(smsTemplate);
      if (smsTemplate && smsTemplate.body) {
        const message = formatSms(smsTemplate.body, newInvoice);
        await sendSMS(customer_phone_number, message);
      }
    }

    return res.status(201).send({
      status: true,
      message: "Invoice created successfully.",
      invoice: newInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
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

    // Payment method filter
    if (payment_method && payment_method.trim()) {
      query.payment_method = payment_method;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) {
        query.date_time.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date_time.$lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    const total = await Invoice.countDocuments(query);

    // Sorting
    let sortObj: any = { createdAt: -1 };
    if (sort) {
      switch (sort) {
        case "invoice_no_asc":
          sortObj = { invoice_no: 1 };
          break;
        case "invoice_no_desc":
          sortObj = { invoice_no: -1 };
          break;
        case "date_time_asc":
          sortObj = { date_time: 1 };
          break;
        case "date_time_desc":
          sortObj = { date_time: -1 };
          break;
        case "customer_name_asc":
          sortObj = { customer_name: 1 };
          break;
        case "customer_name_desc":
          sortObj = { customer_name: -1 };
          break;
        case "total_amount_asc":
          sortObj = { total_amount: 1 };
          break;
        case "total_amount_desc":
          sortObj = { total_amount: -1 };
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

    const invoices = await Invoice.find(query)
      .populate([
        { path: "product", select: "name purchases sell" },
        { path: "seller", select: "name email" },
      ])
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

export const getInvoiceById = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        status: false,
        message: "Invalid invoice ID.",
      });
    }

    const invoice = await Invoice.findById(id).populate([
      { path: "product", select: "name purchases sell" },
      { path: "seller", select: "name email" },
    ]);

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
    console.error("Error fetching invoice:", error);
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

    // Check if invoice number is being changed and if it already exists
    if (invoice_no && invoice_no.trim() !== invoice.invoice_no) {
      const existingInvoice = await Invoice.findOne({ invoice_no: invoice_no.trim() });
      if (existingInvoice) {
        return res.status(400).send({
          status: false,
          message: "Invoice number already exists.",
        });
      }
      invoice.invoice_no = invoice_no.trim();
    }

    if (date_time) {
      // Parse and validate the date
      let parsedDate;
      try {
        // Handle both ISO string and custom format
        if (typeof date_time === "string" && date_time.includes("T")) {
          parsedDate = new Date(date_time);
        } else if (typeof date_time === "string") {
          // Parse custom format: "YYYY-MM-DD HH:MM"
          const [datePart, timePart] = date_time.split(" ");
          if (datePart && timePart) {
            const [year, month, day] = datePart.split("-");
            const [hour, minute] = timePart.split(":");
            parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
          } else {
            parsedDate = new Date(date_time);
          }
        } else {
          parsedDate = new Date(date_time);
        }

        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid date format");
        }

        invoice.date_time = parsedDate;
      } catch (dateError) {
        return res.status(400).send({
          status: false,
          message: "Invalid date format. Please use YYYY-MM-DD HH:MM format or ISO string.",
        });
      }
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

    if (payment_method) {
      invoice.payment_method = payment_method;
    }

    if (product && Types.ObjectId.isValid(product)) {
      // Verify product exists
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

    if (discount !== undefined) {
      invoice.discount = discount;
    }

    if (is_sent_sms !== undefined) {
      invoice.is_sent_sms = is_sent_sms;
    }

    // Recalculate total amount if price, quantity, or discount changed
    if (price !== undefined || quantity !== undefined || discount !== undefined) {
      invoice.total_amount = invoice.price * invoice.quantity - invoice.discount;
    }

    // Validate total amount
    if (total_amount !== undefined) {
      const calculatedTotal = invoice.price * invoice.quantity - invoice.discount;
      if (Math.abs(total_amount - calculatedTotal) > 0.01) {
        return res.status(400).send({
          status: false,
          message: `Total amount must equal price (${invoice.price}) × quantity (${invoice.quantity}) - discount (${invoice.discount}) = ${calculatedTotal}`,
        });
      }
      invoice.total_amount = total_amount;
    }

    await invoice.save();

    // Populate references for response
    await invoice.populate([
      { path: "product", select: "name purchases sell" },
      { path: "seller", select: "name email" },
    ]);

    return res.status(200).send({
      status: true,
      message: "Invoice updated successfully.",
      invoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res.status(500).send({
      status: false,
      message: "HTTP 500 Internal Server Error",
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
      message:
        result.deletedCount === 1
          ? "1 invoice deleted successfully."
          : `${result.deletedCount} invoices deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting invoices:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const exportInvoices = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { search, sort, payment_method, startDate, endDate } = req.query;

    const query: any = {};

    // Apply filters
    if (search && search.toString().trim()) {
      query.$or = [
        { invoice_no: { $regex: search.toString().trim(), $options: "i" } },
        { customer_name: { $regex: search.toString().trim(), $options: "i" } },
        { customer_phone_number: { $regex: search.toString().trim(), $options: "i" } },
        { vehicle_no: { $regex: search.toString().trim(), $options: "i" } },
      ];
    }

    if (payment_method && payment_method.toString().trim()) {
      query.payment_method = payment_method;
    }

    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) {
        query.date_time.$gte = new Date(startDate.toString());
      }
      if (endDate) {
        query.date_time.$lte = new Date(endDate.toString() + "T23:59:59.999Z");
      }
    }

    // Sorting
    let sortObj: any = { createdAt: -1 };
    if (sort) {
      switch (sort) {
        case "invoice_no_asc":
          sortObj = { invoice_no: 1 };
          break;
        case "date_time_asc":
          sortObj = { date_time: 1 };
          break;
        case "customer_name_asc":
          sortObj = { customer_name: 1 };
          break;
        case "total_amount_asc":
          sortObj = { total_amount: 1 };
          break;
        default:
          sortObj = { createdAt: -1 };
      }
    }

    const invoices = await Invoice.find(query)
      .populate([
        { path: "product", select: "name" },
        { path: "seller", select: "name email" },
      ])
      .sort(sortObj)
      .lean();

    // Convert to CSV format
    const csvHeaders = [
      "Invoice Number",
      "Date & Time",
      "Vehicle Number",
      "Customer Name",
      "Customer Phone",
      "Payment Method",
      "Product",
      "Seller",
      "Price",
      "Quantity",
      "Total Amount",
      "Discount",
      "SMS Sent",
      "Created At",
    ];

    const csvRows = invoices.map((invoice) => [
      invoice.invoice_no,
      new Date(invoice.date_time).toLocaleString(),
      invoice.vehicle_no || "",
      invoice.customer_name,
      invoice.customer_phone_number,
      invoice.payment_method,
      (invoice.product as any)?.name || "",
      (invoice.seller as any)?.name || "",
      invoice.price,
      invoice.quantity,
      invoice.total_amount,
      invoice.discount,
      invoice.is_sent_sms ? "Yes" : "No",
      invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : "",
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map((row) =>
        row
          .map((field) => {
            // Handle fields that might contain commas or quotes
            const fieldStr = String(field || "");
            if (fieldStr.includes(",") || fieldStr.includes('"') || fieldStr.includes("\n")) {
              return `"${fieldStr.replace(/"/g, '""')}"`;
            }
            return fieldStr;
          })
          .join(",")
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=invoices-${new Date().toISOString().split("T")[0]}.csv`);

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting invoices:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};
