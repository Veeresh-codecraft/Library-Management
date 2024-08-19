import express from "express";
import jwt from "jsonwebtoken";

export interface UserPayload {
  userId: string;
}

export const authenticateJWT = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
      if (err) return res.sendStatus(403);
      (req as any).user = user; // Type casting for `user`
      next();
    });
  } else {
    res.sendStatus(401);
  }
};
