import express from "express";
import { config } from "dotenv";
import { authenticateJWT } from "./middlewares/auth.middleware";
import { bookRouter } from "./routes/book.routes";
import { userRouter } from "./routes/user.routes";
import cookieParser from "cookie-parser";
import { Request, Response, NextFunction } from "express";

// Load environment variables
config();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cookieParser());

// Use routes
app.use("/books", authenticateJWT, bookRouter);
app.use("/users", userRouter);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
