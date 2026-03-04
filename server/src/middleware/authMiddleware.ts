import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretfallbackkey";

// Extend express Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      username?: string;
    }
  }
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res
          .status(403)
          .json({ status: "fail", message: "Forbidden - Invalid token" });
      }

      req.userId = user.userId;
      req.username = user.username;
      next();
    });
  } else {
    res
      .status(401)
      .json({ status: "fail", message: "Unauthorized - No token provided" });
  }
};
