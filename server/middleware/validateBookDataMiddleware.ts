import { Request, Response, NextFunction } from "express";
import { IBook } from "../../src/book-management/models/books.model";

const validateBookDataMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (["POST", "PATCH"].includes(req.method)) {
    const body = req.body;

    const isValidBook = (data: any): data is Omit<IBook, "id"> => {
      return (
        typeof data.title === "string" &&
        typeof data.author === "string" &&
        typeof data.publisher === "string" &&
        typeof data.genre === "string" &&
        typeof data.isbnNo === "string" &&
        typeof data.numofPages === "number" &&
        typeof data.totalNumberOfCopies === "number" &&
        typeof data.availableNumberOfCopies === "number"
      );
    };

    if (!isValidBook(body)) {
      return res.status(400).json({ error: "Invalid book data format" });
    }
  }
  next();
};

export default validateBookDataMiddleware;
