import { Request, Response } from "express";
import Invoice from "../../models/Invoice";
import Product from "../../models/Product";
import User from "../../models/Users";

export const getReportStats = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { startDate, endDate, status, payment_method } = req.query;

    const query: any = {};

    // Date range filter
    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) {
        query.date_time.$gte = new Date(startDate.toString());
      }
      if (endDate) {
        query.date_time.$lte = new Date(endDate.toString() + 'T23:59:59.999Z');
      }
    }

    // Status filter (if we had status field)
    // if (status && status.toString().trim()) {
    //   query.status = status;
    // }

    // Payment method filter
    if (payment_method && payment_method.toString().trim()) {
      query.payment_method = payment_method;
    }

    // Get all invoices for the period
    const invoices = await Invoice.find(query)
      .populate([
        { path: 'product', select: 'name purchases sell' },
        { path: 'seller', select: 'name email' }
      ])
      .lean();

    // Calculate basic stats
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    
    // Calculate profit (sell price - purchase price) * quantity
    const totalProfit = invoices.reduce((sum, invoice) => {
      const product = invoice.product as any;
      if (product && product.purchases && product.sell) {
        const profitPerUnit = product.sell - product.purchases;
        return sum + (profitPerUnit * invoice.quantity);
      }
      return sum;
    }, 0);

    const averageOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // Status counts (if we had status field)
    // const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
    // const paidInvoices = invoices.filter(invoice => invoice.status === 'paid').length;
    // const cancelledInvoices = invoices.filter(invoice => invoice.status === 'cancelled').length;

    // Top products by quantity and revenue
    const productStats = new Map();
    invoices.forEach(invoice => {
      const product = invoice.product as any;
      if (product) {
        const productName = product.name;
        if (!productStats.has(productName)) {
          productStats.set(productName, { product: productName, quantity: 0, revenue: 0 });
        }
        const stats = productStats.get(productName);
        stats.quantity += invoice.quantity;
        stats.revenue += invoice.total_amount;
      }
    });

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Payment method statistics
    const paymentMethodStats = new Map();
    invoices.forEach(invoice => {
      const method = invoice.payment_method;
      if (!paymentMethodStats.has(method)) {
        paymentMethodStats.set(method, { method, count: 0, amount: 0 });
      }
      const stats = paymentMethodStats.get(method);
      stats.count += 1;
      stats.amount += invoice.total_amount;
    });

    const paymentMethodStatsArray = Array.from(paymentMethodStats.values())
      .sort((a, b) => b.amount - a.amount);

    // Daily statistics
    const dailyStats = new Map();
    invoices.forEach(invoice => {
      const date = new Date(invoice.date_time).toISOString().split('T')[0];
      if (!dailyStats.has(date)) {
        dailyStats.set(date, { date, invoices: 0, revenue: 0, profit: 0 });
      }
      const stats = dailyStats.get(date);
      stats.invoices += 1;
      stats.revenue += invoice.total_amount;
      
      const product = invoice.product as any;
      if (product && product.purchases && product.sell) {
        const profitPerUnit = product.sell - product.purchases;
        stats.profit += (profitPerUnit * invoice.quantity);
      }
    });

    const dailyStatsArray = Array.from(dailyStats.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days

    return res.status(200).json({
      status: true,
      totalInvoices,
      totalRevenue,
      totalProfit,
      averageOrderValue,
      // pendingInvoices,
      // paidInvoices,
      // cancelledInvoices,
      topProducts,
      paymentMethodStats: paymentMethodStatsArray,
      dailyStats: dailyStatsArray,
    });
  } catch (error) {
    console.error("Error fetching report stats:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const getDetailedReport = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 20;
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

    const query: any = {};

    // Search functionality
    if (search && search.trim()) {
      query.$or = [
        { invoice_no: { $regex: search.trim(), $options: "i" } },
        { customer_name: { $regex: search.trim(), $options: "i" } },
        { customer_phone_number: { $regex: search.trim(), $options: "i" } },
        { vehicle_no: { $regex: search.trim(), $options: "i" } }
      ];
    }

    // Status filter (if we had status field)
    // if (status && status.trim()) {
    //   query.status = status;
    // }

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
        query.date_time.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Product filter
    if (product && product.trim()) {
      const productDoc = await Product.findOne({ name: { $regex: product.trim(), $options: "i" } });
      if (productDoc) {
        query.product = productDoc._id;
      }
    }

    // Customer filter
    if (customer && customer.trim()) {
      query.$or = [
        { customer_name: { $regex: customer.trim(), $options: "i" } },
        { customer_phone_number: { $regex: customer.trim(), $options: "i" } }
      ];
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.total_amount = {};
      if (minAmount) {
        query.total_amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        query.total_amount.$lte = parseFloat(maxAmount);
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
        { path: 'product', select: 'name purchases sell' },
        { path: 'seller', select: 'name email' }
      ])
      .sort(sortObj)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    // Calculate additional fields for each invoice
    const enhancedInvoices = invoices.map(invoice => {
      const product = invoice.product as any;
      let profit = 0;
      let profitMargin = 0;
      
      if (product && product.purchases && product.sell) {
        profit = (product.sell - product.purchases) * invoice.quantity;
        profitMargin = product.purchases > 0 ? ((product.sell - product.purchases) / product.purchases) * 100 : 0;
      }

      return {
        ...invoice,
        profit,
        profitMargin,
        calculatedTotal: (invoice.price * invoice.quantity) - invoice.discount
      };
    });

    const lastPage = Math.ceil(total / perPage);
    const from = total > 0 ? (page - 1) * perPage + 1 : 0;
    const to = Math.min((page - 1) * perPage + invoices.length, total);

    return res.status(200).json({
      status: true,
      invoices: enhancedInvoices,
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
    console.error("Error fetching detailed report:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const exportReport = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { 
      format, 
      startDate, 
      endDate, 
      status, 
      payment_method, 
      product, 
      customer, 
      minAmount, 
      maxAmount 
    } = req.query;

    const query: any = {};

    // Apply all filters
    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) {
        query.date_time.$gte = new Date(startDate.toString());
      }
      if (endDate) {
        query.date_time.$lte = new Date(endDate.toString() + 'T23:59:59.999Z');
      }
    }

    // if (status && status.toString().trim()) {
    //   query.status = status;
    // }

    if (payment_method && payment_method.toString().trim()) {
      query.payment_method = payment_method;
    }

    if (product && product.toString().trim()) {
      const productDoc = await Product.findOne({ name: { $regex: product.toString().trim(), $options: "i" } });
      if (productDoc) {
        query.product = productDoc._id;
      }
    }

    if (customer && customer.toString().trim()) {
      query.$or = [
        { customer_name: { $regex: customer.toString().trim(), $options: "i" } },
        { customer_phone_number: { $regex: customer.toString().trim(), $options: "i" } }
      ];
    }

    if (minAmount || maxAmount) {
      query.total_amount = {};
      if (minAmount) {
        query.total_amount.$gte = parseFloat(minAmount.toString());
      }
      if (maxAmount) {
        query.total_amount.$lte = parseFloat(maxAmount.toString());
      }
    }

    const invoices = await Invoice.find(query)
      .populate([
        { path: 'product', select: 'name purchases sell' },
        { path: 'seller', select: 'name email' }
      ])
      .sort({ date_time: -1 })
      .lean();

    if (format === 'excel' || format === 'xlsx') {
      // For now, return CSV format (Excel can open CSV files)
      const csvHeaders = [
        'Invoice Number',
        'Date & Time',
        'Vehicle Number',
        'Customer Name',
        'Customer Phone',
        'Payment Method',
        'Product',
        'Seller',
        'Price',
        'Quantity',
        'Total Amount',
        'Discount',
        'Profit',
        'Profit Margin %',
        'SMS Sent',
        'Created At'
      ];

      const csvRows = invoices.map(invoice => {
        const product = invoice.product as any;
        let profit = 0;
        let profitMargin = 0;
        
        if (product && product.purchases && product.sell) {
          profit = (product.sell - product.purchases) * invoice.quantity;
          profitMargin = product.purchases > 0 ? ((product.sell - product.purchases) / product.purchases) * 100 : 0;
        }

        return [
          invoice.invoice_no,
          new Date(invoice.date_time).toLocaleString(),
          invoice.vehicle_no || '',
          invoice.customer_name,
          invoice.customer_phone_number,
          invoice.payment_method,
          product?.name || '',
          (invoice.seller as any)?.name || '',
          invoice.price,
          invoice.quantity,
          invoice.total_amount,
          invoice.discount,
          profit.toFixed(2),
          profitMargin.toFixed(2),
          invoice.is_sent_sms ? 'Yes' : 'No',
          invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : ''
        ];
      });

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => {
          const fieldStr = String(field || '');
          if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
            return `"${fieldStr.replace(/"/g, '""')}"`;
          }
          return fieldStr;
        }).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-report-${new Date().toISOString().split('T')[0]}.csv`);
      
      return res.status(200).send(csvContent);
    } else if (format === 'pdf') {
      // For PDF, return a simple text response for now
      // In production, you would use a library like PDFKit or Puppeteer
      return res.status(200).json({
        status: true,
        message: "PDF export not implemented yet. Please use Excel format.",
        format: format,
        recordCount: invoices.length
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Unsupported export format. Use 'excel' or 'pdf'.",
      });
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const getProductPerformanceReport = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { startDate, endDate } = req.query;

    const query: any = {};

    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) {
        query.date_time.$gte = new Date(startDate.toString());
      }
      if (endDate) {
        query.date_time.$lte = new Date(endDate.toString() + 'T23:59:59.999Z');
      }
    }

    const invoices = await Invoice.find(query)
      .populate([
        { path: 'product', select: 'name purchases sell' }
      ])
      .lean();

    const productStats = new Map();

    invoices.forEach(invoice => {
      const product = invoice.product as any;
      if (product) {
        const productName = product.name;
        if (!productStats.has(productName)) {
          productStats.set(productName, {
            product: productName,
            totalQuantity: 0,
            totalRevenue: 0,
            totalProfit: 0,
            averagePrice: 0,
            invoiceCount: 0
          });
        }

        const stats = productStats.get(productName);
        stats.totalQuantity += invoice.quantity;
        stats.totalRevenue += invoice.total_amount;
        stats.invoiceCount += 1;

        if (product.purchases && product.sell) {
          const profit = (product.sell - product.purchases) * invoice.quantity;
          stats.totalProfit += profit;
        }
      }
    });

    // Calculate average price for each product
    productStats.forEach(stats => {
      if (stats.invoiceCount > 0) {
        stats.averagePrice = stats.totalRevenue / stats.totalQuantity;
      }
    });

    const productPerformanceArray = Array.from(productStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return res.status(200).json({
      status: true,
      productPerformance: productPerformanceArray,
      totalProducts: productPerformanceArray.length
    });
  } catch (error) {
    console.error("Error fetching product performance report:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};

export const getCustomerAnalysisReport = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { startDate, endDate } = req.query;

    const query: any = {};

    if (startDate || endDate) {
      query.date_time = {};
      if (startDate) {
        query.date_time.$gte = new Date(startDate.toString());
      }
      if (endDate) {
        query.date_time.$lte = new Date(endDate.toString() + 'T23:59:59.999Z');
      }
    }

    const invoices = await Invoice.find(query)
      .populate([
        { path: 'product', select: 'name purchases sell' }
      ])
      .lean();

    const customerStats = new Map();

    invoices.forEach(invoice => {
      const customerKey = `${invoice.customer_name}-${invoice.customer_phone_number}`;
      
      if (!customerStats.has(customerKey)) {
        customerStats.set(customerKey, {
          customerName: invoice.customer_name,
          customerPhone: invoice.customer_phone_number,
          totalInvoices: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          firstPurchase: invoice.date_time,
          lastPurchase: invoice.date_time,
          favoriteProducts: new Map()
        });
      }

      const stats = customerStats.get(customerKey);
      stats.totalInvoices += 1;
      stats.totalSpent += invoice.total_amount;
      
      if (new Date(invoice.date_time) < new Date(stats.firstPurchase)) {
        stats.firstPurchase = invoice.date_time;
      }
      if (new Date(invoice.date_time) > new Date(stats.lastPurchase)) {
        stats.lastPurchase = invoice.date_time;
      }

      // Track favorite products
      const product = invoice.product as any;
      if (product) {
        const productName = product.name;
        if (!stats.favoriteProducts.has(productName)) {
          stats.favoriteProducts.set(productName, 0);
        }
        stats.favoriteProducts.set(productName, stats.favoriteProducts.get(productName) + invoice.quantity);
      }
    });

    // Calculate average order value and convert favorite products to array
    const customerAnalysisArray = Array.from(customerStats.values()).map(stats => {
      const favoriteProducts = Array.from(stats.favoriteProducts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([product, quantity]) => ({ product, quantity }));

      return {
        customerName: stats.customerName,
        customerPhone: stats.customerPhone,
        totalInvoices: stats.totalInvoices,
        totalSpent: stats.totalSpent,
        averageOrderValue: stats.totalSpent / stats.totalInvoices,
        firstPurchase: stats.firstPurchase,
        lastPurchase: stats.lastPurchase,
        favoriteProducts
      };
    });

    // Sort by total spent
    customerAnalysisArray.sort((a, b) => b.totalSpent - a.totalSpent);

    return res.status(200).json({
      status: true,
      customerAnalysis: customerAnalysisArray,
      totalCustomers: customerAnalysisArray.length
    });
  } catch (error) {
    console.error("Error fetching customer analysis report:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
    });
  }
};
