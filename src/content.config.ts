import fs from "node:fs";
import path from "node:path";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Production safety check: enforce zero "TODO" values in production builds
if (
  process.env.STRICT_PROD === "true" ||
  process.env.VERIFY_NO_TODO === "true"
) {
  const feesDir = path.resolve("./src/data/fees");
  if (fs.existsSync(feesDir)) {
    const files = fs.readdirSync(feesDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(feesDir, file), "utf-8");
      if (content.includes('"TODO"') || content.includes(': "TODO"')) {
        throw new Error(
          `[FATAL] Production build rejected: Fee data file '${file}' contains unverified 'TODO' values. All rates must be verified against official sources before production deployment.`,
        );
      }
    }
  }
}

export const feeRateSchema = z.object({
  fee_kind: z.enum([
    "commission",
    "referral",
    "payment_processing",
    "listing",
    "final_value",
    "regulatory_operating",
    "revenue_share",
    "subscription",
    "other",
  ]),
  name: z.string(),
  calculation_type: z.enum([
    "percent",
    "fixed",
    "percent_plus_fixed",
    "tiered",
    "todo",
  ]),
  percentage: z.number().min(0).max(100).optional(),
  fixed_amount: z.number().min(0).optional(),
  currency: z.string().optional(),
  applies_to: z
    .enum([
      "item_price",
      "total_buyer_paid",
      "per_order",
      "per_listing",
      "per_unit",
      "revenue_split",
    ])
    .default("total_buyer_paid"),
  notes: z.string().optional(),
});

export type FeeRate = z.infer<typeof feeRateSchema>;

export const platformFeeSchema = z.object({
  platform: z.string().min(1, "platform cannot be empty"),
  platform_name: z.string().min(1),
  region: z.string().min(1),
  currency: z.string().length(3),
  rates: z.union([
    z.literal("TODO"),
    z.array(feeRateSchema),
    z.record(
      z.string(),
      z.union([feeRateSchema, z.literal("TODO"), z.number()]),
    ),
  ]),
  effective_from: z.string().min(1),
  verified_on: z.string().min(1, "verified_on cannot be empty"),
  source_url: z.string().url("source_url must be a valid official URL"),
  notes: z.string().default(""),
});

export type PlatformFee = z.infer<typeof platformFeeSchema>;

const fees = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/data/fees" }),
  schema: platformFeeSchema,
});

export const collections = { fees };
