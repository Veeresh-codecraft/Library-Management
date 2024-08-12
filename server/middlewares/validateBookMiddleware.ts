// validateBookMiddleware.ts
import { Request, Response, NextFunction } from "express";

export const validateBook = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { title, author } = req.body;

  if (!title || !author) {
    return res.status(400).json({ message: "Title and author are required" });
  }

  next();
};
