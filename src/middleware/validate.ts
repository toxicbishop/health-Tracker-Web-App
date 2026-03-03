import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

// Helper to recursively strip keys starting with $ to prevent NoSQL injection
const sanitizeNoSql = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => sanitizeNoSql(v));
  } else if (obj !== null && typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (!key.startsWith("$")) {
        sanitized[key] = sanitizeNoSql(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
};

export const validate = (
  schema: ZodSchema,
  property: "body" | "query" | "params" = "body",
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. First Pass: Sanitize against NoSQL injection (Defense in Depth)
      req[property] = sanitizeNoSql(req[property]);

      // 2. Second Pass: Strict schema validation and data type enforcement
      const parsedData = await schema.parseAsync(req[property]);

      // 3. Final: Use the fully validated and sanitized data
      req[property] = parsedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: "fail",
          errors: error.issues.map((issue: any) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
