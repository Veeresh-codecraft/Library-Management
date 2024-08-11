import express, { Request, Response, NextFunction } from "express";
import { BookRepository } from "../../../src/book-management/books.repository";
import { IBook } from "../../../src/book-management/models/books.model";
import { DrizzleManager } from "../../../src/drizzleDbConnection";

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to validate book data
const validateBookDataMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "POST" || req.method === "PATCH") {
    const body = req.body;

    // Define the expected keys and their types
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

    // Check if the body is valid
    if (!isValidBook(body)) {
      return res.status(400).json({ error: "Invalid book data format" });
    }
  }

  next();
};
const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
// Instantiate BookRepository
const repo = new BookRepository(db);

app.get("/books", async (req: Request, res: Response) => {
  const { id, page = 1, limit = 10 } = req.query;

  if (id) {
    const book = await repo.getById(Number(id));
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    return res.json(book);
  } else {
    const offset = (Number(page) - 1) * Number(limit);
    const books = await repo.list({ limit: Number(limit), offset });
    res.json(books);
  }
});

app.post(
  "/books",
  validateBookDataMiddleware,
  async (req: Request, res: Response) => {
    const book = req.body;

    try {
      const result = await repo.create(book);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating book:", error);
      res
        .status(500)
        .json({ error: "An error occurred while creating the book" });
    }
  }
);

app.patch(
  "/books",
  validateBookDataMiddleware,
  async (req: Request, res: Response) => {
    const id = Number(req.query.id);
    const body = req.body;

    try {
      const result = await repo.update(id, body);

      if (!result) {
        return res.status(404).json({ error: "Book not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error updating book:", error);
      res
        .status(500)
        .json({ error: "An error occurred while updating the book" });
    }
  }
);

app.delete("/books", async (req: Request, res: Response) => {
  const id = Number(req.query.id);

  try {
    const book = await repo.getById(id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    await repo.delete(id);

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the book" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
