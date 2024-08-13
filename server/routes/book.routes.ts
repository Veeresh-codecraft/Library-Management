import { Router } from "express";
import {
  getBooks,
  createBook,
  deleteBook,
} from "../controllers/book.controller";
import { authorizeRoles } from "../middlewares/auth.middleware";

export const bookRouter = Router();

bookRouter.get("/", getBooks);
bookRouter.post("/", authorizeRoles("admin", "librarian"), createBook);
bookRouter.delete("/", authorizeRoles("admin", "librarian"), deleteBook);
