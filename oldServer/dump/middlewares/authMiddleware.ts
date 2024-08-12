import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwtUtils";

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    try {
      const user = verifyAccessToken(token);
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
  } else {
    return res.status(401).json({ message: "Authorization header missing" });
  }
};
