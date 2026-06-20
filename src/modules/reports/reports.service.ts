import { prisma } from "../../lib/prisma.js";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";

// Helper for parsing date ranges
export function getDateRange(filter: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  // Set start of today and end of today
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (filter.toUpperCase()) {
    case "TODAY":
      start = startOfToday;
      end = endOfToday;
      break;
    case "YESTERDAY":
      start = new Date(startOfToday);
      start.setDate(start.getDate() - 1);
      end = new Date(endOfToday);
      end.setDate(end.getDate() - 1);
      break;
    case "LAST_7_DAYS":
    case "LAST 7 DAYS":
      start = new Date(startOfToday);
      start.setDate(start.getDate() - 7);
      end = endOfToday;
      break;
    case "LAST_30_DAYS":
    case "LAST 30 DAYS":
      start = new Date(startOfToday);
      start.setDate(start.getDate() - 30);
      end = endOfToday;
      break;
    case "THIS_MONTH":
    case "THIS MONTH":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = endOfToday;
      break;
    case "LAST_MONTH":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case "CUSTOM":
      if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
      } else {
        start = new Date(startOfToday);
        start.setDate(start.getDate() - 30);
      }
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end = endOfToday;
      }
      break;
    default:
      // Default to last 30 days
      start = new Date(startOfToday);
      start.setDate(start.getDate() - 30);
      end = endOfToday;
  }
  return { start, end };
}

class ReportsService {
  async getPreviewData(reportType: string, filter: string, startDate?: string, endDate?: string) {
    const { start, end } = getDateRange(filter, startDate, endDate);
    const type = reportType.toUpperCase();

    switch (type) {
      case "SALES":
        return this.getSalesData(start, end);
      case "PROFIT":
        return this.getProfitData(start, end);
      case "DISCOUNT":
        return this.getDiscountData(start, end);
      case "INVENTORY":
        return this.getInventoryData();
      case "PERFORMANCE":
        return this.getProductPerformanceData(start, end);
      case "CUSTOMER":
        return this.getCustomerData(start, end);
      case "ORDER":
        return this.getOrderReportData(start, end);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  // --- REPORT GENERATION SUB-QUERIES ---

  private async getSalesData(start: Date, end: Date) {
    // Orders paid in range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        paymentStatus: "PAID",
      },
      select: {
        totalAmount: true,
      },
    });

    const totalOrdersCount = await prisma.order.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    // Order Items paid in range
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          paymentStatus: "PAID",
        },
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
          },
        },
      },
    });

    const totalUnitsSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    // Grouping
    const productsMap: Record<string, { name: string; sku: string; quantity: number; revenue: number }> = {};
    const categoryMap: Record<string, { category: string; revenue: number; units: number }> = {};
    const brandMap: Record<string, { brand: string; revenue: number; units: number }> = {};

    orderItems.forEach((item) => {
      // Products
      const prodKey = item.productId || item.name;
      if (!productsMap[prodKey]) {
        productsMap[prodKey] = { name: item.name, sku: item.sku || "", quantity: 0, revenue: 0 };
      }
      productsMap[prodKey].quantity += item.quantity;
      productsMap[prodKey].revenue += Number(item.totalPrice);

      // Category
      const catName = item.product?.category?.name || "Uncategorized";
      if (!categoryMap[catName]) {
        categoryMap[catName] = { category: catName, revenue: 0, units: 0 };
      }
      categoryMap[catName].revenue += Number(item.totalPrice);
      categoryMap[catName].units += item.quantity;

      // Brand
      const brandName = item.product?.brand?.name || "No Brand";
      if (!brandMap[brandName]) {
        brandMap[brandName] = { brand: brandName, revenue: 0, units: 0 };
      }
      brandMap[brandName].revenue += Number(item.totalPrice);
      brandMap[brandName].units += item.quantity;
    });

    const topSellingProducts = Object.values(productsMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const revenueByCategory = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);
    const revenueByBrand = Object.values(brandMap).sort((a, b) => b.revenue - a.revenue);

    return {
      kpis: {
        totalRevenue,
        totalOrders: totalOrdersCount,
        totalUnitsSold,
        avgOrderValue,
      },
      topSellingProducts,
      revenueByCategory,
      revenueByBrand,
    };
  }

  private async getProfitData(start: Date, end: Date) {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        paymentStatus: "PAID",
      },
      select: {
        totalAmount: true,
      },
    });

    const grossRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          paymentStatus: "PAID",
        },
      },
      include: {
        product: {
          select: {
            costPrice: true,
            category: { select: { name: true } },
            brand: { select: { name: true } },
          },
        },
      },
    });

    let totalProductCost = 0;
    let totalProfit = 0;

    const productsMap: Record<
      string,
      { name: string; sku: string; revenue: number; cost: number; profit: number; marginPercentage: number }
    > = {};
    const categoryMap: Record<
      string,
      { category: string; revenue: number; cost: number; profit: number; marginPercentage: number }
    > = {};
    const brandMap: Record<
      string,
      { brand: string; revenue: number; cost: number; profit: number; marginPercentage: number }
    > = {};

    orderItems.forEach((item) => {
      const selling = Number(item.sellingPriceAtPurchase) > 0 ? Number(item.sellingPriceAtPurchase) : Number(item.unitPrice);
      const cost = Number(item.costPriceAtPurchase) > 0 ? Number(item.costPriceAtPurchase) : (item.product ? Number(item.product.costPrice) : 0);

      const itemCost = cost * item.quantity;
      const itemRevenue = Number(item.totalPrice);
      const itemProfit = itemRevenue - itemCost;

      totalProductCost += itemCost;
      totalProfit += itemProfit;

      // Group by product
      const prodKey = item.productId || item.name;
      if (!productsMap[prodKey]) {
        productsMap[prodKey] = { name: item.name, sku: item.sku || "", revenue: 0, cost: 0, profit: 0, marginPercentage: 0 };
      }
      productsMap[prodKey].revenue += itemRevenue;
      productsMap[prodKey].cost += itemCost;
      productsMap[prodKey].profit += itemProfit;

      // Group by category
      const catName = item.product?.category?.name || "Uncategorized";
      if (!categoryMap[catName]) {
        categoryMap[catName] = { category: catName, revenue: 0, cost: 0, profit: 0, marginPercentage: 0 };
      }
      categoryMap[catName].revenue += itemRevenue;
      categoryMap[catName].cost += itemCost;
      categoryMap[catName].profit += itemProfit;

      // Group by brand
      const brandName = item.product?.brand?.name || "No Brand";
      if (!brandMap[brandName]) {
        brandMap[brandName] = { brand: brandName, revenue: 0, cost: 0, profit: 0, marginPercentage: 0 };
      }
      brandMap[brandName].revenue += itemRevenue;
      brandMap[brandName].cost += itemCost;
      brandMap[brandName].profit += itemProfit;
    });

    // Finalize margins
    const profitMargin = grossRevenue > 0 ? (totalProfit / grossRevenue) * 100 : 0;

    const profitByProduct = Object.values(productsMap).map((p) => {
      p.marginPercentage = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
      return p;
    }).sort((a, b) => b.profit - a.profit);

    const profitByCategory = Object.values(categoryMap).map((c) => {
      c.marginPercentage = c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0;
      return c;
    }).sort((a, b) => b.profit - a.profit);

    const profitByBrand = Object.values(brandMap).map((b) => {
      b.marginPercentage = b.revenue > 0 ? (b.profit / b.revenue) * 100 : 0;
      return b;
    }).sort((a, b) => b.profit - a.profit);

    return {
      kpis: {
        grossRevenue,
        totalProductCost,
        totalProfit,
        profitMargin,
      },
      profitByProduct,
      profitByCategory,
      profitByBrand,
    };
  }

  private async getDiscountData(start: Date, end: Date) {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          paymentStatus: "PAID",
        },
      },
      include: {
        product: {
          select: {
            category: { select: { name: true } },
            brand: { select: { name: true } },
          },
        },
      },
    });

    // Coupon discounts
    const ordersWithCoupons = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        paymentStatus: "PAID",
        discountAmount: { gt: 0 },
      },
      select: {
        discountAmount: true,
      },
    });

    const couponDiscountsTotal = ordersWithCoupons.reduce((sum, o) => sum + Number(o.discountAmount), 0);

    let itemsDiscountTotal = 0;
    let totalMrpValueTotal = 0;

    const productsMap: Record<string, { name: string; sku: string; discountAmount: number; totalMrpValue: number; avgDiscountPercentage: number }> = {};
    const categoryMap: Record<string, { category: string; discountAmount: number }> = {};
    const brandMap: Record<string, { brand: string; discountAmount: number }> = {};

    orderItems.forEach((item) => {
      const selling = Number(item.sellingPriceAtPurchase) > 0 ? Number(item.sellingPriceAtPurchase) : Number(item.unitPrice);
      const mrp = Number(item.mrpAtPurchase) > 0 ? Number(item.mrpAtPurchase) : selling;

      const diff = Math.max(0, mrp - selling);
      const itemDiscount = diff * item.quantity;
      const itemMrpValue = mrp * item.quantity;

      itemsDiscountTotal += itemDiscount;
      totalMrpValueTotal += itemMrpValue;

      // Group product
      const prodKey = item.productId || item.name;
      if (!productsMap[prodKey]) {
        productsMap[prodKey] = { name: item.name, sku: item.sku || "", discountAmount: 0, totalMrpValue: 0, avgDiscountPercentage: 0 };
      }
      productsMap[prodKey].discountAmount += itemDiscount;
      productsMap[prodKey].totalMrpValue += itemMrpValue;

      // Group category
      const catName = item.product?.category?.name || "Uncategorized";
      if (!categoryMap[catName]) {
        categoryMap[catName] = { category: catName, discountAmount: 0 };
      }
      categoryMap[catName].discountAmount += itemDiscount;

      // Group brand
      const brandName = item.product?.brand?.name || "No Brand";
      if (!brandMap[brandName]) {
        brandMap[brandName] = { brand: brandName, discountAmount: 0 };
      }
      brandMap[brandName].discountAmount += itemDiscount;
    });

    const totalDiscountGiven = itemsDiscountTotal + couponDiscountsTotal;
    const avgDiscountPercentage = totalMrpValueTotal > 0 ? (itemsDiscountTotal / totalMrpValueTotal) * 100 : 0;

    const discountByProduct = Object.values(productsMap).map((p) => {
      p.avgDiscountPercentage = p.totalMrpValue > 0 ? (p.discountAmount / p.totalMrpValue) * 100 : 0;
      return p;
    }).sort((a, b) => b.discountAmount - a.discountAmount);

    const discountByCategory = Object.values(categoryMap).sort((a, b) => b.discountAmount - a.discountAmount);
    const discountByBrand = Object.values(brandMap).sort((a, b) => b.discountAmount - a.discountAmount);
    const highestDiscountedProducts = discountByProduct.slice(0, 10).map((p) => ({
      name: p.name,
      discountAmount: p.discountAmount,
    }));

    return {
      kpis: {
        totalDiscountGiven,
        avgDiscountPercentage,
      },
      discountByProduct,
      discountByCategory,
      discountByBrand,
      highestDiscountedProducts,
    };
  }

  private async getInventoryData() {
    const products = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
        category: true,
        brand: true,
      },
    });

    let totalProducts = products.length;
    let outOfStock = 0;
    let lowStock = 0;
    let totalInventoryValue = 0;

    const categoryMap: Record<string, { category: string; stock: number; value: number }> = {};
    const brandMap: Record<string, { brand: string; stock: number; value: number }> = {};
    const stockDetails: Array<{
      id: string;
      name: string;
      sku: string;
      color: string;
      size: string;
      stock: number;
      costPrice: number;
      value: number;
    }> = [];

    products.forEach((prod) => {
      const cost = Number(prod.costPrice || 0);

      prod.variants.forEach((v) => {
        const val = v.physicalQty * cost;
        totalInventoryValue += val;

        const availableStock = v.physicalQty - v.committedQty;
        if (availableStock === 0) {
          outOfStock += 1;
        } else if (availableStock < 10) {
          lowStock += 1;
        }

        // Categorized
        const catName = prod.category?.name || "Uncategorized";
        if (!categoryMap[catName]) {
          categoryMap[catName] = { category: catName, stock: 0, value: 0 };
        }
        categoryMap[catName].stock += v.physicalQty;
        categoryMap[catName].value += val;

        // Brand
        const brandName = prod.brand?.name || "No Brand";
        if (!brandMap[brandName]) {
          brandMap[brandName] = { brand: brandName, stock: 0, value: 0 };
        }
        brandMap[brandName].stock += v.physicalQty;
        brandMap[brandName].value += val;

        // Details
        stockDetails.push({
          id: prod.id,
          name: prod.name,
          sku: v.sku || "",
          color: v.color?.name || "",
          size: v.size?.value || "",
          stock: v.physicalQty,
          costPrice: cost,
          value: val,
        });
      });
    });

    const inventoryByCategory = Object.values(categoryMap).sort((a, b) => b.value - a.value);
    const inventoryByBrand = Object.values(brandMap).sort((a, b) => b.value - a.value);

    return {
      kpis: {
        totalProducts,
        outOfStock,
        lowStock,
        totalInventoryValue,
      },
      inventoryByCategory,
      inventoryByBrand,
      stockDetails: stockDetails.sort((a, b) => a.stock - b.stock),
    };
  }

  private async getProductPerformanceData(start: Date, end: Date) {
    // Fetch product view events from AnalyticsEvent
    const viewEvents = await prisma.analyticsEvent.groupBy({
      by: ["metadata"],
      where: {
        eventName: "page_view",
        createdAt: { gte: start, lte: end },
      },
      _count: {
        id: true,
      },
    });

    const viewsMap: Record<string, number> = {};
    viewEvents.forEach((evt) => {
      if (evt.metadata && typeof evt.metadata === "object") {
        const meta = evt.metadata as any;
        const productId = meta.productId;
        if (productId) {
          viewsMap[productId] = (viewsMap[productId] || 0) + evt._count.id;
        }
      }
    });

    // Fetch purchases in range
    const purchases = await prisma.orderItem.groupBy({
      by: ["productId", "name"],
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          paymentStatus: "PAID",
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const purchasesMap: Record<string, { name: string; quantity: number }> = {};
    purchases.forEach((p) => {
      if (p.productId) {
        purchasesMap[p.productId] = {
          name: p.name,
          quantity: p._sum.quantity || 0,
        };
      }
    });

    // Combine views and purchases
    const allProductIds = new Set([...Object.keys(viewsMap), ...Object.keys(purchasesMap)]);
    const productPerformanceList: Array<{
      id: string;
      name: string;
      views: number;
      purchases: number;
      conversionRate: number;
    }> = [];

    let totalViews = 0;
    let totalPurchases = 0;

    for (const prodId of allProductIds) {
      const views = viewsMap[prodId] || 0;
      const purchaseData = purchasesMap[prodId];
      const purchases = purchaseData ? purchaseData.quantity : 0;
      const name = purchaseData ? purchaseData.name : `Product ID: ${prodId}`;

      totalViews += views;
      totalPurchases += purchases;

      const conversionRate = views > 0 ? (purchases / views) * 100 : 0;

      productPerformanceList.push({
        id: prodId,
        name,
        views,
        purchases,
        conversionRate,
      });
    }

    const avgConversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

    return {
      kpis: {
        totalViews,
        totalPurchases,
        avgConversionRate,
      },
      productPerformance: productPerformanceList.sort((a, b) => b.purchases - a.purchases),
    };
  }

  private async getCustomerData(start: Date, end: Date) {
    const totalCustomers = await prisma.user.count({
      where: { role: "USER" },
    });

    const newCustomers = await prisma.user.count({
      where: {
        role: "USER",
        createdAt: { gte: start, lte: end },
      },
    });

    // Customers with orders
    const ordersGroupedByUser = await prisma.order.groupBy({
      by: ["userId"],
      where: {
        paymentStatus: "PAID",
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    const repeatCustomersCount = ordersGroupedByUser.filter((o) => o._count.id > 1).length;

    // Fetch user details for ranking
    const rankingPromises = ordersGroupedByUser.map(async (grp) => {
      const user = await prisma.user.findUnique({
        where: { id: grp.userId },
        select: { name: true, email: true },
      });
      return {
        userId: grp.userId,
        name: user?.name || "Unknown Customer",
        email: user?.email || "unknown@example.com",
        ordersCount: grp._count.id,
        clv: Number(grp._sum.totalAmount || 0),
      };
    });

    const customerRanking = await Promise.all(rankingPromises);

    return {
      kpis: {
        totalCustomers,
        newCustomers,
        repeatCustomers: repeatCustomersCount,
      },
      customerRanking: customerRanking.sort((a, b) => b.clv - a.clv),
    };
  }

  private async getOrderReportData(start: Date, end: Date) {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        orderNumber: true,
        fullname: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        subtotalAmount: true,
        discountAmount: true,
        shippingAmount: true,
        taxAmount: true,
        totalAmount: true,
      },
    });

    const totalOrders = orders.length;

    // Status counts
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    const paymentStatusCounts: Record<string, number> = {
      PENDING: 0,
      PAID: 0,
      FAILED: 0,
      REFUNDED: 0,
    };

    let totalAmountSum = 0;

    orders.forEach((o) => {
      const statusStr = o.status as string;
      const paymentStatusStr = o.paymentStatus as string;
      if (statusCounts[statusStr] !== undefined) {
        statusCounts[statusStr] += 1;
      }
      if (paymentStatusCounts[paymentStatusStr] !== undefined) {
        paymentStatusCounts[paymentStatusStr] += 1;
      }
      totalAmountSum += Number(o.totalAmount);
    });

    const avgOrderValue = totalOrders > 0 ? totalAmountSum / totalOrders : 0;

    // Timeline grouping (Daily)
    const timelineMap: Record<string, { date: string; count: number; amount: number }> = {};
    orders.forEach((o) => {
      const dateStr = new Date(o.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      if (!timelineMap[dateStr]) {
        timelineMap[dateStr] = { date: dateStr, count: 0, amount: 0 };
      }
      timelineMap[dateStr].count += 1;
      timelineMap[dateStr].amount += Number(o.totalAmount);
    });

    const orderTimeline = Object.values(timelineMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      kpis: {
        totalOrders,
        avgOrderValue,
        statusCounts,
        paymentStatusCounts,
      },
      orderTimeline,
      ordersDetails: orders.map((o) => ({
        orderNumber: o.orderNumber,
        customer: o.fullname,
        date: new Date(o.createdAt).toLocaleDateString("en-IN"),
        status: o.status,
        paymentStatus: o.paymentStatus,
        subtotal: Number(o.subtotalAmount),
        discount: Number(o.discountAmount),
        shipping: Number(o.shippingAmount),
        tax: Number(o.taxAmount),
        total: Number(o.totalAmount),
      })),
    };
  }

  // --- EXPORT SPREADSHEETS ---

  async generateReportFile(
    userId: string,
    reportType: string,
    filter: string,
    format: string,
    startDate?: string,
    endDate?: string
  ) {
    const data = await this.getPreviewData(reportType, filter, startDate, endDate);
    const type = reportType.toUpperCase();
    const fmt = format.toUpperCase();

    // Create target directory
    const publicPath = path.join(process.cwd(), "public", "reports");
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }

    const fileName = `report_${reportType.toLowerCase()}_${Date.now()}.${format.toLowerCase()}`;
    const filePath = path.join(publicPath, fileName);

    const wb = XLSX.utils.book_new();

    if (type === "SALES") {
      const sData = data as any;
      // Sheet 1: Overview
      const overview = [
        { Metric: "Total Revenue", Value: `₹${sData.kpis.totalRevenue.toLocaleString("en-IN")}` },
        { Metric: "Total Orders Placed (non-cancelled)", Value: sData.kpis.totalOrders },
        { Metric: "Total Units Sold", Value: sData.kpis.totalUnitsSold },
        { Metric: "Average Order Value (AOV)", Value: `₹${sData.kpis.avgOrderValue.toLocaleString("en-IN")}` },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), "Overview");

      // Sheet 2: Top Selling Products
      const products = sData.topSellingProducts.map((p: any) => ({
        "Product Name": p.name,
        SKU: p.sku,
        "Units Sold": p.quantity,
        Revenue: p.revenue,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products), "Top Selling Products");

      // Sheet 3: Category Revenue
      const cats = sData.revenueByCategory.map((c: any) => ({
        Category: c.category,
        Revenue: c.revenue,
        "Units Sold": c.units,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cats), "Revenue by Category");

      // Sheet 4: Brand Revenue
      const brands = sData.revenueByBrand.map((b: any) => ({
        Brand: b.brand,
        Revenue: b.revenue,
        "Units Sold": b.units,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(brands), "Revenue by Brand");
    } else if (type === "PROFIT") {
      const pData = data as any;
      const overview = [
        { Metric: "Gross Revenue", Value: `₹${pData.kpis.grossRevenue.toLocaleString("en-IN")}` },
        { Metric: "Total Product Cost", Value: `₹${pData.kpis.totalProductCost.toLocaleString("en-IN")}` },
        { Metric: "Total Profit", Value: `₹${pData.kpis.totalProfit.toLocaleString("en-IN")}` },
        { Metric: "Profit Margin %", Value: `${pData.kpis.profitMargin.toFixed(2)}%` },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), "Overview");

      const products = pData.profitByProduct.map((p: any) => ({
        "Product Name": p.name,
        SKU: p.sku,
        Revenue: p.revenue,
        Cost: p.cost,
        Profit: p.profit,
        "Margin %": `${p.marginPercentage.toFixed(2)}%`,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products), "Profit by Product");

      const cats = pData.profitByCategory.map((c: any) => ({
        Category: c.category,
        Revenue: c.revenue,
        Cost: c.cost,
        Profit: c.profit,
        "Margin %": `${c.marginPercentage.toFixed(2)}%`,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cats), "Profit by Category");

      const brands = pData.profitByBrand.map((b: any) => ({
        Brand: b.brand,
        Revenue: b.revenue,
        Cost: b.cost,
        Profit: b.profit,
        "Margin %": `${b.marginPercentage.toFixed(2)}%`,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(brands), "Profit by Brand");
    } else if (type === "DISCOUNT") {
      const dData = data as any;
      const overview = [
        { Metric: "Total Discount Given", Value: `₹${dData.kpis.totalDiscountGiven.toLocaleString("en-IN")}` },
        { Metric: "Average Discount %", Value: `${dData.kpis.avgDiscountPercentage.toFixed(2)}%` },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), "Overview");

      const products = dData.discountByProduct.map((p: any) => ({
        "Product Name": p.name,
        SKU: p.sku,
        "Discount Amount": p.discountAmount,
        "Avg Discount %": `${p.avgDiscountPercentage.toFixed(2)}%`,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products), "Discount by Product");

      const cats = dData.discountByCategory.map((c: any) => ({
        Category: c.category,
        "Discount Amount": c.discountAmount,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cats), "Discount by Category");

      const brands = dData.discountByBrand.map((b: any) => ({
        Brand: b.brand,
        "Discount Amount": b.discountAmount,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(brands), "Discount by Brand");
    } else if (type === "INVENTORY") {
      const iData = data as any;
      const overview = [
        { Metric: "Total Distinct Products", Value: iData.kpis.totalProducts },
        { Metric: "Out of Stock Variants", Value: iData.kpis.outOfStock },
        { Metric: "Low Stock Variants (< 10)", Value: iData.kpis.lowStock },
        { Metric: "Total Inventory Value (Asset Cost)", Value: `₹${iData.kpis.totalInventoryValue.toLocaleString("en-IN")}` },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), "Overview");

      const stocks = iData.stockDetails.map((s: any) => ({
        "Product Name": s.name,
        SKU: s.sku,
        Color: s.color,
        Size: s.size,
        Stock: s.stock,
        "Cost Price": s.costPrice,
        "Asset Value": s.value,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stocks), "Stock Details");

      const cats = iData.inventoryByCategory.map((c: any) => ({
        Category: c.category,
        "Total Stock": c.stock,
        "Total Value": c.value,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cats), "Inventory by Category");

      const brands = iData.inventoryByBrand.map((b: any) => ({
        Brand: b.brand,
        "Total Stock": b.stock,
        "Total Value": b.value,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(brands), "Inventory by Brand");
    } else if (type === "PERFORMANCE") {
      const pfData = data as any;
      const overview = [
        { Metric: "Total Product Page Views", Value: pfData.kpis.totalViews },
        { Metric: "Total Purchases via Checkout", Value: pfData.kpis.totalPurchases },
        { Metric: "Average Product Conversion Rate %", Value: `${pfData.kpis.avgConversionRate.toFixed(2)}%` },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), "Overview");

      const perf = pfData.productPerformance.map((p: any) => ({
        "Product Name": p.name,
        Views: p.views,
        Purchases: p.purchases,
        "Conversion Rate %": `${p.conversionRate.toFixed(2)}%`,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(perf), "Product Performance");
    } else if (type === "CUSTOMER") {
      const cData = data as any;
      const overview = [
        { Metric: "Total Registered Customers", Value: cData.kpis.totalCustomers },
        { Metric: "New Customers in Date Range", Value: cData.kpis.newCustomers },
        { Metric: "Repeat Customers (>1 order)", Value: cData.kpis.repeatCustomers },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), "Overview");

      const ranking = cData.customerRanking.map((c: any) => ({
        "Customer Name": c.name,
        Email: c.email,
        "Orders Count": c.ordersCount,
        "Lifetime Spend (CLV)": c.clv,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ranking), "Customer Value Ranking");
    } else if (type === "ORDER") {
      const oData = data as any;
      const overview = [
        { Metric: "Total Orders", Value: oData.kpis.totalOrders },
        { Metric: "Average Order Value (AOV)", Value: `₹${oData.kpis.avgOrderValue.toLocaleString("en-IN")}` },
        { Metric: "Status PENDING", Value: oData.kpis.statusCounts.PENDING },
        { Metric: "Status PROCESSING", Value: oData.kpis.statusCounts.PROCESSING },
        { Metric: "Status SHIPPED", Value: oData.kpis.statusCounts.SHIPPED },
        { Metric: "Status DELIVERED", Value: oData.kpis.statusCounts.DELIVERED },
        { Metric: "Status CANCELLED", Value: oData.kpis.statusCounts.CANCELLED },
        { Metric: "Payment Status PAID", Value: oData.kpis.paymentStatusCounts.PAID },
        { Metric: "Payment Status PENDING", Value: oData.kpis.paymentStatusCounts.PENDING },
        { Metric: "Payment Status FAILED", Value: oData.kpis.paymentStatusCounts.FAILED },
        { Metric: "Payment Status REFUNDED", Value: oData.kpis.paymentStatusCounts.REFUNDED },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), "Overview");

      const details = oData.ordersDetails.map((o: any) => ({
        "Order Number": o.orderNumber,
        "Customer Name": o.customer,
        Date: o.date,
        Status: o.status,
        "Payment Status": o.paymentStatus,
        Subtotal: o.subtotal,
        Discount: o.discount,
        Shipping: o.shipping,
        Tax: o.tax,
        Total: o.total,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(details), "Order Details");

      const timeline = oData.orderTimeline.map((t: any) => ({
        Date: t.date,
        Count: t.count,
        "Total Amount": t.amount,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(timeline), "Timeline Daily");
    }

    if (fmt === "CSV") {
      // CSV only supports a single sheet, we export the primary sheet/data for simplicity
      const primarySheetName = wb.SheetNames[1] || wb.SheetNames[0] || "Overview";
      const ws = wb.Sheets[primarySheetName];
      if (ws) {
        const csvString = XLSX.utils.sheet_to_csv(ws);
        fs.writeFileSync(filePath, csvString);
      } else {
        throw new Error("Failed to extract sheet for CSV generation");
      }
    } else {
      // XLSX
      XLSX.writeFile(wb, filePath);
    }

    const { start, end } = getDateRange(filter, startDate, endDate);
    const dateRangeStr =
      type === "INVENTORY" ? "Current Snapshot" : `${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}`;

    // Register file in GeneratedReport database table
    const downloadUrl = `/public/reports/${fileName}`;
    const reportRecord = await prisma.generatedReport.create({
      data: {
        name: `${reportType.toLowerCase()}_report_${filter.toLowerCase().replace(/ /g, "_")}_${Date.now()}`,
        reportType: type,
        dateRange: dateRangeStr,
        format: fmt,
        downloadUrl,
        generatedById: userId,
      },
    });

    return reportRecord;
  }

  async getReportsHistory(userId: string) {
    return prisma.generatedReport.findMany({
      where: {
        generatedById: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export const reportsService = new ReportsService();
