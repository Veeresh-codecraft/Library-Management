import { Request, Response } from "express";
import { BookRepository } from "../../src/book-management/books.repository";
import { DrizzleManager } from "../../src/drizzleDbConnection";
import { IBook } from "../../src/book-management/models/books.model";

const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
const repo = new BookRepository(db);

export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const idParam = req.query.id as string;
    if (idParam) {
      const id = parseInt(idParam, 10);
      const book = await repo.getById(id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      return res.status(200).json(book);
    } else {
      const pageParam = req.query.page as string;
      const limitParam = req.query.limit as string;
      const page = parseInt(pageParam ?? "1", 10);
      const limit = parseInt(limitParam ?? "10", 10);
      const offset = (page - 1) * limit;
      const allBooks = await repo.list({ limit, offset });
      return res.status(200).json(allBooks);
    }
  } catch (error) {
    console.error("Error fetching books:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createBook = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body) {
      return res.status(400).json({ error: "No book data provided" });
    }
    const result = await repo.create(body);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating book:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const idParam = req.query.id as string;
    if (!idParam || isNaN(Number(idParam))) {
      return res.status(400).json({ error: "Valid book ID is required" });
    }
    const id = parseInt(idParam, 10);
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: "No data provided for update" });
    }
    body.id = id;
    const result = await repo.update(id, body);
    if (!result) {
      return res.status(404).json({ error: "Book not found" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error updating book:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const idParam = req.query.id as string;
    if (!idParam) {
      return res.status(400).json({ error: "Book ID is required" });
    }
    const id = parseInt(idParam, 10);
    const book = await repo.getById(id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    const result = await repo.delete(id);
    if (!result) {
      return res.status(404).json({ error: "Book not found" });
    }
    return res.status(200).json({ message: "Book deleted successfully", book });
  } catch (error) {
    console.error("Error deleting book:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
