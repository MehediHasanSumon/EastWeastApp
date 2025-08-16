import { Request, Response } from "express";
import { Types } from "mongoose";
import Invoice from "../../models/Invoice";
import Product from "../../models/Product";
import Users from "../../models/Users";

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

    // Get the authenticated user (seller)
    const seller = (req as any).user?._id || (req as any).user?.id;
    if (!seller) {
      return res.status(401).send({
        status: false,
        message: "Unauthorized. Please login to create invoice.",
      });
    }

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
      seller,
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
      invoice: newInvoice,
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
    // Get the authenticated user (seller) - filter by seller
    const seller = (req as any).user?._id || (req as any).user?.id;
    if (!seller) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized. Please login to view invoices.",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const search = req.query.search as string;
    const sort = req.query.sort as string;
    const status = req.query.status as string;
    const payment_method = req.query.payment_method as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const product = req.query.product as string;
    const customer = req.query.customer as string;
    const minAmount = req.query.minAmount as string;
    const maxAmount = req.query.maxAmount as string;

    // Validate pagination parameters
    if (page < 1 || perPage < 1 || perPage > 100) {
      return res.status(400).json({
        status: false,
        message: "Invalid pagination parameters. Page must be >= 1, perPage must be between 1 and 100.",
      });
    }

    const query: any = { seller };

    // Build search query efficiently
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { invoice_no: searchRegex },
        { customer_name: searchRegex },
        { customer_phone_number: searchRegex },
        { vehicle_no: searchRegex },
      ];
    }

    // Apply filters
    if (status && ["pending", "paid", "cancelled"].includes(status)) {
      query.status = status;
    }

    if (payment_method && ["cash", "card", "bank_transfer", "credit", "due"].includes(payment_method)) {
      query.payment_method = payment_method;
    }

    if (product && Types.ObjectId.isValid(product)) {
      query.product = product;
    }

    // Customer filter - merge with search if both exist
    if (customer && customer.trim()) {
      const customerRegex = { $regex: customer.trim(), $options: "i" };
      if (query.$or) {
        query.$or.push(
          { customer_name: customerRegex },
          { customer_phone_number: customerRegex }
        );
      } else {
        query.$or = [
          { customer_name: customerRegex },
          { customer_phone_number: customerRegex },
        ];
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.total_amount = {};
      if (minAmount && !isNaN(parseFloat(minAmount))) {
        query.total_amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount && !isNaN(parseFloat(maxAmount))) {
        query.total_amount.$lte = parseFloat(maxAmount);
      }
    }

    // Date range filter with proper timezone handling
    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        query.date_time.$gte = startDateTime;
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.date_time.$lte = endDateTime;
      }
    }

    // Clean up empty $or arrays
    if (query.$or && query.$or.length === 0) {
      delete query.$or;
    }

    // Build sort object
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

    // Execute query with proper population and pagination
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate("product", "name purchases sell")
        .populate("seller", "name email")
        .sort(sortObj)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean()
        .exec(),
      Invoice.countDocuments(query).exec()
    ]);

    // Calculate pagination metadata
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
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    
    // Check if it's a database connection error
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({
        status: false,
        message: "Database connection error. Please try again later.",
      });
    }

    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: false,
        message: "Invalid query parameters.",
      });
    }

    return res.status(500).json({
      status: false,
      message: "Internal server error. Please try again later.",
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

    const invoice = await Invoice.findById(id)
      .populate("product", "name purchases sell")
      .populate("seller", "name email");

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

    const updatedInvoice = await Invoice.findById(id)
      .populate("product", "name purchases sell")
      .populate("seller", "name email");

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
    ).populate("product", "name purchases sell")
     .populate("seller", "name email");

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

// Reports endpoints
export const getReportStats = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const status = req.query.status as string;
    const payment_method = req.query.payment_method as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const query: any = {};

    // Get the authenticated user (seller) - filter by seller
    const seller = (req as any).user?._id || (req as any).user?.id;
    if (!seller) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized. Please login to view reports.",
      });
    }

    // Always filter by seller for security
    query.seller = seller;

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
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        query.date_time.$gte = startDateTime;
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.date_time.$lte = endDateTime;
      }
    }

    // Use aggregation pipeline for better performance
    const aggregationPipeline = [
      { $match: query },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalRevenue: { $sum: "$total_amount" },
          totalProfit: {
            $sum: {
              $multiply: [
                { $subtract: ["$product.sell", "$product.purchases"] },
                "$quantity"
              ]
            }
          },
          pendingInvoices: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          paidInvoices: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] }
          },
          cancelledInvoices: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
          },
          paymentMethods: {
            $push: {
              method: "$payment_method",
              amount: "$total_amount"
            }
          },
          products: {
            $push: {
              product: "$product.name",
              quantity: "$quantity",
              revenue: "$total_amount"
            }
          }
        }
      }
    ];

    const [statsResult] = await Invoice.aggregate(aggregationPipeline);

    if (!statsResult) {
      // No data found, return empty stats
      return res.status(200).json({
        status: true,
        totalInvoices: 0,
        totalRevenue: 0,
        totalProfit: 0,
        averageOrderValue: 0,
        pendingInvoices: 0,
        paidInvoices: 0,
        cancelledInvoices: 0,
        topProducts: [],
        paymentMethodStats: [],
        dailyStats: []
      });
    }

    const {
      totalInvoices,
      totalRevenue,
      totalProfit,
      pendingInvoices,
      paidInvoices,
      cancelledInvoices,
      paymentMethods,
      products
    } = statsResult;

    const averageOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // Process top products
    const productRevenue = new Map();
    products.forEach((item: any) => {
      const current = productRevenue.get(item.product) || { quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.revenue;
      productRevenue.set(item.product, current);
    });

    const topProducts = Array.from(productRevenue.entries())
      .map(([product, data]: [string, any]) => ({
        product,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Process payment method statistics
    const paymentMethodStats = new Map();
    paymentMethods.forEach((item: any) => {
      const current = paymentMethodStats.get(item.method) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += item.amount;
      paymentMethodStats.set(item.method, current);
    });

    const paymentMethodStatsArray = Array.from(paymentMethodStats.entries())
      .map(([method, data]: [string, any]) => ({
        method,
        count: data.count,
        amount: data.amount
      }));

    // Generate daily statistics for the last 30 days
    const dailyStats = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Get daily stats using aggregation
      const dailyQuery = { ...query };
      dailyQuery.date_time = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lte: new Date(date.setHours(23, 59, 59, 999))
      };

      const dailyAggregation = [
        { $match: dailyQuery },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: null,
            invoices: { $sum: 1 },
            revenue: { $sum: "$total_amount" },
            profit: {
              $sum: {
                $multiply: [
                  { $subtract: ["$product.sell", "$product.purchases"] },
                  "$quantity"
                ]
              }
            }
          }
        }
      ];

      const [dailyResult] = await Invoice.aggregate(dailyAggregation);
      
      dailyStats.push({
        date: dateStr,
        invoices: dailyResult?.invoices || 0,
        revenue: dailyResult?.revenue || 0,
        profit: dailyResult?.profit || 0
      });
    }

    const result = {
      status: true,
      totalInvoices,
      totalRevenue,
      totalProfit,
      averageOrderValue,
      pendingInvoices,
      paidInvoices,
      cancelledInvoices,
      topProducts,
      paymentMethodStats: paymentMethodStatsArray,
      dailyStats
    };

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error fetching report stats:", error);
    
    // Check if it's a database connection error
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({
        status: false,
        message: "Database connection error. Please try again later.",
      });
    }

    return res.status(500).json({
      status: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

export const exportReport = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const format = req.query.format as string;
    const status = req.query.status as string;
    const payment_method = req.query.payment_method as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const product = req.query.product as string;
    const customer = req.query.customer as string;
    const minAmount = req.query.minAmount as string;
    const maxAmount = req.query.maxAmount as string;

    // Validate export format
    if (!format || !['pdf', 'excel'].includes(format)) {
      return res.status(400).json({
        status: false,
        message: "Invalid export format. Must be 'pdf' or 'excel'.",
      });
    }

    const query: any = {};

    // Get the authenticated user (seller) - filter by seller
    const seller = (req as any).user?._id || (req as any).user?.id;
    if (!seller) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized. Please login to export reports.",
      });
    }

    // Always filter by seller for security
    query.seller = seller;

    // Apply filters
    if (status && ["pending", "paid", "cancelled"].includes(status)) {
      query.status = status;
    }

    if (payment_method && ["cash", "card", "bank_transfer", "credit", "due"].includes(payment_method)) {
      query.payment_method = payment_method;
    }

    if (product && Types.ObjectId.isValid(product)) {
      query.product = product;
    }

    if (customer && customer.trim()) {
      query.$or = [
        { customer_name: { $regex: customer.trim(), $options: "i" } },
        { customer_phone_number: { $regex: customer.trim(), $options: "i" } },
      ];
    }

    if (minAmount || maxAmount) {
      query.total_amount = {};
      if (minAmount && !isNaN(parseFloat(minAmount))) {
        query.total_amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount && !isNaN(parseFloat(maxAmount))) {
        query.total_amount.$lte = parseFloat(maxAmount);
      }
    }

    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        query.date_time.$gte = startDateTime;
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.date_time.$lte = endDateTime;
      }
    }

    // Use aggregation for better performance
    const aggregationPipeline: any[] = [
      { $match: query },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "seller"
        }
      },
      { $unwind: "$seller" },
      {
        $project: {
          invoice_no: 1,
          date_time: 1,
          customer_name: 1,
          customer_phone_number: 1,
          product_name: "$product.name",
          price: 1,
          quantity: 1,
          total_amount: 1,
          discount: 1,
          payment_method: 1,
          status: 1,
          seller_name: "$seller.name",
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    const invoices = await Invoice.aggregate(aggregationPipeline);

    if (format === 'pdf') {
      // For now, return JSON data. PDF generation can be implemented later
      return res.status(200).json({
        status: true,
        message: "PDF export functionality will be implemented",
        data: invoices
      });
    } else {
      // Excel format - return CSV data
      const csvData = generateCSV(invoices);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-report-${new Date().toISOString().split('T')[0]}.csv`);
      return res.status(200).send(csvData);
    }
  } catch (error: any) {
    console.error("Error exporting report:", error);
    
    // Check if it's a database connection error
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({
        status: false,
        message: "Database connection error. Please try again later.",
      });
    }

    return res.status(500).json({
      status: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// Helper function to generate CSV
const generateCSV = (invoices: any[]): string => {
  const headers = [
    'Invoice No',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Product',
    'Price',
    'Quantity',
    'Total Amount',
    'Discount',
    'Payment Method',
    'Status',
    'Seller',
    'Created At'
  ];

  const rows = invoices.map(invoice => [
    invoice.invoice_no,
    new Date(invoice.date_time).toLocaleDateString(),
    invoice.customer_name,
    invoice.customer_phone_number,
    invoice.product_name || '',
    invoice.price,
    invoice.quantity,
    invoice.total_amount,
    invoice.discount,
    invoice.payment_method,
    invoice.status,
    invoice.seller_name || '',
    new Date(invoice.createdAt).toLocaleDateString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
};