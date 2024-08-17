import express, { Request, Response, NextFunction, Router } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { config } from "dotenv";
import { BookRepository } from "../../src/book-management/books.repository";

import { IPageRequest } from "../../core/pagination.model";
import { IBookBase } from "../../src/book-management/models/books.model";
import { hashPassword, comparePassword } from "./passwordHashing";
import {
  generateAccessToken,
  generateRefreshToken,
} from "./jwtTokenGenerators";
import { IUser } from "../../src/user-management/models/user.model";
import { booksTable, usersTable } from "../../src/drizzle/schema";
import { eq } from "drizzle-orm";
import { DrizzleManager } from "../../src/drizzleDbConnection";
import { UserPayload } from "../../oldServer/dump/middlewares/middlewares/auth.middleware";

// Load environment variables
config();

const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
// Initialize Express app
const app = express();
app.use(express.json());
const userRouter = Router();

// Initialize database connection

const bookRepository = new BookRepository(db);

// Middleware for JWT authentication
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET || "default_access_token_secret";
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, accessTokenSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user as UserPayload;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Middleware for role-based authorization
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (roles.includes(req.user!.role)) {
      next();
    } else {
      res.sendStatus(403);
    }
  };
};

// Registration Route
userRouter.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const hashedPassword = await hashPassword(password);
    const newUser = {
      username,
      email,
      passwordHash: hashedPassword,
      role,
    };

    await (await db).insert(usersTable).values(newUser);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
});

// Login Route
userRouter.post("/login", async (req, res) => {
  try {
    const { username, passwordHash } = req.body;

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (!user) return res.status(400).json({ message: "User not found" });

    const isPasswordValid = await comparePassword(
      passwordHash,
      user[0].passwordHash
    );
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user[0] as IUser);
    const refreshToken = generateRefreshToken(user[0] as IUser);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
});

// GET /books - Retrieve books
app.get("/books", authenticateJWT, async (req, res) => {
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
});

// POST /books - Create a new book
app.post(
  "/books",
  authenticateJWT,
  authorizeRoles("admin", "librarian"),
  async (req, res) => {
    try {
      const bookData: IBookBase = req.body;
      const newBook = await bookRepository.create(bookData);
      res.status(201).json(newBook);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }
);

// DELETE /books - Delete a book by ID
app.delete(
  "/books",
  authenticateJWT,
  authorizeRoles("admin", "librarian"),
  async (req, res) => {
    try {
      const bookId = Number(req.query.id as string);
      const deletedBook = await bookRepository.delete(bookId);
      res.status(200).json(deletedBook);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }
);

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

app.use("/users", userRouter);
