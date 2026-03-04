import { Router, Request, Response, NextFunction } from "express";
import { HealthLog } from "../types/health";
import { validate } from "../middleware/validate";
import {
  HealthLogSchema,
  HealthQuerySchema,
} from "../validations/healthValidation";

import { googleSheetsService } from "../services/googleSheetsService";

import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

/**
 * @route   POST /health-log
 * @desc    Create a new health log entry and save to Google Sheets
 * @access  Private
 */
router.post(
  "/",
  authenticateJWT,
  validate(HealthLogSchema as any),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logData: HealthLog = req.body;

      // Attach userId from the JWT token
      logData.userId = req.userId as string;

      // Save to Google Sheets
      await googleSheetsService.appendLog(logData);

      const newLog = {
        ...logData,
        id: Math.random().toString(36).substring(2, 9),
      };

      console.log(
        `[API]: New health log added and saved to Sheets: ${newLog.type}`,
      );
      res.status(201).json(newLog);
    } catch (error) {
      next(error); // Pass to global error handler
    }
  },
);

/**
 * @route   GET /health-log
 * @desc    Retrieve all health log entries for the logged-in user
 * @access  Private
 */
router.get(
  "/",
  authenticateJWT,
  validate(HealthQuerySchema as any, "query"),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId as string;
      const { type } = req.query;

      let filteredLogs = await googleSheetsService.getLogs(userId);

      if (type) {
        filteredLogs = filteredLogs.filter((log) => log.type === type);
      }

      res.json(filteredLogs);
    } catch (error) {
      console.error("[API Error]:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

export default router;
