import express, { Request, Response, NextFunction } from "express";
import { DrizzleManager } from "../src/drizzleDbConnection";
import { BookRepository } from "../src/book-management/books.repository";
import { UserRepository } from "../src/user-management/user.repository";
import { IBook } from "../src/book-management/models/books.model";
import { IUserBase, IUser } from "../src/user-management/models/user.model";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;

const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();

// Repositories
const bookRepo = new BookRepository(db);
const userRepo = new UserRepository(db);

// Middleware to parse JSON body
app.use(express.json());

// Global Middleware: Applies to all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  res.setHeader("X-Powered-By", "Node.js");
  next();
});

// Middleware to validate book data
const validateBookDataMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "POST" || req.method === "PATCH") {
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

// Middleware to validate user data
const validateUserDataMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "POST" || req.method === "PATCH") {
    const body = req.body;

    const isValidUser = (data: any): data is IUserBase => {
      return (
        typeof data.username === "string" &&
        typeof data.email === "string" &&
        typeof data.password === "string" &&
        typeof data.role === "string"
      );
    };

    if (!isValidUser(body)) {
      return res.status(400).json({ error: "Invalid user data format" });
    }
  }
  next();
};
const hashPasswordMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "POST" && req.url === "/users") {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    req.body.passwordHash = passwordHash;
    delete req.body.password; // Remove plain password from the body
  }
  next();
};
// Book Routes
app.get("/books", async (req: Request, res: Response) => {
  try {
    console.log("Fetching books...");
    const idParam = req.query.id as string;

    if (idParam) {
      const id = parseInt(idParam, 10);
      const book = await bookRepo.getById(id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      } else {
        console.log("Book fetched successfully:", book);
        return res.status(200).json(book);
      }
    } else {
      const pageParam = req.query.page as string;
      const limitParam = req.query.limit as string;

      const page = parseInt(pageParam ?? "1", 10);
      const limit = parseInt(limitParam ?? "10", 10);
      const offset = (page - 1) * limit;

      console.log(`Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

      const allBooks = await bookRepo.list({ limit, offset });

      console.log("Books fetched successfully:", allBooks);
      return res.status(200).json(allBooks);
    }
  } catch (error) {
    console.error("Error fetching books:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post(
  "/books",
  validateBookDataMiddleware,
  async (req: Request, res: Response) => {
    try {
      const body = req.body;
      console.log("Creating book with data:", body);

      if (!body) {
        return res.status(400).json({ error: "No book data provided" });
      }

      const result = await bookRepo.create(body);
      console.log("Book created successfully:", result);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating book:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.patch(
  "/books",
  validateBookDataMiddleware,
  async (req: Request, res: Response) => {
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

      const result = await bookRepo.update(id, body);

      if (!result) {
        return res.status(404).json({ error: "Book not found" });
      }

      console.log("Book updated successfully:", result);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error updating book:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.delete("/books", async (req: Request, res: Response) => {
  try {
    const idParam = req.query.id as string;

    if (!idParam) {
      return res.status(400).json({ error: "Book ID is required" });
    }

    const id = parseInt(idParam, 10);
    const book = await bookRepo.getById(id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const result = await bookRepo.delete(id);

    if (!result) {
      return res.status(404).json({ error: "Book not found" });
    } else {
      console.log("Book deleted successfully:", book);
      return res
        .status(200)
        .json({ message: "Book deleted successfully", book });
    }
  } catch (error) {
    console.error("Error deleting book:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// User Routes
app.get("/users", async (req: Request, res: Response) => {
  try {
    console.log("Fetching users...");
    const idParam = req.query.id as string;

    if (idParam) {
      const id = parseInt(idParam, 10);
      const user = await userRepo.getById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      } else {
        console.log("User fetched successfully:", user);
        return res.status(200).json(user);
      }
    } else {
      const pageParam = req.query.page as string;
      const limitParam = req.query.limit as string;

      const page = parseInt(pageParam ?? "1", 10);
      const limit = parseInt(limitParam ?? "10", 10);
      const offset = (page - 1) * limit;

      console.log(`Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

      const allUsers = await userRepo.list({ limit, offset });

      console.log("Users fetched successfully:", allUsers);
      return res.status(200).json(allUsers);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post(
  "/users",
  hashPasswordMiddleware,
  async (req: Request, res: Response) => {
    try {
      const body = await req.body;
      console.log("Creating user with data:", body);

      if (!body) {
        return res.status(400).json({ error: "No user data provided" });
      }
      console.log(body.password);
      const result = await userRepo.create(body);
      console.log("User created successfully:", result);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.patch(
  "/users",
  validateUserDataMiddleware,
  async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const idParam = req.query.id as string;

      if (!idParam || isNaN(Number(idParam))) {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      const id = parseInt(idParam, 10);

      if (!body || Object.keys(body).length === 0) {
        return res.status(400).json({ error: "No data provided for update" });
      }

      body.userId = id;

      const result = await userRepo.update(id, body);

      if (!result) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log("User updated successfully:", result);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.delete("/users", async (req: Request, res: Response) => {
  try {
    const idParam = req.query.id as string;

    if (!idParam) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const id = parseInt(idParam, 10);
    const user = await userRepo.getById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = await userRepo.delete(id);

    if (!result) {
      return res.status(404).json({ error: "User not found" });
    } else {
      console.log("User deleted successfully:", user);
      return res
        .status(200)
        .json({ message: "User deleted successfully", user });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
