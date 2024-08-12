// bookRoutes.ts
import { Router } from "express";
import { authenticateUser } from "../middlewares/authMiddleware";
import { authorizeRole } from "../middlewares/roleMiddleware";
import { validateBook } from "../middlewares/validateBookMiddleware";

// Controller functions for book management
import {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController";

const router = Router();

// Routes for book management
router.get("/", authenticateUser, authorizeRole(["admin", "user"]), getBooks);
router.post(
  "/",
  authenticateUser,
  authorizeRole(["admin"]),
  validateBook,
  addBook
);
router.put(
  "/:id",
  authenticateUser,
  authorizeRole(["admin"]),
  validateBook,
  updateBook
);
router.delete("/:id", authenticateUser, authorizeRole(["admin"]), deleteBook);

export default router;
