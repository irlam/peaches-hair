import { z } from "zod";

export const posterSchema = z.object({
  title: z.string().trim().min(1).max(50),
  subtitle: z.string().trim().max(90),
  footer: z.string().trim().max(180),
  format: z.enum(["portrait", "square", "a4"]),
  rows: z.array(z.object({
    name: z.string().trim().min(1).max(65),
    price: z.string().trim().min(1).max(35),
  })).min(1).max(12),
});
export type PricePoster = z.infer<typeof posterSchema>;
export const POSTER_KEY = "design.price-list";
