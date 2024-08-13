import express from "express";
import { config } from "dotenv";
import { authenticateJWT, authorizeRoles } from "./middlewares/auth.middleware";
import { bookRouter } from "./routes/book.routes";
import { userRouter } from "./routes/user.routes";
import cookieParser from "cookie-parser";
// Load environment variables
config();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cookieParser());
// Use routes
app.use("/books", authenticateJWT, bookRouter);
app.use("/users", userRouter);

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
