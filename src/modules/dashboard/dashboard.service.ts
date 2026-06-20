import { prisma } from "../../lib/prisma.js";

class DashboardService {
  async getOverviewStats() {
    // 1. Calculate General KPI Cards
    const paidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
      },
      select: {
        totalAmount: true,
        userId: true,
      },
    });

    const totalRevenueVal = paidOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    const paidOrderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          paymentStatus: "PAID",
        },
      },
      include: {
        product: {
          select: {
            costPrice: true,
          },
        },
      },
    });

    let totalProfit = 0;
    paidOrderItems.forEach((item) => {
      const selling = Number(item.sellingPriceAtPurchase) > 0 ? Number(item.sellingPriceAtPurchase) : Number(item.unitPrice);
      const cost = Number(item.costPriceAtPurchase) > 0 ? Number(item.costPriceAtPurchase) : (item.product ? Number(item.product.costPrice) : 0);
      totalProfit += (selling - cost) * item.quantity;
    });

    const totalOrdersCount = await prisma.order.count();

    const totalCustomers = await prisma.user.count({
      where: {
        role: "USER",
      },
    });

    const totalProducts = await prisma.product.count();

    const variants = await prisma.productVariant.findMany({
      include: {
        product: {
          select: {
            costPrice: true,
          },
        },
      },
    });
    const inventoryValue = variants.reduce((sum, v) => sum + (v.physicalQty * Number(v.product?.costPrice || 0)), 0);

    const avgOrderValue = totalOrdersCount > 0 ? totalRevenueVal / totalOrdersCount : 0;
    const profitMarginPercentage = totalRevenueVal > 0 ? (totalProfit / totalRevenueVal) * 100 : 0;

    const uniqueUsersSet = new Set(paidOrders.map((o) => o.userId));
    const activeCustomers = uniqueUsersSet.size;

    // 2. Fetch Order Trends & Revenue Growth for the last 12 months
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const yearOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: oneYearAgo,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
      },
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendMap: { [key: string]: { date: string; month: string; orders: number; revenue: number; target: number } } = {};

    // Initialize map with last 12 calendar months to guarantee all months exist
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = months[d.getMonth()] as string;
      const year = d.getFullYear();
      const key = `${mName} ${year}`;
      trendMap[key] = {
        date: mName,
        month: mName,
        orders: 0,
        revenue: 0,
        target: 0, // baseline placeholder targets
      };
    }

    yearOrders.forEach((order) => {
      const d = new Date(order.createdAt);
      const mName = months[d.getMonth()] as string;
      const year = d.getFullYear();
      const key = `${mName} ${year}`;

      if (trendMap[key]) {
        if (order.status !== "CANCELLED") {
          trendMap[key].orders += 1;
        }
        if (order.paymentStatus === "PAID") {
          trendMap[key].revenue += Number(order.totalAmount);
        }
      }
    });

    // Populate baseline mock targets for visual interest in charts (e.g. 80% of revenue/orders)
    const orderTrendData = Object.values(trendMap).map((m) => ({
      date: m.date,
      orders: m.orders,
      target: Math.round(m.orders * 0.8) || 5, // fallback baseline target
    }));

    const revenueTrendData = Object.values(trendMap).map((m) => ({
      month: m.month,
      revenue: m.revenue,
      target: Math.round(m.revenue * 0.75) || 10000,
    }));

    // 3. Category Sales Distribution
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          paymentStatus: "PAID",
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const categoryMap: { [key: string]: { name: string; value: number; color: string } } = {};
    const colors = ["#eab308", "#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];

    orderItems.forEach((item) => {
      const categoryName = item.product?.category?.name || "Jewelry";
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = {
          name: categoryName,
          value: 0,
          color: (colors[Object.keys(categoryMap).length % colors.length] as string) || "#3b82f6",
        };
      }
      const existing = categoryMap[categoryName];
      if (existing) {
        existing.value += item.quantity;
      }
    });

    const categorySalesData = Object.values(categoryMap);

    // Fallback default category distribution if no purchases logged yet
    if (categorySalesData.length === 0) {
      categorySalesData.push(
        { name: "Rings", value: 0, color: "#eab308" },
        { name: "Necklaces", value: 0, color: "#f97316" },
        { name: "Earrings", value: 0, color: "#3b82f6" },
        { name: "Bracelets", value: 0, color: "#10b981" }
      );
    }

    // 4. Top Selling Products
    const topItems = await prisma.orderItem.groupBy({
      by: ["productId", "name", "image"],
      where: {
        order: {
          paymentStatus: "PAID",
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 4,
    });

    const topProducts = await Promise.all(
      topItems.map(async (item) => {
        let categoryName = "Jewelry";
        if (item.productId) {
          const prod = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { category: true },
          });
          categoryName = prod?.category?.name || "Jewelry";
        }
        return {
          id: item.productId || "",
          name: item.name,
          category: categoryName,
          sales: item._sum.quantity || 0,
          revenue: `₹${Number(item._sum.totalPrice || 0).toLocaleString("en-IN")}`,
          image: item.image,
          initials: item.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        };
      })
    );

    // 5. Recent Orders List
    const recentOrdersRaw = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const recentOrders = recentOrdersRaw.map((ord) => {
      const diffMs = Date.now() - new Date(ord.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 1000 / 60);
      const diffHours = Math.floor(diffMins / 60);
      let dateStr = "";

      if (diffMins < 60) {
        dateStr = diffMins <= 0 ? "Just now" : `${diffMins} mins ago`;
      } else if (diffHours < 24) {
        dateStr = `${diffHours} hours ago`;
      } else {
        dateStr = new Date(ord.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
      }

      return {
        id: ord.orderNumber,
        customer: ord.fullname || ord.user?.name || "Guest Customer",
        email: ord.user?.email || "guest@example.com",
        status: ord.status,
        total: `₹${Number(ord.totalAmount).toLocaleString("en-IN")}`,
        date: dateStr,
      };
    });

    return {
      kpis: {
        totalRevenue: `₹${Number(totalRevenueVal).toLocaleString("en-IN")}`,
        totalProfit: `₹${Number(totalProfit).toLocaleString("en-IN")}`,
        totalOrders: totalOrdersCount,
        totalCustomers,
        totalProducts,
        inventoryValue: `₹${Number(inventoryValue).toLocaleString("en-IN")}`,
        avgOrderValue: `₹${Number(avgOrderValue).toLocaleString("en-IN")}`,
        profitMarginPercentage: `${Number(profitMarginPercentage).toFixed(1)}%`,
      },
      orderTrendData,
      revenueTrendData,
      categorySalesData,
      topProducts,
      recentOrders,
    };
  }

  async getCampaignBudgets() {
    return prisma.campaignBudget.findMany({
      orderBy: { campaignName: "asc" },
    });
  }

  async upsertCampaignBudget(data: { campaignName: string; budget: number; source: string | null; medium: string | null }) {
    return prisma.campaignBudget.upsert({
      where: { campaignName: data.campaignName },
      update: {
        budget: data.budget,
        source: data.source,
        medium: data.medium,
      },
      create: {
        campaignName: data.campaignName,
        budget: data.budget,
        source: data.source,
        medium: data.medium,
      },
    });
  }

  async logEvent(data: { eventName: string; utmCampaign: string | null; utmSource: string | null; utmMedium: string | null; sessionValue: string | null; metadata: any }) {
    return prisma.analyticsEvent.create({
      data: {
        eventName: data.eventName,
        utmCampaign: data.utmCampaign,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        sessionValue: data.sessionValue,
        metadata: data.metadata || undefined,
      },
    });
  }

  async getUtmReports() {
    // Fetch all campaigns with budgets
    const budgets = await prisma.campaignBudget.findMany();
    
    // Fetch all orders with UTM campaigns
    const orders = await prisma.order.findMany({
      where: {
        utmCampaign: { not: null },
      },
      select: {
        utmCampaign: true,
        utmSource: true,
        utmMedium: true,
        totalAmount: true,
        paymentStatus: true,
      },
    });

    // Fetch click/page_view and add_to_cart counts from AnalyticsEvent
    const events = await prisma.analyticsEvent.groupBy({
      by: ["utmCampaign", "eventName"],
      where: {
        utmCampaign: { not: null },
      },
      _count: {
        id: true,
      },
    });

    // Aggregate everything by campaign name
    const campaignMap: Record<string, {
      campaignName: string;
      source: string | null;
      medium: string | null;
      clicks: number;
      addToCarts: number;
      totalOrders: number;
      paidOrders: number;
      revenue: number;
      spend: number;
    }> = {};

    // 1. Initialize with budgets
    budgets.forEach((b) => {
      campaignMap[b.campaignName] = {
        campaignName: b.campaignName,
        source: b.source,
        medium: b.medium,
        clicks: 0,
        addToCarts: 0,
        totalOrders: 0,
        paidOrders: 0,
        revenue: 0,
        spend: Number(b.budget),
      };
    });

    // 2. Add event stats
    events.forEach((evt) => {
      const campName = evt.utmCampaign!;
      if (!campaignMap[campName]) {
        campaignMap[campName] = {
          campaignName: campName,
          source: null,
          medium: null,
          clicks: 0,
          addToCarts: 0,
          totalOrders: 0,
          paidOrders: 0,
          revenue: 0,
          spend: 0,
        };
      }
      if (evt.eventName === "page_view") {
        campaignMap[campName].clicks = evt._count.id;
      } else if (evt.eventName === "add_to_cart") {
        campaignMap[campName].addToCarts = evt._count.id;
      }
    });

    // 3. Add order stats
    orders.forEach((ord) => {
      const campName = ord.utmCampaign!;
      if (!campaignMap[campName]) {
        campaignMap[campName] = {
          campaignName: campName,
          source: ord.utmSource,
          medium: ord.utmMedium,
          clicks: 0,
          addToCarts: 0,
          totalOrders: 0,
          paidOrders: 0,
          revenue: 0,
          spend: 0,
        };
      }
      
      const camp = campaignMap[campName];
      if (!camp.source && ord.utmSource) camp.source = ord.utmSource;
      if (!camp.medium && ord.utmMedium) camp.medium = ord.utmMedium;
      
      camp.totalOrders += 1;
      if (ord.paymentStatus === "PAID") {
        camp.paidOrders += 1;
        camp.revenue += Number(ord.totalAmount);
      }
    });

    // 4. Calculate ROI and conversion rates
    const campaignsList = Object.values(campaignMap).map((camp) => {
      const aov = camp.paidOrders > 0 ? camp.revenue / camp.paidOrders : 0;
      const conversionRate = camp.clicks > 0 ? (camp.paidOrders / camp.clicks) * 100 : 0;
      const netProfit = camp.revenue - camp.spend;
      const roi = camp.spend > 0 ? (netProfit / camp.spend) * 100 : 0;

      return {
        ...camp,
        aov,
        conversionRate,
        netProfit,
        roi,
      };
    });

    return campaignsList;
  }
}

export const dashboardService = new DashboardService();
