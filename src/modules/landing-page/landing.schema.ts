import z from "zod"
import { Prisma } from "../../generated/prisma/client.js"

export const createLandingPageSchema = z.object({

    title: z.string().min(2, "Title is required"),
    slug : z.string().min(2, "Slug is required"),
    description : z.string().optional(),
    imageUrl : z.string().url(),
    imagePublicId : z.string(),
    sections : z.any().optional(),
    isPublished : z.boolean().default(false),

    



})

export const updateLandingPageSchema = createLandingPageSchema.partial();
export type createLandingPageDto = z.infer<typeof createLandingPageSchema>;
export type updateLandingPageDto = z.infer<typeof updateLandingPageSchema>;