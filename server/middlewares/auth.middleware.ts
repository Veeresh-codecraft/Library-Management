import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

export interface UserPayload {
  userId: number;
  role: string;
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "";
  const normalTokenSecret = process.env.JWT_SECRET || "";
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    // First, try verifying with the accessTokenSecret
    jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
        // If verification with accessTokenSecret fails, try normalTokenSecret
        jwt.verify(token, normalTokenSecret, (err, user) => {
          if (err) {
            return res.sendStatus(403); // If both fail, return 403
          }
          (req as any).user = user; // Assign user from normalTokenSecret
          next();
        });
      } else {
        (req as any).user = user; // Assign user from accessTokenSecret
        next();
      }
    });
  } else {
    res.sendStatus(401);
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as UserPayload;

    if (user && roles.includes(user.role)) {
      next();
    } else {
      res.sendStatus(403);
    }
  };
};
