import { z } from "zod";

const categories = ["sale", "service", "job", "other"] as const;

export const announcementIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(5).max(50),
  description: z.string().min(10),
  price: z.number().positive(),
  category: z.enum(categories),
});

export const updateAnnouncementSchema = z
  .object({
    title: z.string().min(5).max(50).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    category: z.enum(categories).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const announcementQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
});