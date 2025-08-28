import { Request, Response } from "express";
import Invoice from "../../models/Invoice";
import Product from "../../models/Product";
import User from "../../models/Users";

// Helper functions for date operations
const startOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const endOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

const subDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - days);
  return newDate;
};

const startOfMonth = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const endOfMonth = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + 1);
  newDate.setDate(0);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

const startOfYear = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setMonth(0, 1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const endOfYear = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setMonth(11, 31);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

// Get comprehensive dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { period = "30", startDate, endDate } = req.query;

    let query: any = {};
    let dateFilter: any = {};

    // Handle different time periods
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate.toString()),
        $lte: new Date(endDate.toString() + 'T23:59:59.999Z')
      };
    } else {
      const days = parseInt(period.toString());
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      dateFilter = {
        $gte: startDate,
        $lte: endDate
      };
    }

    query.date_time = dateFilter;

    // Get invoices for the period
    const invoices = await Invoice.find(query)
      .populate([
        { path: 'product', select: 'name purchases sell' },
        { path: 'seller', select: 'name email' }
      ])
      .lean();

    // Calculate basic stats
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const totalQuantity = invoices.reduce((sum, invoice) => sum + invoice.quantity, 0);
    
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
    const averageProfitPerOrder = totalInvoices > 0 ? totalProfit / totalInvoices : 0;

    // Get comprehensive user and product counts
    const totalUsers = await User.countDocuments({ status: true });
    const totalProducts = await Product.countDocuments({ status: true });
    const totalActiveUsers = await User.countDocuments({ status: true, verify_at: { $ne: null } });
    const totalVerifiedUsers = await User.countDocuments({ verify_at: { $ne: null } });

    // Get product inventory overview
    const products = await Product.find({ status: true }).lean();
    const totalProductValue = products.reduce((sum, product) => sum + (product.purchases * 0), 0); // Assuming 0 as default quantity
    const totalSellValue = products.reduce((sum, product) => sum + (product.sell * 0), 0);

    // Top products by revenue
    const productStats = new Map();
    invoices.forEach(invoice => {
      const product = invoice.product as any;
      if (product) {
        const productName = product.name;
        if (!productStats.has(productName)) {
          productStats.set(productName, { 
            product: productName, 
            quantity: 0, 
            revenue: 0,
            profit: 0 
          });
        }
        const stats = productStats.get(productName);
        stats.quantity += invoice.quantity;
        stats.revenue += invoice.total_amount;
        
        if (product.purchases && product.sell) {
          const profitPerUnit = product.sell - product.purchases;
          stats.profit += (profitPerUnit * invoice.quantity);
        }
      }
    });

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

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

    // Daily statistics for charts
    const dailyStats = new Map();
    invoices.forEach(invoice => {
      const date = new Date(invoice.date_time).toISOString().split('T')[0];
      if (!dailyStats.has(date)) {
        dailyStats.set(date, { 
          date, 
          invoices: 0, 
          revenue: 0, 
          profit: 0,
          quantity: 0 
        });
      }
      const stats = dailyStats.get(date);
      stats.invoices += 1;
      stats.revenue += invoice.total_amount;
      stats.quantity += invoice.quantity;
      
      const product = invoice.product as any;
      if (product && product.purchases && product.sell) {
        const profitPerUnit = product.sell - product.purchases;
        stats.profit += (profitPerUnit * invoice.quantity);
      }
    });

    const dailyStatsArray = Array.from(dailyStats.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Monthly statistics
    const monthlyStats = new Map();
    invoices.forEach(invoice => {
      const month = new Date(invoice.date_time).toISOString().substring(0, 7); // YYYY-MM format
      if (!monthlyStats.has(month)) {
        monthlyStats.set(month, { 
          month, 
          invoices: 0, 
          revenue: 0, 
          profit: 0,
          quantity: 0 
        });
      }
      const stats = monthlyStats.get(month);
      stats.invoices += 1;
      stats.revenue += invoice.total_amount;
      stats.quantity += invoice.quantity;
      
      const product = invoice.product as any;
      if (product && product.purchases && product.sell) {
        const profitPerUnit = product.sell - product.purchases;
        stats.profit += (profitPerUnit * invoice.quantity);
      }
    });

    const monthlyStatsArray = Array.from(monthlyStats.values())
      .sort((a, b) => a.month.localeCompare(b.month));

    // Top sellers
    const sellerStats = new Map();
    invoices.forEach(invoice => {
      const seller = invoice.seller as any;
      if (seller) {
        const sellerName = seller.name;
        if (!sellerStats.has(sellerName)) {
          sellerStats.set(sellerName, { 
            seller: sellerName, 
            invoices: 0, 
            revenue: 0,
            quantity: 0 
          });
        }
        const stats = sellerStats.get(sellerName);
        stats.invoices += 1;
        stats.revenue += invoice.total_amount;
        stats.quantity += invoice.quantity;
      }
    });

    const topSellers = Array.from(sellerStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent activity (latest invoices)
    const recentInvoices = await Invoice.find(query)
      .populate([
        { path: 'product', select: 'name' },
        { path: 'seller', select: 'name' }
      ])
      .sort({ date_time: -1 })
      .limit(10)
      .lean();

    // Get recent users and products
    const recentUsers = await User.find({ status: true })
      .select('name email createdAt status verify_at')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentProducts = await Product.find({ status: true })
      .select('name purchases sell createdAt status')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.status(200).json({
      status: true,
      message: "Dashboard statistics retrieved successfully",
      data: {
        overview: {
          totalInvoices,
          totalRevenue,
          totalProfit,
          totalQuantity,
          totalUsers,
          totalActiveUsers,
          totalVerifiedUsers,
          totalProducts,
          totalProductValue,
          totalSellValue,
          averageOrderValue,
          averageProfitPerOrder
        },
        topProducts,
        topSellers,
        paymentMethodStats: paymentMethodStatsArray,
        dailyStats: dailyStatsArray,
        monthlyStats: monthlyStatsArray,
        recentInvoices,
        recentUsers,
        recentProducts
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
};

// Get comprehensive dashboard overview with all data
export const getDashboardOverview = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    // Get all users with detailed info
    const allUsers = await User.find({ status: true })
      .select('name email createdAt status verify_at roles address phone profile_picture bio date_of_birth profession')
      .populate('roles', 'name')
      .lean();

    // Get all products with detailed info
    const allProducts = await Product.find({ status: true })
      .select('name purchases sell description createdAt status')
      .lean();

    // Get all invoices with detailed info
    const allInvoices = await Invoice.find()
      .populate([
        { path: 'product', select: 'name purchases sell' },
        { path: 'seller', select: 'name email' }
      ])
      .sort({ date_time: -1 })
      .lean();

    // Calculate comprehensive statistics
    const totalUsers = allUsers.length;
    const totalProducts = allProducts.length;
    const totalInvoices = allInvoices.length;
    
    const totalRevenue = allInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const totalQuantity = allInvoices.reduce((sum, invoice) => sum + invoice.quantity, 0);
    
    // Calculate profit
    const totalProfit = allInvoices.reduce((sum, invoice) => {
      const product = invoice.product as any;
      if (product && product.purchases && product.sell) {
        const profitPerUnit = product.sell - product.purchases;
        return sum + (profitPerUnit * invoice.quantity);
      }
      return sum;
    }, 0);

    // User statistics
    const verifiedUsers = allUsers.filter(user => user.verify_at).length;
    const unverifiedUsers = totalUsers - verifiedUsers;
    const usersWithRoles = allUsers.filter(user => user.roles && user.roles.length > 0).length;
    const usersWithoutRoles = totalUsers - usersWithRoles;

    // Product statistics
    const totalProductValue = allProducts.reduce((sum, product) => sum + product.purchases, 0);
    const totalSellValue = allProducts.reduce((sum, product) => sum + product.sell, 0);
    const averageProductPrice = totalProducts > 0 ? totalSellValue / totalProducts : 0;

    // Invoice statistics by payment method
    const paymentMethodBreakdown = allInvoices.reduce((acc, invoice) => {
      const method = invoice.payment_method;
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0, quantity: 0 };
      }
      acc[method].count += 1;
      acc[method].amount += invoice.total_amount;
      acc[method].quantity += invoice.quantity;
      return acc;
    }, {} as any);

    // Monthly breakdown
    const monthlyBreakdown = allInvoices.reduce((acc, invoice) => {
      const month = new Date(invoice.date_time).toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = { invoices: 0, revenue: 0, profit: 0, quantity: 0 };
      }
      acc[month].invoices += 1;
      acc[month].revenue += invoice.total_amount;
      acc[month].quantity += invoice.quantity;
      
      const product = invoice.product as any;
      if (product && product.purchases && product.sell) {
        const profitPerUnit = product.sell - product.purchases;
        acc[month].profit += (profitPerUnit * invoice.quantity);
      }
      return acc;
    }, {} as any);

    // Top performing data
    const topProducts = allInvoices.reduce((acc, invoice) => {
      const product = invoice.product as any;
      if (product) {
        const productName = product.name;
        if (!acc[productName]) {
          acc[productName] = { name: productName, quantity: 0, revenue: 0, profit: 0 };
        }
        acc[productName].quantity += invoice.quantity;
        acc[productName].revenue += invoice.total_amount;
        
        if (product.purchases && product.sell) {
          const profitPerUnit = product.sell - product.purchases;
          acc[productName].profit += (profitPerUnit * invoice.quantity);
        }
      }
      return acc;
    }, {} as any);

    const topProductsArray = Object.values(topProducts)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    const topSellers = allInvoices.reduce((acc, invoice) => {
      const seller = invoice.seller as any;
      if (seller) {
        const sellerName = seller.name;
        if (!acc[sellerName]) {
          acc[sellerName] = { name: sellerName, invoices: 0, revenue: 0, quantity: 0 };
        }
        acc[sellerName].invoices += 1;
        acc[sellerName].revenue += invoice.total_amount;
        acc[sellerName].quantity += invoice.quantity;
      }
      return acc;
    }, {} as any);

    const topSellersArray = Object.values(topSellers)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // Recent activities
    const recentInvoices = allInvoices.slice(0, 20);
    const recentUsers = allUsers.slice(0, 10);
    const recentProducts = allProducts.slice(0, 10);

    return res.status(200).json({
      status: true,
      message: "Comprehensive dashboard overview retrieved successfully",
      data: {
        summary: {
          totalUsers,
          totalProducts,
          totalInvoices,
          totalRevenue,
          totalProfit,
          totalQuantity,
          totalProductValue,
          totalSellValue,
          averageProductPrice
        },
        userStats: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: unverifiedUsers,
          withRoles: usersWithRoles,
          withoutRoles: usersWithoutRoles
        },
        productStats: {
          total: totalProducts,
          totalValue: totalProductValue,
          totalSellValue,
          averagePrice: averageProductPrice
        },
        invoiceStats: {
          total: totalInvoices,
          totalRevenue,
          totalProfit,
          totalQuantity,
          averageOrderValue: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
          averageProfitPerOrder: totalInvoices > 0 ? totalProfit / totalInvoices : 0
        },
        paymentMethodBreakdown,
        monthlyBreakdown,
        topProducts: topProductsArray,
        topSellers: topSellersArray,
        recentInvoices,
        recentUsers,
        recentProducts,
        allUsers: allUsers.length > 100 ? allUsers.slice(0, 100) : allUsers, // Limit to 100 for performance
        allProducts: allProducts.length > 100 ? allProducts.slice(0, 100) : allProducts, // Limit to 100 for performance
        allInvoices: allInvoices.length > 100 ? allInvoices.slice(0, 100) : allInvoices // Limit to 100 for performance
      }
    });

  } catch (error) {
    console.error("Error fetching comprehensive dashboard overview:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
};

// Get dashboard summary for quick overview
export const getDashboardSummary = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    const startOfMonth = startOfMonth(today);
    const endOfMonth = endOfMonth(today);
    
    const startOfYear = startOfYear(today);
    const endOfYear = endOfYear(today);

    // Today's stats
    const todayInvoices = await Invoice.countDocuments({
      date_time: { $gte: startOfToday, $lte: endOfToday }
    });
    
    const todayRevenue = await Invoice.aggregate([
      {
        $match: {
          date_time: { $gte: startOfToday, $lte: endOfToday }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total_amount" }
        }
      }
    ]);

    // This month's stats
    const monthInvoices = await Invoice.countDocuments({
      date_time: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const monthRevenue = await Invoice.aggregate([
      {
        $match: {
          date_time: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total_amount" }
        }
      }
    ]);

    // This year's stats
    const yearInvoices = await Invoice.countDocuments({
      date_time: { $gte: startOfYear, $lte: endOfYear }
    });
    
    const yearRevenue = await Invoice.aggregate([
      {
        $match: {
          date_time: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total_amount" }
        }
      }
    ]);

    // Get pending dues
    const pendingDues = await Invoice.aggregate([
      {
        $match: {
          payment_method: "due"
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: "$total_amount" }
        }
      }
    ]);

    return res.status(200).json({
      status: true,
      message: "Dashboard summary retrieved successfully",
      data: {
        today: {
          invoices: todayInvoices,
          revenue: todayRevenue[0]?.total || 0
        },
        month: {
          invoices: monthInvoices,
          revenue: monthRevenue[0]?.total || 0
        },
        year: {
          invoices: yearInvoices,
          revenue: yearRevenue[0]?.total || 0
        },
        pendingDues: {
          count: pendingDues[0]?.count || 0,
          total: pendingDues[0]?.total || 0
        }
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
};

// Get dashboard analytics with filters
export const getDashboardAnalytics = async (req: Request, res: Response): Promise<Response | any> => {
  try {
    const { 
      startDate, 
      endDate, 
      groupBy = "day", // day, month, year
      payment_method,
      product_id 
    } = req.query;

    let query: any = {};
    let groupByFormat: string;
    let dateFormat: string;

    // Date range filter
    if (startDate && endDate) {
      query.date_time = {
        $gte: new Date(startDate.toString()),
        $lte: new Date(endDate.toString() + 'T23:59:59.999Z')
      };
    }

    // Payment method filter
    if (payment_method && payment_method.toString().trim()) {
      query.payment_method = payment_method;
    }

    // Product filter
    if (product_id && product_id.toString().trim()) {
      query.product = product_id;
    }

    // Set grouping format based on groupBy parameter
    switch (groupBy) {
      case "month":
        groupByFormat = "%Y-%m";
        dateFormat = "%Y-%m-01";
        break;
      case "year":
        groupByFormat = "%Y";
        dateFormat = "%Y-01-01";
        break;
      default:
        groupByFormat = "%Y-%m-%d";
        dateFormat = "%Y-%m-%d";
    }

    // Aggregate data
    const analytics = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupByFormat, date: "$date_time" } },
            payment_method: "$payment_method"
          },
          invoices: { $sum: 1 },
          revenue: { $sum: "$total_amount" },
          quantity: { $sum: "$quantity" }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Group by date for easier consumption
    const groupedAnalytics = new Map();
    analytics.forEach(item => {
      const date = item._id.date;
      if (!groupedAnalytics.has(date)) {
        groupedAnalytics.set(date, {
          date,
          totalInvoices: 0,
          totalRevenue: 0,
          totalQuantity: 0,
          paymentMethods: {}
        });
      }
      
      const stats = groupedAnalytics.get(date);
      stats.totalInvoices += item.invoices;
      stats.totalRevenue += item.revenue;
      stats.totalQuantity += item.quantity;
      
      if (!stats.paymentMethods[item._id.payment_method]) {
        stats.paymentMethods[item._id.payment_method] = {
          count: 0,
          revenue: 0,
          quantity: 0
        };
      }
      
      stats.paymentMethods[item._id.payment_method].count += item.invoices;
      stats.paymentMethods[item._id.payment_method].revenue += item.revenue;
      stats.paymentMethods[item._id.payment_method].quantity += item.quantity;
    });

    const analyticsArray = Array.from(groupedAnalytics.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    return res.status(200).json({
      status: true,
      message: "Dashboard analytics retrieved successfully",
      data: {
        groupBy,
        analytics: analyticsArray,
        summary: {
          totalPeriods: analyticsArray.length,
          totalInvoices: analyticsArray.reduce((sum, item) => sum + item.totalInvoices, 0),
          totalRevenue: analyticsArray.reduce((sum, item) => sum + item.totalRevenue, 0),
          totalQuantity: analyticsArray.reduce((sum, item) => sum + item.totalQuantity, 0)
        }
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return res.status(500).json({
      status: false,
      message: "HTTP 500 Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
};
