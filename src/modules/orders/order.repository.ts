import { prisma } from "../../lib/prisma.js";
// import { NotFoundError } from "../../utils/errors/app-error.js";
// import type { TCreateOrderDTO } from "./order.types.js";

class OrderRepository {
  async findOrders(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.order.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    };
  }

  async findOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });
  }

  async findUserOrdersByUserId(userId: string) {
    return prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        orderItems: true,
      },
    });
  }

  async findCartByUser(userId: string) {
    return prisma.cart.findUnique({
      where: {
        userId,
      },
      include: {
        items: true,
      },
    });
  }

//   async createOrder(userId: string, payload: TCreateOrderDTO) {
//     const result = await prisma.$transaction(async (tx) => {
//       const cart = await prisma.cart.findUnique({
//         where: {
//           userId,
//         },
//         include: {
//           items: true,
//         },
//       });

//       if (!cart || cart.items.length === 0) {
//         throw new NotFoundError("User cart not found");
//       }
//     });
//   }
}

export const orderRepository = new OrderRepository();
