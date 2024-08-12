// bookController.ts
import { Request, Response } from "express";
import { BookRepository } from "../repositories/bookRepository"; // Adjust path as necessary
import { MySql2Database } from "drizzle-orm/mysql2";
import { DrizzleManager } from "../drizzleDbConnection";
import { Book } from "../models/book.model"; // Adjust path as necessary

const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
const bookRepository = new BookRepository(db);

export const getBooks = async (req: Request, res: Response) => {
  try {
    const { limit, offset, search } = req.query;
    const books = await bookRepository.list({
      limit: parseInt(limit as string) || 10,
      offset: parseInt(offset as string) || 0,
      search: search as string,
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving books" });
  }
};

export const addBook = async (req: Request, res: Response) => {
  const { title, author, publishedDate } = req.body;
  try {
    const newBook = await bookRepository.create({
      title,
      author,
      publishedDate,
    });
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ message: "Error adding book" });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, author, publishedDate } = req.body;
  try {
    const updatedBook = await bookRepository.update(parseInt(id), {
      title,
      author,
      publishedDate,
    });
    if (updatedBook) {
      res.json(updatedBook);
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating book" });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deletedBook = await bookRepository.delete(parseInt(id));
    if (deletedBook) {
      res.json(deletedBook);
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting book" });
  }
};
