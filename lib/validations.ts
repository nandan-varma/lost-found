import { z } from "zod";

const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

export const createItemSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000),
  organizationId: z.string().min(1, "Organization is required"),
  status: z.enum(["lost", "found"]),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
});

export const claimItemSchema = z.object({
  claimantEmail: z.string().email("Invalid email address"),
  claimantName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  message: z.string().max(500).optional(),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
});

export const createItemStatusSchema = z.enum(["lost", "found"]);

export const domainSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v === "" || DOMAIN_REGEX.test(v), {
    message: "Invalid domain format",
  });
