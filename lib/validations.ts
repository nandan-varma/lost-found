import { z } from "zod";

export const createItemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000),
  status: z.enum(["lost", "found"]),
});

export const claimItemSchema = z.object({
  claimantName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  claimantEmail: z.string().email("Invalid email address"),
  message: z.string().max(500).optional(),
});
