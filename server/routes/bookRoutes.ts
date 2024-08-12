import { Router } from "express";
import {
  getAllBooks,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController";
import validateBookDataMiddleware from "../middleware/validateBookDataMiddleware";

const router = Router();

router.get("/", getAllBooks);
router.post("/", validateBookDataMiddleware, createBook);
router.patch("/", validateBookDataMiddleware, updateBook);
router.delete("/", deleteBook);

export default router;
