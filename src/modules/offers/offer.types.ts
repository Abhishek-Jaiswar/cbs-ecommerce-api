import type { DiscountType } from "../../generated/prisma/enums.js";

export type TOfferDTO = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
};
