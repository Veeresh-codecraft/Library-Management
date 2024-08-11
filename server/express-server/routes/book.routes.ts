import express from "express";
import {
  getAllBooks,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/book.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/books", authMiddleware, getAllBooks);
router.post("/books", authMiddleware, createBook);
router.patch("/books", authMiddleware, updateBook);
router.delete("/books", authMiddleware, deleteBook);

export default router;
