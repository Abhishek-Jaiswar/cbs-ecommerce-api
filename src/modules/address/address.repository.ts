import { prisma } from "../../lib/prisma.js";
import type { TCreateAddress, TUpdateAddress } from "./address.types.js";

class AddressRepository {
  async getAddressesByUserId(userId: string) {
    return prisma.address.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getAddressById(id: string) {
    return prisma.address.findUnique({
      where: {
        id,
      },
    });
  }

  async createAddress(payload: TCreateAddress) {
    return prisma.$transaction(async (tx) => {
      if (payload.isDefaultShipping) {
        await tx.address.updateMany({
          where: { userId: payload.userId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }
      if (payload.isDefaultBilling) {
        await tx.address.updateMany({
          where: { userId: payload.userId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }

      return tx.address.create({
        data: payload,
      });
    });
  }

  async updateAddress(id: string, userId: string, payload: TUpdateAddress) {
    const data = Object.fromEntries(
      Object.entries(payload).filter((entry) => entry[1] !== undefined)
    );

    return prisma.$transaction(async (tx) => {
      if (payload.isDefaultShipping) {
        await tx.address.updateMany({
          where: { userId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }
      if (payload.isDefaultBilling) {
        await tx.address.updateMany({
          where: { userId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }

      return tx.address.update({
        where: {
          id,
        },
        data,
      });
    });
  }

  async deleteAddress(id: string) {
    return prisma.address.delete({
      where: {
        id,
      },
    });
  }
}

export const addressRepository = new AddressRepository();
