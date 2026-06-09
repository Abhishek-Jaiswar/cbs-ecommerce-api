import z from "zod";

export const createAnnouncementSchema = z.object({
  text: z.string().min(1, { message: "Announcement text is required" }),
  link: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export const toggleAnnouncementStatusSchema = z.object({
  isActive: z.boolean(),
});

export type TCreateAnnouncementDTO = z.infer<typeof createAnnouncementSchema>;
export type TUpdateAnnouncementDTO = z.infer<typeof updateAnnouncementSchema>;
