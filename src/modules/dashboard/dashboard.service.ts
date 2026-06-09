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

    const completedOrdersCount = await prisma.order.count({
      where: {
        status: {
          not: "CANCELLED",
        },
      },
    });

    const avgOrderValue = completedOrdersCount > 0 ? totalRevenueVal / completedOrdersCount : 0;

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
        completedOrders: completedOrdersCount,
        avgOrderValue: `₹${Number(avgOrderValue).toLocaleString("en-IN")}`,
        activeCustomers,
      },
      orderTrendData,
      revenueTrendData,
      categorySalesData,
      topProducts,
      recentOrders,
    };
  }
}

export const dashboardService = new DashboardService();
