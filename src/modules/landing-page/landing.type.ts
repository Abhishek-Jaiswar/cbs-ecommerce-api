import type { Prisma } from "../../generated/prisma/client.js";

export type LandingPageCreateInput = Prisma.LandingPageCreateInput;
export type LandingPageUpdateInput = Prisma.LandingPageUpdateInput;

export interface LandingPageFilters {
    search?: string;
    isPublished?: boolean;
}