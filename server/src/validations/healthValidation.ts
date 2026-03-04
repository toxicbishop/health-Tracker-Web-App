import { z } from "zod";
import { ParameterType } from "../types/health";

// Helper to strip HTML tags for basic sanitization
const stripHtml = (val: string) => val.replace(/<[^>]*>?/gm, "");

const BaseLogSchema = z.object({
  timestamp: z.string().datetime({ message: "Invalid ISO timestamp" }),
  notes: z.string().trim().transform(stripHtml).optional(),
});

export const WeightLogSchema = BaseLogSchema.extend({
  type: z.literal(ParameterType.WEIGHT),
  weight: z
    .number()
    .positive("Weight must be a positive number")
    .max(1000, "Weight value is too high"),
  unit: z.enum(["kg", "lbs"]),
});

export const BPLogSchema = BaseLogSchema.extend({
  type: z.literal(ParameterType.BLOOD_PRESSURE),
  systolic: z
    .number()
    .int()
    .min(70, "Systolic pressure must be at least 70 mmHg")
    .max(300, "Systolic pressure is too high (max 300 mmHg)"),
  diastolic: z
    .number()
    .int()
    .min(40, "Diastolic pressure must be at least 40 mmHg")
    .max(150, "Diastolic pressure is too high (max 150 mmHg)"),
}).refine((data) => data.systolic > data.diastolic, {
  message: "Systolic pressure must be greater than diastolic pressure",
  path: ["systolic"],
});

export const HeartRateLogSchema = BaseLogSchema.extend({
  type: z.literal(ParameterType.HEART_RATE),
  bpm: z
    .number()
    .int()
    .positive("BPM must be a positive integer")
    .max(300, "BPM value is too high"),
});

export const HealthLogSchema = z.discriminatedUnion("type", [
  WeightLogSchema,
  BPLogSchema,
  HeartRateLogSchema,
]);

export const HealthQuerySchema = z.object({
  type: z.nativeEnum(ParameterType).optional(),
});

export type ValidatedHealthLog = z.infer<typeof HealthLogSchema>;
export type ValidatedHealthQuery = z.infer<typeof HealthQuerySchema>;
