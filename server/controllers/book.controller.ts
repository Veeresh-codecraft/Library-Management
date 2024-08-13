import { Request, Response } from "express";
import { BookRepository } from "../../src/book-management/books.repository";
import { IPageRequest } from "../../core/pagination.model";
import { IBookBase } from "../../src/book-management/models/books.model";
import { DrizzleManager } from "../../src/drizzleDbConnection";
import { booksTable } from "../../src/drizzle/schema";

const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
const bookRepository = new BookRepository(db);

export const getBooks = async (req: Request, res: Response) => {
  try {
    const bookId = req.query.id as string;
    const offset = req.query.offset as string;
    const limit = req.query.limit as string;
    const search = (req.query.search as string) || "";

    if (bookId) {
      const book = await bookRepository.getById(Number(bookId));
      res.status(200).json(book);
    } else if (offset && limit) {
      const pageRequest: IPageRequest = {
        offset: Number(offset),
        limit: Number(limit),
        search: search,
      };
      const paginatedBooks = await bookRepository.list(pageRequest);
      res.status(200).json(paginatedBooks);
    } else {
      const allBooks = await db.select().from(booksTable);
      res.status(200).json(allBooks);
    }
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const createBook = async (req: Request, res: Response) => {
  try {
    const bookData: IBookBase = req.body;
    const newBook = await bookRepository.create(bookData);
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const bookId = Number(req.query.id as string);
    const deletedBook = await bookRepository.delete(bookId);
    res.status(200).json(deletedBook);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
