import { Request, Response, NextFunction } from "express";
import jwt, { VerifyErrors } from "jsonwebtoken";
import { AppEnvs } from "../../../../server/read-env";

// Define the shape of the user payload for the JWT token
export interface UserPayload {
  userId: number;
  role: string;
}

// Augment the Request interface directly
declare module "express-serve-static-core" {
  interface Request {
    user?: UserPayload; // Adding user property to Request
  }
}

// Middleware to authenticate JWT tokens
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(
    token,
    AppEnvs.JWT_SECRET,
    (err: VerifyErrors | null, decoded: any) => {
      if (err) return res.status(403).json({ message: "Invalid access token" });

      req.user = decoded as UserPayload; // Type assertion
      next();
    }
  );
};
