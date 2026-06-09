import { prisma } from "../../lib/prisma.js";
import type { TCreateAnnouncement, TUpdateAnnouncement } from "./announcement.types.js";

class AnnouncementRepository {
  async getAnnouncements(page: number, limit: number) {
    const [items, total] = await prisma.$transaction([
      prisma.announcement.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.announcement.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getActiveAnnouncements() {
    return prisma.announcement.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getAnnouncementById(id: string) {
    return prisma.announcement.findUnique({
      where: {
        id,
      },
    });
  }

  async createAnnouncement(payload: TCreateAnnouncement) {
    return prisma.announcement.create({
      data: {
        text: payload.text,
        link: payload.link ?? null,
        isActive: payload.isActive ?? true,
      },
    });
  }

  async updateAnnouncement(id: string, payload: TUpdateAnnouncement) {
    const data = Object.fromEntries(
      Object.entries(payload).filter((entry) => entry[1] !== undefined)
    );

    return prisma.announcement.update({
      where: {
        id,
      },
      data,
    });
  }

  async deleteAnnouncement(id: string) {
    return prisma.announcement.delete({
      where: {
        id,
      },
    });
  }
}

export const announcementRepository = new AnnouncementRepository();
